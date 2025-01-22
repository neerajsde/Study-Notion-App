const express = require('express');
const router = express.Router();

const { auth, isStudent, isInstructor, isAdmin } = require('../middleware/Auth');
const { sendOtp, loginHandler, changePassword } = require('../controllers/Login');
const { signupHandler } = require('../controllers/Signup');
const { resetPasswordAndSendMailWithUrl, updatePassword } = require('../controllers/ResetPassword');

router.post('/send-otp', sendOtp);
router.post('/login', loginHandler);
router.post('/signup', signupHandler);
router.post('/change-password', auth, changePassword);
router.post('/reset-password', resetPasswordAndSendMailWithUrl);
router.post('/update-password', updatePassword);

module.exports = router;
