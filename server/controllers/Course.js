const { getPool } = require('../config/database');
const imageUploader = require('../utlis/imageUploader');

exports.createCourse = async (req, res) => {
  try {
      // Fetch data
      const { courseName, courseDescription, whatYoutWillLearn, price, category, tags } = req.body;
      const thumbnail = req.files?.img;

      // Validation
      if (!courseName || !courseDescription || !whatYoutWillLearn || !price || !category || !tags || !thumbnail) {
          return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      // Upload image
      const thumbnailImage = await imageUploader('CourseThumbnails', thumbnail);
      if (!thumbnailImage.flag) {
          return res.status(400).json({ success: false, message: thumbnailImage.message });
      }

      const pool = await getPool(); // Create a connection pool

      // Helper function for executing queries
      const executeQuery = async (query, params = []) => {
          const [results] = await pool.query(query, params);
          return results;
      };

      // Create a new course
      const insertCourseQuery = `
          INSERT INTO Courses 
          (courseName, courseDescription, instructorId, whatYouWillLearn, price, thumbnail, category) 
          VALUES (?,?,?,?,?,?,?)`;
      const insertCourseParams = [courseName, courseDescription, req.user.id, whatYoutWillLearn, price, thumbnailImage.url, category];
      const insertResult = await executeQuery(insertCourseQuery, insertCourseParams);

      if (insertResult.affectedRows === 0) {
          return res.status(500).json({ success: false, message: 'Error creating the course' });
      }

      const courseId = insertResult.insertId;

      // Link course with the instructor
      const enrollQuery = `INSERT INTO CourseEnroll (userId, courseId) VALUES (?,?)`;
      await executeQuery(enrollQuery, [req.user.id, courseId]);

      // Process tags
      const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      for (const tag of tagList) {
          // Check if tag already exists
          const checkTagQuery = `SELECT id FROM tags WHERE name = ?`;
          const existingTag = await executeQuery(checkTagQuery, [tag]);

          let tagId;
          if (existingTag.length > 0) {
              tagId = existingTag[0].id;
          } else {
              // Create a new tag
              const instructorNameQuery = `SELECT name FROM users WHERE id = ?`;
              const [instructorDetails] = await executeQuery(instructorNameQuery, [req.user.id]);

              const createTagQuery = `INSERT INTO tags (name, description) VALUES (?, ?)`;
              const tagDescription = `This tag ${tag} was created by ${instructorDetails.name}`;
              const newTagResult = await executeQuery(createTagQuery, [tag, tagDescription]);

              if (newTagResult.affectedRows === 0) {
                  return res.status(500).json({ success: false, message: 'Error creating the tag' });
              }

              tagId = newTagResult.insertId;
          }

          // Link tag to the course
          const tagCourseLinkQuery = `INSERT INTO TaggedCourse (tagId, courseId) VALUES (?,?)`;
          await executeQuery(tagCourseLinkQuery, [tagId, courseId]);
      }

      // Return success response
      return res.status(200).json({ success: true, message: 'Course Created Successfully' });
  } catch (error) {
      console.error('Error occurred while creating a new course:', error.message);
      return res.status(500).json({
          success: false,
          message: 'Failed to create course',
          error: error.message,
      });
  }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params;
        const Pool = getPool();

        // Fetch course details with instructor info in one query
        const [courseDetails] = await Pool.query(
            `SELECT c.*, u.name AS instructorName, u.user_img AS instructorImage 
             FROM Courses c 
             JOIN Users u ON c.instructorId = u.id 
             WHERE c.id = ?`, 
            [courseId]
        );

        if (courseDetails.length === 0) {
            return res.status(404).json({ success: false, message: "Course Not Found" });
        }

        const course = courseDetails[0];

        // Fetch all sections and their subsections in one go
        const [sectionsAndSubsections] = await Pool.query(
            `SELECT 
                s.id AS sectionId, s.sectionName, s.courseId,
                ss.id AS subSectionId, ss.title, ss.timeDuration, ss.description, ss.videoURL, ss.additionalURL 
             FROM Section s
             LEFT JOIN SubSection ss ON s.id = ss.sectionId
             WHERE s.courseId = ?
             ORDER BY ss.created_at ASC`,
            [courseId]
        );

        // Transform sections and group their subsections
        const sectionMap = {};
        sectionsAndSubsections.forEach(row => {
            if (!sectionMap[row.sectionId]) {
                sectionMap[row.sectionId] = {
                    sectionName: row.sectionName,
                    subSections: []
                };
            }
            if (row.subSectionId) {
                sectionMap[row.sectionId].subSections.push({
                    id: row.subSectionId,
                    title: row.title,
                    timeDuration: row.timeDuration,
                    description: row.description,
                    videoURL: row.videoURL,
                    additionalURL: row.additionalURL
                });
            }
        });

        const allSections = Object.values(sectionMap);

        const payload = {
            course,
            allSections
        };

        res.status(200).json({
            success: true,
            message: 'Course data found',
            data: payload
        });
    } catch (err) {
        console.error("Error occurred while fetching course details: ", err.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
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
                                            users.name AS instructorName,
                                            users.user_img AS instructorImg
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