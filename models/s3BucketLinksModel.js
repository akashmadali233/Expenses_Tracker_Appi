module.exports = (sequelize, DataTypes) => {
    const S3Bucket = sequelize.define("s3bucketlinks", {
        fileURL: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    return S3Bucket;
};
