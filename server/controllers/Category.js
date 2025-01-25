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

//categoryPageDetails 
exports.categoryPageDetails = async (req, res) => {
    try {
        // Get category from request parameters
        const { category } = req.params;

        const Pool = getPool();

        // Get the selected category details
        const [[selectedCategory]] = await Pool.query(
            `SELECT * FROM Courses WHERE category = ?`,
            [category]
        );

        // Validation for category existence
        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: 'Data Not Found',
            });
        }

        // Get courses from different categories
        const [differentCategories] = await Pool.query(
            `SELECT * FROM Courses WHERE category != ?`,
            [category]
        );

        // Get top 10 selling courses with course details using JOIN
        const [topSellingProducts] = await Pool.query(
            `SELECT 
                c.id AS courseId, 
                c.courseName AS name, 
                c.category, 
                c.price, 
                COUNT(ce.userId) AS enrollmentCount
            FROM 
                CourseEnroll ce
            JOIN 
                Courses c ON ce.courseId = c.id
            GROUP BY 
                c.id, c.courseName, c.category, c.price
            ORDER BY 
                enrollmentCount DESC
            LIMIT 10`
        );

        // Send the response with all gathered data
        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategories,
                topSellingProducts
            },
        });
    } catch (error) {
        console.error("Error Occurred While Getting Course Category: ", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
