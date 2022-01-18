const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

module.exports = (req, res, next) => {

    //primeiro nos fazemos checagem basicas, que possumem menor valor de processamento

    const authHeader = req.headers.authorization;

    //checando se existe
    if (!authHeader) return res.status(401).send({error: "No token provided"});

    const parts = authHeader.split(' ');

    //checando se está dividida em duas partes
    if (parts.length !== 2) return res.status(401).send({ error: "Token error"});

    const [ scheme, token ] = parts;

    //checando se começa  com "Bearer"
    if (!/^Bearer$/i.test(scheme)) return res.status(400).send({ error: "Token malformatted"});


    //após todas as checagensm fazemos a tradução da hash/"token" para o id e obetemos esse ai
    jwt.verify(token, authConfig.secret, (err, decoded) => {

        if (err) return res.status(401).send( { error: "Token invalid"});

        req.userId = decoded.id;

        return next();

    })

};