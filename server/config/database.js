import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false,
    timezone: '+05:00',
    define: {
        timestamps: true,
        underscored: true
    }
});

export default sequelize;