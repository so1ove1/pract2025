import bcrypt from 'bcryptjs';

// Пароль, который вы хотите использовать для администратора
const plainPassword = 'Admin123!'; // Замените на желаемый пароль

// Генерация хешированного пароля
bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) {
    console.error('Ошибка при генерации пароля:', err);
    return;
  }
  console.log('Хешированный пароль:', hash);
});