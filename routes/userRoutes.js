const express = require('express');
const router = express.Router();

const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');

router.route('/login').post(authControllers.login);
router.route('/logout').get(authControllers.logout);
router.post('/', authControllers.createUser)

router.post('/forgot-password', authControllers.forgotPassword);
router.patch('/reset-password', authControllers.resetPassword);

router.use(authControllers.protect);
// This works cos the protect controller checks the token from the header or cookie to see if it is valid and sends back the user
router.route('/checkAuth').get(userControllers.checkAuth);

router
  .route('/user')
  .get(userControllers.getMe)
  .patch(userControllers.updateMe);

module.exports = router;
