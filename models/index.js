const dbConfig = require('../config/dbConfig');
const { Sequelize, DataTypes } = require('sequelize');
const Razorpay = require('razorpay');

const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        operatorsAliases: false,
        pool: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle
        }
    }
);

sequelize.authenticate()
    .then(() => {
        console.log('Connection to the database has been established successfully.');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;


// Define your models here
db.users = require('../models/userModel')(sequelize, DataTypes);
db.expenses = require('../models/expenseModel')(sequelize, DataTypes);
db.orders = require('../models/orderModel')(sequelize, DataTypes);
db.forgotpassword = require('../models/forgotPasswordModel')(sequelize, DataTypes);
db.s3bucketlinks = require('../models/s3BucketLinksModel')(sequelize, DataTypes);


// Define relationships between models
db.users.hasMany(db.expenses);
db.expenses.belongsTo(db.users);

db.users.hasMany(db.orders);
db.orders.belongsTo(db.users);

db.users.hasMany(db.forgotpassword);
db.forgotpassword.belongsTo(db.users);

db.users.hasMany(db.s3bucketlinks);
db.s3bucketlinks.belongsTo(db.users);


// Sync models with database
db.sequelize.sync({ force: false })
    .then(() => {
        console.log('Database synchronization completed.');
    })
    .catch((err) => {
        console.error('Error synchronizing database:', err);
    });

module.exports = db;
