const { getPool } = require('../config/database');

// update user profile
exports.updateProfile = async (req, res) => {
    try{
        //get data
        const {dateOfBirth, about, contactNumber, gender} = req.body;
        //get userId
        const id = req.user.id;
        //validation
        if(!contactNumber || !gender || !id) {
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        } 

        const Pool = getPool();
        // UPDATE PROFILE
        let query = 'UPDATE Profile SET contactNumber = ?, gender = ?';
        const params = [contactNumber, gender];

        if (dateOfBirth) {
            query += ', dateOfBirth = ?';
            params.push(dateOfBirth);
        }

        if (about) {
            query += ', about = ?';
            params.push(about);
        }

        query += ' WHERE userId = ?';
        params.push(id);

        await Pool.query(query, params);

        //return response
        return res.status(200).json({
            success:true,
            message:'Profile Updated Successfully'
        });
    }
    catch(error) {
        console.log("Error while updating user profile: ", error.message);
        return res.status(500).json({
            success:false,
            error:error.message,
        });
    }
};  

// delete user profile
exports.deleteUser = async (req, res) => {
    try {
        // Get userId from the authenticated request
        const id = req.user.id;

        // Validate if userId exists
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const Pool = getPool();

        // Delete the user
        await Pool.query('UPDATE Users SET active = ? WHERE id = ?', [false, id]);

        // Return response
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Error while deleting user: ', error.message);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// get user Profile
exports.getProfile = async (req, res) => {
    try{
        const Pool = getPool();
        const [user] = await Pool.query('SELECT name, email, accountType, gender, dateOfBirth, about, contactNumber, user_img FROM users JOIN profile ON users.id = profile.userid WHERE users.id = ?', [req.user.id]);
        if(user.length === 0){
            return res.status(404).json({
                success: false,
                message: 'User Data Not Found'
            })
        }
        res.status(200).json({
            success: true,
            message: 'Found User data',
            userData: user[0]
        });
    } catch(err){
        console.log("Error While Getting User Profile: ", err.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error:err.message
        })
    }
}
