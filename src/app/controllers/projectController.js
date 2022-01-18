const express = require('express');

const router = express.Router();

const authMiddleware = require('../middlewares/auth');

const Project = require('../models/project');

const Task = require('../models/task');

router.use(authMiddleware);

router.get('/', async (req, res) => {

    try {
        
        const projects = await Project.find().populate(['user', 'tasks'])

        return res.send( {Projects: projects} );


    } catch (error) {

        return res.status(400).send({Error: "Não foi possivel listar esse projeto"});

    }
    
});

router.get('/:projectId', async (req, res) => {

    try {
        
        const projects = await Project.findById(req.params.projectId).populate('user');

        return res.send( {Projects: projects} );


    } catch (error) {

        return res.status(400).send({Error: "Não foi possivel listar projetos"});

    }
    
});

router.post('/', async (req, res) => {


    try{

        const {title, description, tasks} = req.body 

        console.log(tasks)

        const project = await Project.create({title,description, user:req.userId });

        await Promise.all(tasks.map(async task => {

            console.log(task)

            const projectTask = new Task({...task, project: project._id})

            await projectTask.save()

            project.tasks.push(projectTask);
        }));

        await project.save();

        return res.send({ project , id:req.userId})
        
    }catch(err){

        console.log(err)
        return res.status(400).send({Error: "Não foi possivel criar novo projeto;"})
    }

});

router.delete('/:projectId', async (req, res) => {
    try {
        
        const project  = await Project.findByIdAndRemove(req.params.projectId)

        if (!project) return res.status(400).send({Error: "Esse projeto não existe"})

        res.send({OK: "Deletado com sucesso"})


    } catch (error) {

        return res.status(400).send({Error: "Erro ao deletar o projeto"});

    }
});

router.put('/:projectId', async (req, res) => {


    try{

        const {title, description, tasks} = req.body 

        const project = await Project.findByIdAndUpdate(req.params.projectId,{
            title,
            description
        }, { new: true });

        project.tasks = []

        await Task.remove({ project: project._id})

        await Promise.all(tasks.map(async task => {

            console.log(task)

            const projectTask = new Task({...task, project: project._id})

            await projectTask.save()

            project.tasks.push(projectTask);
        }));

        await project.save();

        return res.send({ project , id:req.userId})
        
    }catch(err){

        console.log(err)
        return res.status(400).send({Error: "Não foi possivel Atualizar o projeto;"})
    }

});

module.exports = app => app.use('/projects', router)