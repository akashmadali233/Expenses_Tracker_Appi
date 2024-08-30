// models/forgotPasswordModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ForgotPasswordSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ForgotPassword', ForgotPasswordSchema);
