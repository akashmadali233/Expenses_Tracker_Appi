const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const app = express();

// Load MongoDB connection and models
const db = require('./models/index');

// Middleware Setup
app.use(cors({
    origin: 'http://localhost:5050',
}));

// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer().array()); // Multer for file uploads
app.use(helmet()); // Enable helmet for security headers
app.use(compression()); // Enable compression for performance
//app.use(morgan('combined', { stream: accessLogStream })); // Logging

// Routes Setup
const router = require('./routes/homeRoutes'); // Load your route files
app.use('/api', router);

// app.use((req, res) => {
//     res.sendFile(path.join(__dirname, `public/${req.url}`)); // Serve static files
// });

// Port Setup
const PORT = process.env.PORT || 8080;

// Start HTTP Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
