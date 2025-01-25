const express = require('express');
const router = express.Router();

const { auth, isStudent, isInstructor, isAdmin } = require('../middleware/Auth');
const { sendOtp, loginHandler, changePassword } = require('../controllers/Login');
const { signupHandler } = require('../controllers/Signup');
const { resetPasswordAndSendMailWithUrl, updatePassword } = require('../controllers/ResetPassword');
const { getProfile, updateProfile, deleteUser } = require('../controllers/Profile');
const { createCategory, getAllCategory } = require('../controllers/Category');
const { createCourse, getCourseDetails, showAllCourses } = require('../controllers/Course');
const { createSection, updateSection, deleteSection} = require('../controllers/Section');
const { createSubSection, updateSubSection, deleteSubSection } = require('../controllers/Subsection');

router.post('/send-otp', sendOtp);
router.post('/login', loginHandler);
router.post('/signup', signupHandler);
router.post('/change-password', auth, changePassword);
router.post('/reset-password', resetPasswordAndSendMailWithUrl);
router.post('/update-password', updatePassword);
// Profile
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.delete('/profile', auth, deleteUser);
// course
router.get('/course/:courseId', getCourseDetails);
router.post('/course', auth, isInstructor, createCourse);
router.get('/courses', showAllCourses);
router.post('/category', auth, isAdmin, createCategory);
router.get('/categories', getAllCategory);
// section
router.post('/section', auth, isInstructor, createSection);
router.put('/section', auth, isInstructor, updateSection);
router.delete('/section/:sectionId', auth, isInstructor, deleteSection);
// sub section
router.post('/subsection', auth, isInstructor, createSubSection);
router.put('/subsection', auth, isInstructor, updateSubSection);
router.delete('/subsection/:subSectionId', auth, isInstructor, deleteSubSection);

module.exports = router;
