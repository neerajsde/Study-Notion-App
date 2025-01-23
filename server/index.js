const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const route = require('./router/route');
const path = require('path');
const { connectToDatabase } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(fileUpload());
app.use(cookieParser());
app.use(cors());

// Database connection
connectToDatabase().catch((err) => {
  console.error("Database connection failed", err);
  process.exit(1);
});

// API routes
app.use('/api/v1', route);

// Serve static React files
const buildPath = path.join(__dirname, 'public');
app.use(express.static(buildPath));

// Fallback route for React app
app.get('/', (req, res) => {
  res.sendFile(path.resolve(buildPath, 'index.html'));
});

// Static file serving
app.use('/public', express.static(path.join(__dirname, 'public')));

// Error handling
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});