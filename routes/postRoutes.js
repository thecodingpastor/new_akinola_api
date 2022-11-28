const express = require('express');
const router = express.Router();

const postControllers = require('../controllers/postControllers');
const authControllers = require('../controllers/authControllers');

router.get('/', postControllers.getPosts);
router.get('/slider-data', postControllers.getSliderData);
router.get('/:slug', postControllers.getPost);
// Reacting on posts
router.post('/:slug/react', postControllers.likeOrUnlikePost);
// Create a comment
router.post('/:slug/create-comment', postControllers.commentOnPost);

router.use(authControllers.protect);

router.post('/', postControllers.createPost);
router.post('/upload-file', postControllers.uploadFile);
router.delete('/delete-file', postControllers.deleteFile);

router
  .route('/:slug')
  .patch(postControllers.updatePost)
  .delete(postControllers.deletePost);

router.patch('/toggle-publish/:postId', postControllers.togglePublish);
router.patch('/toggle-slider/:postId', postControllers.toggleShowInSlider);

router.post('/:slug/delete-comment', postControllers.deleteComment);

module.exports = router;
