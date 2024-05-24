
module.exports = (sequelize, DataTypes) => {
    const ForgotPassword = sequelize.define("forgotpassword", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        isactive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });  
    return ForgotPassword;
}
