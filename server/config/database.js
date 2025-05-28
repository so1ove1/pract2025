import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('bratskprof_bit', 'bratskprof_bit', 'a*q0@U@[', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    timezone: '+05:00',
    define: {
        timestamps: true,
        underscored: true
    }
});

export default sequelize;