const { getPool } = require('../config/database');
const bcrypt = require('bcryptjs');
const {validateEmail} = require('../utlis/validateEmail');

exports.signupHandler = async (req, res) => {
    try {
        const { name, email, password, role, otp } = req.body;

        // Check if all fields are provided
        if (!name || !email || !password || !role || !otp) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        // Trim inputs to avoid unnecessary issues
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedRole = role.trim();

        // Validate email format
        if (!validateEmail(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email',
            });
        }

        const Pool = getPool();

        // Fetch user, and OTP details in parallel
        const [[user], [otpRecord]] = await Promise.all([
            Pool.query(`SELECT id FROM users WHERE email = ?`, [trimmedEmail]),
            Pool.query(`SELECT * FROM otp WHERE email = ? ORDER BY Created_at DESC LIMIT 1`, [trimmedEmail]),
        ]);

        // Check if user email already exists
        if (user.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User already exists',
            });
        }

        // Validate OTP
        if (!otpRecord.length) {
            return res.status(404).json({
                success: false,
                message: 'OTP not found or expired',
            });
        }

        const otpTimestamp = new Date(otpRecord[0].Created_at);
        const currentTime = new Date();
        const timeDifference = Math.abs(currentTime - otpTimestamp) / 1000 / 60; // in minutes

        if (timeDifference > 5) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired',
            });
        }

        if (otpRecord[0].otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect OTP',
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Start transaction
        const connection = await Pool.getConnection();
        try {
            await connection.beginTransaction();

            // Delete OTP after successful validation
            await connection.query('DELETE FROM otp WHERE email = ?', [otpRecord[0].email]);

            // Insert new user into the database
            const [insertResult] = await connection.query(
                'INSERT INTO users (name, email, password, AccountType) VALUES (?,?,?,?)',
                [trimmedName, trimmedEmail, hashedPassword, trimmedRole]
            );
            const userId = insertResult.insertId;

            await connection.query('INSERT INTO profile (userId) VALUES (?)',[userId]);

            await connection.commit();
        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

        res.status(200).json({
            success: true,
            message: 'Sign up successfully',
        });
    } catch (err) {
        console.error('Error while signing up:', err.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
