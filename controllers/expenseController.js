const db = require('../models');
const Razorpay = require('razorpay'); 
require('dotenv').config();
const { sequelize } = db;
const AWS = require('aws-sdk');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');


const User = db.users
const Expense = db.expenses
const Order = db.orders
const S3Bucket = db.s3bucketlinks


const addExpense = async (req, res) => {
    const userId = req.userId;
    const { amount, description, category } = req.body;
 
    const fields = { amount, description, category };
    const emptyFields = Object.keys(fields).filter(key => !fields[key]);

    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: {
                status: 400,
                message: `${emptyFields.join(', ')} fields are required`
            }
        });
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const numericAmount = parseFloat(amount);

        const expense = await Expense.create(
            { amount: numericAmount, description, category, userId },
            { transaction }
        );

        const user = await User.findOne({ where: { id: userId }});

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const totalAmount = user.total_expense_amount + numericAmount;

        await User.update(
            { total_expense_amount: totalAmount },
            { where: { id: userId }, transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            success: {
                expense,
                status: 201,
                message: "Saved expenses successfully!"
            }
        });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(err);
        res.status(500).json({
            message: "Something went wrong"
        });
    }
};

const getExpense = async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 15 } = req.query; // Default to page 1, limit 15 if not provided

    const offset = (page - 1) * limit; // Calculate offset for pagination

    try {
        const totalExpenses = await Expense.sum('amount', { where: { userId: userId } });
        const { count, rows: expenses } = await Expense.findAndCountAll({
            where: { userId: userId },
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            expenses,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalExpenses,
            success: true
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Internal server error' 
        });
    }
};


const deleteExpense = async (req, res) => {
    const userId = req.userId;
    const id = req.body.id;
    if (!id) {
        return res.status(400).json({
            error: {
                message: "Id field is required!"
            }
        });
    }
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const expense = await Expense.findOne({ where: { userId: userId, id: id }});
       
        const user = await User.findOne({ where: { id: userId }});
        
        const newTotalExpenseAmount = user.total_expense_amount - expense.amount;
        
        await User.update(
            { total_expense_amount: newTotalExpenseAmount },
            { where: { id: userId }, transaction }
        );

        await Expense.destroy({ where: { userId: userId, id: id }, transaction });

        await transaction.commit();

        res.status(200).json({
            id: id,
            message: "Successfully deleted the expense details"
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


const purcahsePremium = async (req, res) => {
    const userId = req.userId;
    
    try {
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const amount = 5000;
        const order = await rzp.orders.create({ amount, currency: "INR" });
        
        // Create the order associated with the user
        await Order.create({userId :  userId, orderid: order.id,status: "PENDING"});

        return res.status(201).json({ order, key_id: rzp.key_id });

    } catch (error) {
        console.error("Error creating premium order:", error);
        return res.status(500).json({ message: "Something went wrong", error });
    }
};


const updateTranscationdetails = async (req, res) => {
    try {
        const { payment_id, order_id } = req.body;
        const order = await Order.findOne({ where: { orderid: order_id } });
        const promise1 = await order.update({ paymentid: payment_id, status: 'SUCCESSFUL' });
        const promise2 = User.update({ ispremiumuser: 1 }, { where: { id: req.userId } });
        
        await Promise.all([promise1, promise2]);
        res.status(200).json({
            message: "Transaction successful"
        });
    } catch (error) {
        return res.status(500).json({
            error: "An error occurred while updating transaction details"
        });
    }
}

const userpremium = (req, res) => {
    try {
        const userId = req.userId;
        User.findOne({ where: { id: userId } })
            .then(User => {
                if (!User) {
                    return res.status(404).json({
                        status: false,
                        message: "User not found"
                    });
                }

                if (User.ispremiumuser == 1) {
                    return res.status(200).json({
                        status: true,
                        message: "User is a premium member"
                    });
                } else {
                    return res.status(200).json({
                        status: false,
                        message: "User is not a premium member"
                    });
                }
            })
            .catch(error => {
                return res.status(500).json({
                    status: false,
                    message: "Internal Server Error"
                });
            });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
}


const getAllUserExpenses = async (req, res) => {
    try {
        const expenses = await User.findAll({
            attributes: ['name', 'total_expense_amount'],
            order: [['total_expense_amount', 'DESC']] 
        });

        if (!expenses || expenses.length === 0) {
            return res.status(404).json({ error: 'No expenses found' });
        }

        res.json({ expenses });
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};



async function uploadToS3(data, fileName) {
    const BUCKET_NAME = 'expenseapp233';
    const IAM_USER_ACCESS_KEY = process.env.ACCESS_KEY;
    const IAM_USER_SECRET_KEY = process.env.SECRET_KEY;

    let s3Bucket = new AWS.S3({
        accessKeyId: IAM_USER_ACCESS_KEY,
        secretAccessKey: IAM_USER_SECRET_KEY,
    });

    var params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: data,
        ACL: 'public-read',
    };

    return new Promise((resolve, reject) => {
        s3Bucket.upload(params, (err, s3response) => {
            if (err) {
                reject(err);
            } else {
                resolve(s3response.Location);
            }
        });
    });
}

const generateExcel = async (expenses) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Date', key: 'date', width: 20 },
    ];

    expenses.forEach(expense => {
        worksheet.addRow({
            id: expense.id,
            amount: expense.amount,
            description: expense.description,
            date: expense.createdAt
        });
    });

    const filePath = path.join(__dirname, 'expenses.xlsx');
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

const downloadExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({ where: { userId: req.user.userId } });
        console.log(expenses);

        const excelPath = await generateExcel(expenses);
        const fileContent = fs.readFileSync(excelPath);
        const userID = req.user.userId;
        const fileName = `Expense_${userID}/${new Date()}.xlsx`;
        const fileURL = await uploadToS3(fileContent, fileName);
        console.log("url = ",userID);
        console.log("url = ",fileURL);
        // Clean up the generated Excel file
        fs.unlinkSync(excelPath);

        await S3Bucket.create({ fileURL, userId : userID});

        return res.status(200).json({
            success: {
                url: fileURL,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: {
                message: error.message,
            },
        });
    }
};



const getAllS3BucketLinks = async (req, res) => {
    try {
        const userID = req.user.userId;
        const s3BucketLinks = await S3Bucket.findAll({ where: { userId: userID } });
        return res.status(200).json({
            success : {
                links: s3BucketLinks
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: {
                message: error.message,
            },
        });
    }
};

module.exports = {
    addExpense,
    getExpense,
    deleteExpense,
    purcahsePremium,
    updateTranscationdetails,
    userpremium,
    getAllUserExpenses,
    downloadExpenses,
    getAllS3BucketLinks
}