const bcrypt = require('bcryptjs/dist/bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mailer = require('../../modules/mailer')


const authConfig = require('../../config/auth.json')
const User = require('../models/User');
const { JsonWebTokenError } = require('jsonwebtoken');
const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    })
}

router.post('/register', async(req, res) => {

    const {email} = req.body

    try {

        if (await User.findOne({ email: email })) {
            
            return res.status(400).send({ error: 'Email already exist' })
       
        }
        const user = await User.create(req.body);

        user.password = undefined

        return res.send({ user, token: generateToken( {id : user.id} )})
    }
    catch(e){
        console.log(e)
        res.status(400).send( {error : "Registration Failed" } )
    }

});

router.post('/authenticate', async (req , res) => {

    const {email, password} = await req.body;

    const user = await User.findOne({ email }).select('+password')

    console.log(user)

    if(!user) return res.status(400).send({ error: "User not found" })

    if (!await bcrypt.compare(password, user.password)) return res.status(400).send({ error : "Invalid Password"})

    user.password = undefined

    res.send({ user, token: generateToken({ id: user.id })})
});

router.post('/forgot_passoword', async (req, res) => {

    const { email } = req.body;

    try{

        const user = await User.findOne({ email });

        if(!user) return res.status(400).send({ error: "User not found" });

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();

        now.setHours(now.getHours() + 1)


        await User.findByIdAndUpdate(user.id, {
            '$set':{
                passwordResetToken:token,
                passwordResetExpires:now
            }
        })

        mailer.sendMail({
            to: email,
            from:"lucasl.troncoso@gmail.com",
            template:"template",
            context:{ token },
            
        }, err => {
            
            if (err) return res.status(400).send({ error: "Cannot send forgot password email. "})
        });

        return res.send()
    }catch(err){
        res.status(400).send({erro: "Erro on forgot password, try again"})
    }
});

router.post('/reset_password', async (req, res) => {

    const {email, token, password } = req.body

    try{

        const user = await User.findOne( { email })
        .select("+passwordResetToken passwordResetExpires");

        console.log(user)

        if(!user) return res.status(400).send({ error: "User not found" });

        if(token !== user.passwordResetToken) return res.status(400).send({ error: "Token Invalido" });

        const now = Date.now()

        if(now > user.passwordResetExpires) return res.status(400).send({ error: "Token expirado, crie um novo" });

        user.password = password

        await user.save()

        res.send('Deu tudo certo')

    }catch(err){
        res.status(400).send({error: "Não conseguimos resetar sua senha"})
    };

});

module.exports = app => app.use('/auth', router)