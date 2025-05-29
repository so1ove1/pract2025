import User from './User.js';
import Category from './Category.js';
import Material from './Material.js';
import Price from './Price.js';
import Calculation from './Calculation.js';

// Define relationships
Category.hasMany(Material, {
    foreignKey: 'category_id'
});
Material.belongsTo(Category, {
    foreignKey: 'category_id'
});

Material.hasMany(Price, {
    foreignKey: 'material_id'
});
Price.belongsTo(Material, {
    foreignKey: 'material_id'
});

User.hasMany(Calculation, {
    foreignKey: 'user_id'
});
Calculation.belongsTo(User, {
    foreignKey: 'user_id'
});

export {
    User,
    Category,
    Material,
    Price,
    Calculation
};