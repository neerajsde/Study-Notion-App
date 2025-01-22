const { getPool } = require('../config/database');
const otpGenerator = require('otp-generator');
const mailSender = require('../utlis/mailSender');
const { sendUserOTPMail } = require('../mails/sendOtp');
const { sendPasswordChangeMail } = require('../mails/updatedPassword');
const {validateEmail} = require('../utlis/validateEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email',
            });
        }

        const Pool = getPool();

        // Check if user already exists
        const [result] = await Pool.query(`SELECT id FROM users WHERE email = ?`, [email.trim()]);
        if (result.length > 0) {
            return res.status(409).json({ // 409: Conflict
                success: false,
                message: 'User already exists',
            });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        // Send OTP email
        const isSent = await mailSender(email.trim(), 'Your OTP Code', sendUserOTPMail(otp));
        if (!isSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email',
            });
        }

        // Store OTP in the database with expiration time
        await Pool.query(
            `INSERT INTO otp (email, otp) VALUES (?, ?)`,
            [email.trim(), otp]
        );

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
        });
    } catch (err) {
        console.error('Error while sending OTP:', err.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

exports.loginHandler = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        const trimmedEmail = email.trim();
        const Pool = getPool();

        // Fetch user from the database
        const [user] = await Pool.query(
            `SELECT id, email, password, active, accountType FROM users WHERE email = ?`, 
            [trimmedEmail]
        );

        if (!user.length) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const userData = user[0];

        // Check if user is blocked
        if (!userData.active) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account is blocked for 24 hours' 
            });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'wrong password' 
            });
        }

        // Generate JWT token
        const payload = { id: userData.id, role: userData.accountType };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' });

        // Set token in cookies
        res.cookie('StudyNotion', token, {
            expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        });

        res.status(200).json({ 
            success: true, 
            user_id: userData.id, 
            token, 
            message: 'Login successful' 
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login',
            error: err.message 
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confPassword } = req.body;

        if (!oldPassword || !newPassword || !confPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const Pool = getPool();
        const [user] = await Pool.query(
            `SELECT id, name, email, password, accountType FROM users WHERE id = ?`, 
            [req.user.id]
        );

        if (!user || user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (newPassword !== confPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Confirm password does not match' 
            });
        }

        const userData = user[0];

        // Validate old password
        const isPasswordValid = await bcrypt.compare(oldPassword, userData.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Incorrect old password' 
            });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await Pool.query(
            'UPDATE users SET password = ? WHERE id = ?', 
            [hashedPassword, userData.id]
        );

        // Send email notification
        await mailSender(
            userData.email, 
            'Your OTP Code', 
            sendPasswordChangeMail(userData.name, userData.accountType)
        );

        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (err) {
        console.error('Change Password Error:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during password change',
            error: err.message 
        });
    }
};
