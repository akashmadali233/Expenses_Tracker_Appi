module.exports = (sequelize, DataTypes) =>{
    const Expense = sequelize.define('expense', {
        amount : {
            type : DataTypes.STRING,
            allowNull :false
        },
        description : {
            type : DataTypes.STRING,
            allowNull : false
        },
        category : {
            type : DataTypes.STRING,
            allowNull : false
        },
        status :{
            type : DataTypes.INTEGER,
            allowNull:true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    })
    return Expense;
} 