const crypto = require('crypto');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const cloudinary = require('../utils/cloudinary');
const slugify = require('slugify');

exports.createPost = catchAsync(async (req, res, next) => {
  const { title, coverImage, description, content, estimatedReadTime, assets } =
    req.body;

  const newPost = await Post.create({
    title,
    estimatedReadTime,
    coverImage,
    description,
    content,
    assets,
    slug: slugify(title, { strict: true, lower: true }),
  });

  res.status(200).json({
    status: 'success',
    newPost,
  });
});

exports.uploadFile = catchAsync(async (req, res, next) => {
  const result = await cloudinary.uploader.upload(req.body.data, {
    upload_preset: process.env.CLOUDINARY_PRESET,
  });
  if (!result)
    return next(new AppError('Could not upload image, please try again', 500));
  return res.json({ data: result });
});

exports.deleteFile = catchAsync(async (req, res, next) => {
  const { cloudStorageId, postSlug, databaseId, url } = req.body;
  if (postSlug) {
    // Deletes an image associated with a blogpost
    const post = await Post.findOne({ slug: postSlug });
    if (!post) return next(new AppError('Post not found', 500));
    const result = await cloudinary.uploader.destroy(cloudStorageId);
    if (!result)
      return next(new AppError('Could not delete file, try later.', 500));

    let newCoverImage;
    if (url === post.coverImage) {
      post.assets.pull({ _id: databaseId });
      const updatedPost = await post.save({ new: true });

      if (updatedPost.assets.length > 0) {
        newCoverImage =
          updatedPost.assets.find((asset) => !asset.url.includes('.pdf'))
            ?.url || '';
        updatedPost.coverImage = newCoverImage;
        await updatedPost.save({ new: true });
        return res
          .status(200)
          .json({ coverImage: post.coverImage, assets: post.assets });
      } else {
        updatedPost.coverImage = '';
        await updatedPost.save({ new: true });
        return res.status(200).json({ coverImage: '', assets: [] });
      }
    } else {
      post.assets.pull({ _id: databaseId });
      const updatedPost = await post.save({ new: true });
      return res.status(200).json({
        coverImage: updatedPost.coverImage,
        assets: updatedPost.assets,
      });
    }
  } else {
    // Deletes an uploaded image not associated with a post yet
    const result = await cloudinary.uploader.destroy(cloudStorageId);
    if (!result)
      return next(new AppError('Could not delete file, try later.', 500));
    res.status(200).json({ isSingleDeleted: true, fileId: cloudStorageId });
  }
});

exports.getPosts = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  const userId = req.query.userId;
  let user, posts;

  if (userId) {
    user = await User.findById(userId);
    if (!user) return next(new AppError('Access denied!', 400));
  }

  if (!user) {
    posts = await Post.find({ isPublished: true }).sort('-createdAt');
    // .limit(limit)
    // .skip(skip);
    if (!posts) return next(new AppError('Could not fetch posts at this time'));
  } else {
    posts = await Post.find().sort('-createdAt');
    // .limit(limit).skip(skip);
    if (!posts) return next(new AppError('Could not fetch posts at this time'));
  }

  res.status(200).json({
    status: 'success',
    result: posts.length,
    posts,
  });
});

exports.getSliderData = catchAsync(async (req, res, next) => {
  const sliderData = await Post.find({ isSlider: true }).select(
    'slug title coverImage description'
  );
  if (!sliderData) return next(new AppError('Could not fetch sliders', 500));
  if (sliderData.length === 0) return res.json({ sliderData: [] });
  res.json({ status: 'success', sliderData });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const post = await Post.findOne({ slug: slug });

  if (!post) return next(new AppError('Post not found', 404));
  res.status(200).json({
    status: 'success',
    post,
  });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const title = req.body.title;

  const post = await Post.findOne({ slug });
  if (!post) return next(new AppError('The post does not exist', 404));

  const updatedPost = await Post.findOneAndUpdate({ slug }, req.body, {
    new: true,
    runValidators: true,
  });

  if (
    slugify(updatedPost.title, {
      strict: true,
      lower: true,
    }) !== updatedPost.slug
  ) {
    updatedPost.slug = slugify(updatedPost.title, {
      strict: true,
      lower: true,
    });
    await updatedPost.save({ new: true, runValidators: true });
  }

  if (!updatedPost)
    return next(
      new AppError(`Something went wrong. Please try again later`, 500)
    );
  res.status(200).json({
    status: 'success',
    updatedPost,
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findByIdAndDelete(req.params.slug);
  if (post.assets.length > 0) {
    post.assets.forEach(async (asset) => {
      const result = await cloudinary.uploader.destroy(asset.fileId);
      if (!result)
        return next(new AppError('Could not delete file, try later.', 500));
    });
  }
  if (!post) return next(new AppError('Something went wrong', 500));
  res.status(200).json({ status: 'success' });
});

exports.likeOrUnlikePost = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const { author } = req.body;
  const post = await Post.findOne({ slug });
  if (!post)
    return next(new AppError('Could not find the post to react on', 400));

  let updatedPost, newLikeAuthor;

  if (author) {
    if (!post.likes.find((p) => p === author)) {
      // Then add like
      post.likes.push(author);
      updatedPost = await post.save({ new: true });
    } else {
      // remove like
      post.likes.pull(author);
      updatedPost = await post.save({ new: true });
    }
  } else {
    // generate new author id
    newLikeAuthor = crypto.randomBytes(16).toString('hex');
    // Then add like
    post.likes.push(newLikeAuthor);
    updatedPost = await post.save({ new: true });
  }

  return res.status(200).json({
    post: updatedPost,
    newLikeAuthor,
  });
});

exports.commentOnPost = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const { author, text } = req.body.data;

  const post = await Post.findOne({ slug });

  if (!post) return next(new AppError('The post does not exist', 400));
  post.comments.push({ author, text });
  const updatedPost = await post.save();
  res.status(200).json({ comments: updatedPost.comments });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.body;
  const postSlug = req.params.slug;

  const post = await Post.findOne({ slug: postSlug });
  if (!post) return next(new AppError('Post could not be found!', 400));

  post.comments.pull({ _id: commentId });
  const updatedPost = await post.save();

  if (!updatedPost)
    return next(
      new AppError('Something went wrong, reload and try again', 500)
    );

  res.status(200).json({ comments: updatedPost.comments });
});

exports.togglePublish = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post)
    return next(new AppError('Something is not right. Please try again', 500));

  if (post.isSlider && post.isPublished) {
    // If it's already a slider and you want to unpublish, then it is removed from slider and remove from published post
    post.isPublished = false;
    post.isSlider = false;
    await post.save();
  } else {
    post.isPublished = !post.isPublished;
    await post.save();
  }

  res.json({ isPublished: post.isPublished, isSlider: post.isSlider });
});

exports.toggleShowInSlider = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post)
    return next(new AppError('Something is not right. Please try again', 500));

  // If you are adding it to the slider, then you are automatically publishing it.
  if (!post.isSlider && !post.isPublished) {
    post.isSlider = true;
    post.isPublished = true;
    await post.save();
  } else if (!post.isSlider && post.isPublished) {
    post.isSlider = true;
    await post.save();
  } else {
    post.isSlider = false;
    await post.save();
  }

  if (!post.isPublished && !post.isSlider) {
    post.isSlider = !post.isSlider;
    await post.save();
  }

  res.json({ isSlider: post.isSlider, isPublished: post.isPublished });
});
