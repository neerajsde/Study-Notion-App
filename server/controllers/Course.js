const { getPool } = require('../config/database');
const imageUploader = require('../utlis/imageUploader');

exports.createCourse = async (req, res) => {
    try {
      // Fetch data
      const { courseName, courseDescription, whatYoutWillLearn, price, tagId } = req.body;
  
      // Get thumbnail
      const thumbnail = req.files?.img;
  
      // Validation
      if (!courseName || !courseDescription || !whatYoutWillLearn || !price || !tagId || !thumbnail) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
  
      // Upload image
      const thumbnailImage = await imageUploader('CourseThumbnails', thumbnail);
      if (!thumbnailImage.flag) {
        return res.status(400).json({ success: false, message: thumbnailImage.message });
      }
  
      const pool = await getPool(); // Assuming getPool creates a connection pool
  
      // Create a new course
      const [insertResult] = await pool.query(
        'INSERT INTO Courses (courseName, courseDescription, instructorId, whatYouWillLearn, price, thumbnail, tagId) VALUES (?,?,?,?,?,?,?)',
        [courseName, courseDescription, req.user.id, whatYoutWillLearn, price, thumbnailImage.url, tagId]
      );
  
      if (insertResult.affectedRows === 0) {
        return res.status(500).json({ success: false, message: 'database error' });
      }
  
      // Add the new course to the user schema of Instructor
      await pool.query('INSERT INTO CourseEnroll (userId, courseId) VALUES (?,?)', [req.user.id, insertResult.insertId]);
  
      // Return response
      return res.status(200).json({ success: true, message: 'Course Created Successfully' });
    } catch (error) {
      console.error("Error Occured while create new course: ",error.message);
      return res.status(500).json({ success: false, message: 'Failed to create Course', error: error.message });
    }
};

//getAllCourses handler function
exports.showAllCourses = async (req, res) => {
    try {
        const pool = await getPool();

        const [allCourses] = await pool.query(`SELECT 
                                            courses.id AS id,
                                            courses.courseName AS courseName,
                                            courses.coursedescription AS description,
                                            courses.whatyouwilllearn AS whatyouwilllearn,
                                            courses.price AS price,
                                            courses.thumbnail AS thumbnail,
                                            courses.updated_at AS updatedAt,
                                            users.name AS instructorName
                                        FROM courses
                                        INNER JOIN users
                                        ON courses.instructorId = users.id`);

        return res.status(200).json({
            success:true,
            message:'Data for all courses fetched successfully',
            data:allCourses,
        })
    }
    catch(error) {
        console.log("Error while getting courses data: ", error);
        return res.status(500).json({
            success:false,
            message:'Cannot Fetch course data',
            error:error.message,
        })
    }
}