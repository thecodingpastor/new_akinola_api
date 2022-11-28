const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    minlength: [5, 'Title cannot be less than 5 characters'],
    trim: true,
  },
  slug: {
    type: String,
    unique: [true, 'Tweak the title a bit, title already in use'],
  },
  description: {
    type: String,
    trim: true,
    minlength: [100, 'Description cannot have less than 100 valid characters'],
    maxlength: [200, 'Description cannot have more than 200 valid characters'],
  },
  estimatedReadTime: {
    type: String,
    required: [true, 'Estimated read time is required'],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  isSlider: {
    type: Boolean,
    default: false,
  },
  coverImage: String,
  assets: [
    {
      fileId: String,
      url: String,
    },
  ],
  content: {
    type: String,
    trim: true,
    minlength: [100, 'Content cannot be less than 100 characters'],
  },
  comments: [
    {
      author: {
        type: String,
        trim: true,
        minlength: [3, 'Author cannot be less than 3 characters.'],
        maxlength: [50, 'Author cannot be more than 50 characters.'],
      },
      text: {
        type: String,
        trim: true,
        minlength: [3, 'Comments cannot be less than 3 characters.'],
        maxlength: [300, 'Comments cannot be more than 300 characters.'],
      },
      createdAt: { type: Date, default: Date.now() },
    },
  ],
  likes: [String], //The strings are the random numbers generated and stored in the local storage,
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
