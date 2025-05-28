import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Material = sequelize.define('Material', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    overallWidth: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    workingWidth: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
});

export default Material;