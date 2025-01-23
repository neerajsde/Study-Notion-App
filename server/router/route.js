const express = require('express');
const router = express.Router();

const { auth, isStudent, isInstructor, isAdmin } = require('../middleware/Auth');
const { sendOtp, loginHandler, changePassword } = require('../controllers/Login');
const { signupHandler } = require('../controllers/Signup');
const { resetPasswordAndSendMailWithUrl, updatePassword } = require('../controllers/ResetPassword');
const { createTag, getAllTags } = require('../controllers/Tags');
const { createCourse, showAllCourses } = require('../controllers/Course');

router.post('/send-otp', sendOtp);
router.post('/login', loginHandler);
router.post('/signup', signupHandler);
router.post('/change-password', auth, changePassword);
router.post('/reset-password', resetPasswordAndSendMailWithUrl);
router.post('/update-password', updatePassword);
router.post('/tag', auth, isAdmin, createTag);
router.get('/tags', getAllTags);
router.post('/course', auth, isInstructor, createCourse);
router.get('/courses', showAllCourses);

module.exports = router;
