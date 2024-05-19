module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user", {
        name : {
            type : DataTypes.STRING,
            allowNull : false
        },
        email : {
            type : DataTypes.STRING,
            allowNull :false
        },
        password : {
            type : DataTypes.STRING,
            allowNull : false
        },
        ispremiumuser : DataTypes.BOOLEAN,
        total_expense_amount: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0.0
        }
    });  
    return User;
}