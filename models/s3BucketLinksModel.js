const mongoose = require('mongoose');

const S3BucketLinksSchema = new mongoose.Schema({
    fileURL: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('S3BucketLink', S3BucketLinksSchema);
