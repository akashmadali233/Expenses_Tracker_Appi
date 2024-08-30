const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    orderid: String,
    paymentid: String,
    status: String
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
