CREATE DATABASE IF NOT EXISTS StudyNotionApp;
USE StudyNotionApp;

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(15),
    Password VARCHAR(255) NOT NULL,
    AccountType ENUM('Admin', 'Instructor', 'Student'),
    Active BOOLEAN DEFAULT TRUE,
    Approve BOOLEAN DEFAULT FALSE,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Gender ENUM('Male', 'Female', 'Other'),
    DOB DATE,
    About TEXT,
    ContactNumber VARCHAR(15),
    Updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(id)
);

CREATE TABLE Courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    CourseName VARCHAR(255) NOT NULL,
    CourseDescription TEXT,
    InstructorId INT NOT NULL,
    WhatYouWillLearn TEXT,
    CourseContent TEXT,
    SectionId INT,
    Price DECIMAL(10, 2),
    Thumbnail VARCHAR(255),
    TagId INT,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (InstructorId) REFERENCES Users(id)
);

CREATE TABLE Section (
    id INT AUTO_INCREMENT PRIMARY KEY,
    SectionName VARCHAR(255) NOT NULL,
    courseId INT,
    FOREIGN KEY (courseId) REFERENCES Courses(id)
);

CREATE TABLE SubSection (
    id INT AUTO_INCREMENT PRIMARY KEY,
    SectionId INT NOT NULL,
    Title VARCHAR(255),
    TimeDuration VARCHAR(50),
    Description TEXT,
    VideoURL VARCHAR(255),
    AdditionalURL VARCHAR(255),
    FOREIGN KEY (SectionId) REFERENCES Section(id)
);

CREATE TABLE RatingAndReviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    CourseId INT NOT NULL,
    Rating DECIMAL(3, 2) NOT NULL,
    Review TEXT,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    CourseId INT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE CourseProgress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    CourseId INT NOT NULL,
    CompletedVideos INT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE CourseEnroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    CourseId INT NOT NULL,
    enroll_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE Invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    CourseId INT NOT NULL,
    Price DECIMAL(10, 2),
    Address VARCHAR(255),
    Pincode VARCHAR(10),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(id),
    FOREIGN KEY (CourseId) REFERENCES Courses(id)
);

CREATE TABLE Otp (
	Email VARCHAR(255) NOT NULL,
    Otp INT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES;