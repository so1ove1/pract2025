import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Price = sequelize.define('Price', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    coating: {
        type: DataTypes.STRING,
        allowNull: false
    },
    thickness: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

export default Price;