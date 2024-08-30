const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    paymentid: String,
    orderid: String,
    status: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Order', OrderSchema);
