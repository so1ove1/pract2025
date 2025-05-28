-- Create database if not exists
CREATE DATABASE IF NOT EXISTS bratsk_profile
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE bratsk_profile;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    category_id INT NOT NULL,
    overall_width DECIMAL(10,2),
    working_width DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Prices table
CREATE TABLE IF NOT EXISTS prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    coating VARCHAR(50) NOT NULL,
    thickness DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id)
);

-- Calculations table
CREATE TABLE IF NOT EXISTS calculations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    details JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default admin user (password: admin)
INSERT INTO users (login, name, password, role) VALUES 
('admin', 'Администратор', '$2a$10$JcKLm7Rg.7zXBGUcxxKZeePGMoFxE8DuQQH.Qz.CPaXyJxBk2nqSG', 'admin');

-- Insert default categories
INSERT INTO categories (name) VALUES 
('Профлист'),
('Металлочерепица'),
('Штакетник'),
('Сайдинг'),
('Доборные элементы');

-- Insert default materials
INSERT INTO materials (name, code, unit, category_id, overall_width, working_width) VALUES 
('Профлист C8', 'C8', 'м²', 1, 1.2, 1.15),
('Профлист C10', 'C10', 'м²', 1, 1.15, 1.10),
('Профлист C21', 'C21', 'м²', 1, 1.05, 1.00),
('Металлочерепица Монтеррей', 'MCH-M', 'м²', 2, 1.18, 1.10),
('Металлочерепица Супермонтеррей', 'MCH-SM', 'м²', 2, 1.18, 1.10),
('Штакетник прямоугольный', 'SHTP', 'шт', 3, 0.12, 0.10),
('Штакетник закругленный', 'SHTZ', 'шт', 3, 0.12, 0.10),
('Сайдинг металлический', 'SM', 'м²', 4, 0.35, 0.30),
('Сайдинг виниловый', 'SV', 'м²', 4, 0.25, 0.20),
('Планка конька', 'PK', 'м.п.', 5, NULL, NULL),
('Планка торцевая', 'PT', 'м.п.', 5, NULL, NULL);

-- Insert default prices
INSERT INTO prices (material_id, coating, thickness, price) VALUES 
(1, 'Полиэстер', 0.45, 650),
(1, 'Полиэстер', 0.50, 720),
(2, 'Полиэстер', 0.45, 670),
(2, 'Полиэстер', 0.50, 740),
(3, 'Полиэстер', 0.50, 750),
(3, 'Полиэстер', 0.70, 920),
(4, 'Полиэстер', 0.50, 780),
(5, 'Полиэстер', 0.50, 820),
(6, 'Полиэстер', 0.45, 95),
(7, 'Полиэстер', 0.45, 105),
(8, 'Полиэстер', 0.45, 580),
(9, 'ПВХ', 1.00, 450),
(10, 'Полиэстер', 0.45, 340),
(11, 'Полиэстер', 0.45, 280);

-- Create indexes
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_prices_material ON prices(material_id);
CREATE INDEX idx_calculations_user ON calculations(user_id);
CREATE INDEX idx_calculations_type ON calculations(type);
CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_role ON users(role);