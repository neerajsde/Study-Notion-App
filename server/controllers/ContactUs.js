const { getPool } = require('../config/database');
const {validateEmail} = require('../utlis/validateEmail');
const mailSender = require('../utlis/mailSender');
const { contactUsClientEmail } = require('../mails/contactUsMail');
const { contactUsAdminEmail } = require('../mails/sendMailToAdmin');
require('dotenv').config();

exports.contactUs = async (req, res) => {
    try {
        const { userId, firstName, lastName, email, phone, message } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !message) {
            return res.status(400).json({ success: false, message: "Fill all required fields" });
        }

        // Trim inputs
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();
        const trimmedMessage = message.trim();

        // Validate email format
        if (!validateEmail(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email',
            });
        }

        const Pool = getPool();

        // Insert into the database
        const query = userId
            ? 'INSERT INTO ContactUs (userId, firstName, lastName, email, phone, message) VALUES (?,?,?,?,?,?)'
            : 'INSERT INTO ContactUs (firstName, lastName, email, phone, message) VALUES (?,?,?,?,?)';
        const params = userId
            ? [userId, trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPhone, trimmedMessage]
            : [trimmedFirstName, trimmedLastName, trimmedEmail, trimmedPhone, trimmedMessage];

        await Pool.query(query, params);

        // Send emails
        await mailSender(
            trimmedEmail,
            'Contact Form Submission Received',
            contactUsClientEmail(`${trimmedFirstName} ${trimmedLastName}`)
        );

        if (!process.env.CUSTOMER_SUPPORT_EMAIL) {
            console.error("CUSTOMER_SUPPORT_EMAIL is not defined in the environment variables.");
        } else {
            await mailSender(
                process.env.CUSTOMER_SUPPORT_EMAIL,
                'New Contact Form Submission',
                contactUsAdminEmail(
                    `${trimmedFirstName} ${trimmedLastName}`,
                    trimmedEmail,
                    trimmedPhone,
                    trimmedMessage
                )
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Contact us submitted successfully',
        });
    } catch (err) {
        console.error('Error occurred while submitting contact us:', err.stack);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: err.message,
        });
    }
};