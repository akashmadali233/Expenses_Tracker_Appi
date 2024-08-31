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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer().array()); // Multer for file uploads
app.use(helmet()); // Enable helmet for security headers
app.use(compression()); // Enable compression for performance

// Routes Setup
const router = require('./routes/homeRoutes'); // Load your route files
app.use('/api', router);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
