const express = require('express');
const router = express.Router();

const projectControllers = require('../controllers/projectControllers');
const authControllers = require('../controllers/authControllers');

router.get('/', projectControllers.getAllProjects);
router.get('/:projectId', projectControllers.getOneProject);

// Admin Area
router.use(authControllers.protect);
router.post('/', projectControllers.createProject);
router.delete('/:projectId', projectControllers.deleteProject);
router.patch('/:projectId', projectControllers.updatedProject);

module.exports = router;
