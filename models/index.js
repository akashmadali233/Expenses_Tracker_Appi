const mongoose = require('mongoose');
const dbConfig = require('../config/dbConfig');

// Connect to MongoDB
mongoose.connect(dbConfig.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

// Import models
const db = {};

db.User = require('../models/userModel');
db.Expense = require('../models/expenseModel');
db.Order = require('../models/orderModel');
db.ForgotPassword = require('../models/forgotPasswordModel');
db.S3BucketLink = require('../models/s3BucketLinksModel');

// No need to sync models like in Sequelize, just use them directly in your code

module.exports = db;
