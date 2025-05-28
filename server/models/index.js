import User from './User.js';
import Category from './Category.js';
import Material from './Material.js';
import Price from './Price.js';
import Calculation from './Calculation.js';

// Define relationships
Category.hasMany(Material);
Material.belongsTo(Category);

Material.hasMany(Price);
Price.belongsTo(Material);

User.hasMany(Calculation);
Calculation.belongsTo(User);

export {
    User,
    Category,
    Material,
    Price,
    Calculation
};