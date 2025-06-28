import { User } from '../models';

/**
 * Tüm kullanıcıları getirir.
 * @returns {Promise<User[]>} Kullanıcı listesi.
 */
export async function getAllUsers(): Promise<User[]> {
  return User.findAll({
    order: [['username', 'ASC']],
  });
}

/**
 * Yeni bir kullanıcı ekler.
 * @param {string} username - Yeni kullanıcının adı.
 * @param {string} password - Yeni kullanıcının şifresi.
 * @returns {Promise<User>} Oluşturulan kullanıcı.
 */
export async function addUser(username: string, password: string): Promise<User> {
  if (password.length < 6) {
    throw new Error('Şifre en az 6 karakter olmalıdır.');
  }
  return User.create({ username, password });
}

/**
 * Bir kullanıcıyı ID'sine göre siler.
 * @param {number} id - Silinecek kullanıcının ID'si.
 * @returns {Promise<number>} Silinen satır sayısı.
 */
export async function deleteUser(id: number): Promise<number> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }
  // Güvenlik: "admin" kullanıcısının silinmesini engelle
  if (user.username === 'admin') {
    throw new Error('Varsayılan admin kullanıcısı silinemez.');
  }
  return User.destroy({ where: { id } });
} 