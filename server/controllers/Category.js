const { getPool } = require('../config/database');
const encryptData  = require('../utlis/encrypt');

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'category name is required',
            });
        }

        const trimName = name.trim();

        const Pool = getPool();

        // Check if the tag already exists
        const [result] = await Pool.query(`SELECT * FROM Category WHERE name LIKE '${trimName}'`);
        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists',
            });
        }

        // Insert the new tag
        const [newCategory] = await Pool.query('INSERT INTO Category (name) VALUES (?)', [trimName]);
        if (newCategory.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                message: 'Error while creating the course category',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Category created successfully',
        });
    } catch (err) {
        console.error("Error while creating new category: ", err.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

exports.getAllCategory = async (req, res) => {
    try {
        const Pool = getPool();
        const [result] = await Pool.query('SELECT DISTINCT(name) FROM Category');

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Category Not Found' });
        }

        const payload = {
            success: true,
            message: 'Fetched All Catgories data securely',
            data: result,
        }

        // Encrypt the data
        const encryptedResult = encryptData(payload);

        res.status(200).json({encryptedResult, result}); // will remove result
    } catch (err) {
        console.error("Error while fetching Catgories: ", err.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
