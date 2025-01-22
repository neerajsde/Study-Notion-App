CREATE DATABASE IF NOT EXISTS StudyNotionApp;
USE StudyNotionApp;

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phoneNumber VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    accountType ENUM('Admin', 'Instructor', 'Student'),
    active BOOLEAN DEFAULT TRUE,
    approve BOOLEAN DEFAULT FALSE,
    token VARCHAR(255),
    tokenExpirationTime BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    DOB DATE,
    about TEXT,
    contactNumber VARCHAR(15),
    user_img VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

CREATE TABLE Courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    courseName VARCHAR(255) NOT NULL,
    courseDescription TEXT,
    instructorId INT NOT NULL,
    whatYouWillLearn TEXT,
    courseContent TEXT,
    sectionId INT,
    price DECIMAL(10, 2),
    thumbnail VARCHAR(255),
    tagId INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructorId) REFERENCES Users(id)
);

CREATE TABLE Section (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sectionName VARCHAR(255) NOT NULL,
    courseId INT,
    FOREIGN KEY (courseId) REFERENCES Courses(id)
);

CREATE TABLE SubSection (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sectionId INT NOT NULL,
    title VARCHAR(255),
    timeDuration VARCHAR(50),
    description TEXT,
    videoURL VARCHAR(255),
    additionalURL VARCHAR(255),
    FOREIGN KEY (SectionId) REFERENCES Section(id)
);

CREATE TABLE RatingAndReviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    courseId INT NOT NULL,
    rating DECIMAL(3, 2) NOT NULL,
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE Tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    courseId INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE CourseProgress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    courseId INT NOT NULL,
    completedVideos INT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE CourseEnroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    courseId INT NOT NULL,
    enroll_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE Invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    courseId INT NOT NULL,
    price DECIMAL(10, 2),
    address VARCHAR(255),
    pincode VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE Otp (
	email VARCHAR(255) NOT NULL,
    otp INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;