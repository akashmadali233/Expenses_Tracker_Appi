const mongoose = require('mongoose');
const { Schema } = mongoose;

const S3BucketSchema = new Schema({
    fileURL: String,
    user: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('S3Bucket', S3BucketSchema);
