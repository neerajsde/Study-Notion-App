const { getPool } = require('../config/database');
const mailSender = require('../utlis/mailSender');
const {validateEmail} = require('../utlis/validateEmail');
const { sendResetPasswordMail } = require('../mails/reserPasswordMail');
const { sendPasswordChangeMail } = require('../mails/updatedPassword');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

exports.resetPasswordAndSendMailWithUrl = async(req, res) => {
    try{
        const { email } = req.body;
        if(!email){
            return res.status(401).json({ success: false, message: "Please enter your email"});
        }
        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email',
            });
        }
        
        const Pool = getPool();
        const [user] = await Pool.query(
            `SELECT id, name, email, active FROM users WHERE email = ?`, 
            [email.trim()]
        );

        if (!user || user.length === 0) {
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

        // Generate a secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 10 * 60 * 1000;

        // Store the token and expiry in Database 
        await Pool.query('UPDATE users SET token = ?, tokenExpirationTime = ? WHERE id = ?' , [resetToken, tokenExpiry, userData.id]);
        
        const url = `${process.env.FRONTEND_URL}/reset-password?session=${resetToken}`;
        // Send the reset email
        await mailSender(userData.email, 'Reset Password', sendResetPasswordMail(userData.name, url));

        res.status(200).json({
            success: true,
            message: 'Password reset instructions have been sent to your email.',
        });
    } catch(err){
        console.log("Error while reset password: ", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        })
    }
}

exports.updatePassword = async (req, res) => {
    try{
        const { token, newPassword } = req.body;

        if(!token || !newPassword){
            return res.status(404).json({success: false, message:"Fill All required fields"})
        }

        const Pool = getPool();
        const [user] = await Pool.query(
            `SELECT id, email, name, accountType, tokenExpirationTime FROM users WHERE token = ?`, 
            [token]
        );

        if (!user || user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid Token' 
            });
        }
        const userData = user[0];
        // Check if the token has expired
        if (Date.now() > userData.tokenExpirationTime) {
            return res.status(400).json({
                success: false,
                message: 'Token has expired.',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await Pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userData.id]);
        // Send email notification
        await mailSender(
            userData.email, 
            'Password Updated.', 
            sendPasswordChangeMail(userData.name, userData.accountType)
        );

        res.status(200).json({
            success: true,
            message: 'Password Updated.',
        });
    } catch (err) {
        console.error('Error in forgotPasswordUpdation:', err.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
}