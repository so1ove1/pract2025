import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import argon2 from 'argon2';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    login: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user'
    },
    lastLogin: {
        type: DataTypes.DATE
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            user.password = await argon2.hash(user.password);
        }
    }
});

export default User;