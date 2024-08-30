const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    ispremiumuser: Boolean,
    total_expense_amount: {
        type: Number,
        default: 0.0
    }
});

module.exports = mongoose.model('User', UserSchema);
