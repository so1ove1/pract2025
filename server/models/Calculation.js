import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Calculation = sequelize.define('Calculation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    details: {
        type: DataTypes.JSON,
        allowNull: false
    }
});

export default Calculation;