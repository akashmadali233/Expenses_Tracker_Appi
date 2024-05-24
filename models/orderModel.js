
module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define("order", {
        paymentid : DataTypes.STRING,
        orderid : DataTypes.STRING,
        status : DataTypes.STRING
    });  
    return Order;
}