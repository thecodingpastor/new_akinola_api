const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: [5, 'Title cannot be less than 5 characters'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    minlength: [100, 'Description cannot have less than 100 valid characters'],
    maxlength: [
      2000,
      'Description cannot have more than 2000 valid characters',
    ],
  },
  isTeam: {
    type: Boolean,
    required: [
      true,
      'Please say if this a an individual or collaborative project',
    ],
  },
  githubLink: {
    type: String,
    trim: true,
    minlength: [20, 'Content cannot be less than 20 characters'],
    maxlength: [1000, 'Content cannot be more than 1000 characters'],
  },
  createdAt: { type: Date, default: Date.now() },
});

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
