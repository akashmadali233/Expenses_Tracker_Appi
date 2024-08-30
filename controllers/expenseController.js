const Razorpay = require('razorpay'); 
require('dotenv').config();
//const AWS = require('aws-sdk');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

//adding the expense
const User = require('../models/userModel');
const Expense = require('../models/expenseModel');
const Order = require('../models/orderModel')
const mongoose = require('mongoose');

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

    try {
        const numericAmount = parseFloat(amount);

        const expense = await Expense.create({ amount: numericAmount, description, category, user: userId });

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.total_expense_amount += numericAmount;
        await user.save();

        const populatedExpense = await Expense.findById(expense._id).populate('user', 'name email'); // Specify fields to populate

        return res.status(201).json({
            success: {
                expense: populatedExpense,
                status: 201,
                message: "Saved expenses successfully!"
            }
        });
    } catch (err) {
        res.status(500).json({
            message: "Something went wrong"
        });
    }
};


//getting all expenses 
const getExpense = async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 15 } = req.query; // Default to page 1, limit 15 if not provided

    const skip = (page - 1) * limit; // Calculate skip for pagination

    try {
        // Calculate total expenses
        const totalExpenses = await Expense.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },  // Correct usage of ObjectId
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Get expenses with pagination and populate user details
        const expenses = await Expense.find({ user: userId })
            .populate('user', 'name email') // Populate user details
            .skip(skip)
            .limit(parseInt(limit));

        // Count total number of expenses for pagination
        const count = await Expense.countDocuments({ user: userId });

        res.status(200).json({
            expenses,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalExpenses: totalExpenses.length ? totalExpenses[0].total : 0,
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
    const expenseId = req.body.id;

    if (!expenseId) {
        return res.status(400).json({
            error: {
                message: "Id field is required!"
            }
        });
    }

    try { 
        // Find the expense to delete
        const expense = await Expense.findOne({ _id: expenseId, user: userId });

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        // Find the user and update their total expense amount
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.total_expense_amount -= expense.amount;
        await user.save();

        // Delete the expense
        await Expense.deleteOne({ _id: expenseId, user: userId });

        res.status(200).json({
            id: expenseId,
            message: "Successfully deleted the expense details"
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};


//getting all user expenses
const getAllUserExpenses = async (req, res) => {
    try {
        const users = await User.find({}, 'name total_expense_amount') // Specify the fields to return
            .sort({ total_expense_amount: -1 }); // Sort in descending order

        if (users.length === 0) {
            return res.status(404).json({ error: 'No expenses found' });
        }

        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};


//purchaging the premium
const purchasePremium = async (req, res) => {
    const userId = req.userId;

    try {
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const amount = 5000; // Amount in paise (i.e., 5000 paise = 50 INR)
        const order = await rzp.orders.create({ amount, currency: "INR" });

        // Create the order associated with the user
        const newOrder = new Order({
            user: userId,
            orderid: order.id,
            status: "PENDING"
        });

        await newOrder.save();

        return res.status(201).json({ order, key_id: rzp.key_id });

    } catch (error) {
        return res.status(500).json({ message: "Something went wrong", error });
    }
};


//after purchesing the transaction update
const updateTransactionDetails = async (req, res) => {
    try {
        const { payment_id, order_id } = req.body;

        // Find the order by its orderid
        const order = await Order.findOne({ orderid: order_id });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Update the order with payment details
        order.paymentid = payment_id;
        order.status = 'SUCCESSFUL';

        // Mark user as a premium user
        const updateOrderPromise = order.save();
        const updateUserPromise = User.findByIdAndUpdate(req.userId, { ispremiumuser: true });

        await Promise.all([updateOrderPromise, updateUserPromise]);

        res.status(200).json({ message: "Transaction successful" });

    } catch (error) {
        return res.status(500).json({
            error: "An error occurred while updating transaction details",
            details: error.message
        });
    }
};



//knowing user is premium or not
const userpremium = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        if (user.ispremiumuser) {
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
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


/*
//file uploading to s3 bucket 
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


//getting all files from s3 buckets
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
        return res.status(500).json({
            success: false,
            error: {
                message: error.message,
            },
        });
    }
};
*/

//creating the excel file
const generateExcel = async (expenses) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    worksheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Date', key: 'date', width: 20 },
    ];

    expenses.forEach(expense => {
        worksheet.addRow({
            id: expense._id.toString(), // Convert MongoDB ObjectId to string
            amount: expense.amount,
            description: expense.description,
            date: expense.createdAt.toISOString() // Ensure the date is in a readable format
        });
    });

    const filePath = path.join(__dirname, 'expenses.xlsx');
    await workbook.xlsx.writeFile(filePath);
    return filePath;
};


//downloading the excel file
const downloadExpenses = async (req, res) => {
    try {
        // Fetch expenses using Mongoose
        const expenses = await Expense.find({ user: req.userId });

        // Generate the Excel file
        const excelPath = await generateExcel(expenses);
        const fileContent = fs.readFileSync(excelPath);

        // Set headers to indicate file download
        res.setHeader('Content-Disposition', `attachment; filename=expenses_${req.user.userId}_${new Date().toISOString().replace(/:/g, '-')}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the file content as the response
        res.send(fileContent);

        // Clean up the generated Excel file
        fs.unlinkSync(excelPath);
    } catch (error) {
        console.error('Error downloading expenses:', error); // Log the error for debugging
        return res.status(500).json({
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
    purchasePremium,
    updateTransactionDetails, 
    userpremium, 
    getAllUserExpenses,
    downloadExpenses
}