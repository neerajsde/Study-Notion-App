const { getPool } = require('../config/database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.auth = async (req, res, next) => {
    try {
        // Retrieve the token from cookies, body, or headers
        let token = req.cookies.StudyNotion || req.headers["authorization"]?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing",
            });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }

            // Check if the user exists in the database
            const Pool = getPool();
            const [result] = await Pool.query(`SELECT id, active FROM users WHERE id = ?`, [payload.id]);
            if (result.length < 0) {
                return res.status(409).json({ 
                    success: false,
                    message: 'user not found',
                });
            }
            const userData = result[0];

            if (!userData.active) {
                return res.status(403).json({
                    success: false,
                    message: "You are blocked",
                });
            }

            req.user = payload;
            next();
        });
    } catch (err) {
        console.log("Internal server error while authentication: ", err.message);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

exports.isStudent = async (req, res, next) => {
    try{
        if(req.user.role !== "Student"){
            return res.status(403).json({
                success: false,
                message: "You can't access this route.",
            });
        }
        next();
    } catch(err){
        console.log("Internal server error while authentication student: ", err.message);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

exports.isInstructor = async (req, res, next) => {
    try{
        if(req.user.role !== "Instructor"){
            return res.status(403).json({
                success: false,
                message: "You can't access this route.",
            });
        }
        next();
    } catch(err){
        console.log("Internal server error while authentication Instructor: ", err.message);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

exports.isAdmin = async (req, res, next) => {
    try{
        if(req.user.role !== "Admin"){
            return res.status(403).json({
                success: false,
                message: "You can't access this route.",
            });
        }
        next();
    } catch(err){
        console.log("Internal server error while authentication admin: ", err.message);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}