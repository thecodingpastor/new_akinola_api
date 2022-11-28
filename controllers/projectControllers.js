const Project = require('../models/projectModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.createProject = catchAsync(async (req, res, next) => {
  const { title, description, isTeam, githubLink } = req.body;
  const project = await Project.create({
    title,
    description,
    isTeam,
    githubLink,
  });
  if (!project)
    return next(
      new AppError(
        'Could not create a new project. Please try after some time.',
        500
      )
    );

  res.status(200).json({
    status: 'success',
    project,
  });
});

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find().sort('-createdAt');
  if (!projects) return next(new AppError('Something went wrong', 500));
  res.status(200).json({
    status: 'success',
    projects,
  });
});

exports.getOneProject = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await Project.findById(projectId);

  if (!project)
    return next(new AppError('Could not find the project. Try later.', 400));

  res.status(200).json({ project });
});

exports.updatedProject = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const updatedProject = await Project.findByIdAndUpdate(projectId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedProject)
    return next(new AppError('Project could not be deleted. Try later.', 500));
  res.status(200).json({ project: updatedProject });
});

exports.deleteProject = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await Project.findByIdAndDelete(projectId);
  if (!project)
    return next(new AppError('Project could not be deleted. Try later.', 500));
  res.status(200).json({ status: 'success' });
});
