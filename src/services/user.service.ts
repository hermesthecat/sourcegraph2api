import { User } from '../models';
import { logger } from '../utils/logger';

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
export const deleteUser = async (id: number): Promise<void> => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('Kullanıcı bulunamadı.');
  }
  // Güvenlik: "admin" kullanıcısının silinmesini engelle
  if (user.username === 'admin') {
    throw new Error('Varsayılan admin kullanıcısı silinemez.');
  }
  await User.destroy({ where: { id } });
};

/**
 * Bir kullanıcıyı ID'sine göre bulur.
 * @param id Aranacak kullanıcının ID'si
 * @returns Kullanıcı nesnesi veya bulunamazsa null
 */
export const findUserById = async (id: number): Promise<User | null> => {
  try {
    const user = await User.findByPk(id);
    return user;
  } catch (error) {
    logger.error(`[UserService] Kullanıcı ID ile bulunurken hata: ${id}`, error);
    throw new Error('Kullanıcı bulunurken bir hata oluştu.');
  }
};

/**
 * Bir kullanıcının bilgilerini günceller.
 * @param id Güncellenecek kullanıcının ID'si
 * @param username Yeni kullanıcı adı
 * @param password Yeni şifre (opsiyonel)
 * @returns Güncellenmiş kullanıcı nesnesi
 */
export const updateUser = async (id: number, username: string, password?: string) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Güncellenecek kullanıcı bulunamadı.');
    }

    // Kritik Koruma: 'admin' kullanıcısının adının değiştirilmesini engelle
    if (user.username === 'admin' && username !== 'admin') {
      throw new Error('"admin" kullanıcısının adı değiştirilemez.');
    }

    user.username = username;
    // Sadece yeni bir şifre girildiyse güncelle
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();
    logger.info(`[UserService] Kullanıcı güncellendi: ${username} (ID: ${id})`);
    return user;
  } catch (error: any) {
    logger.error(`[UserService] Kullanıcı güncellenirken hata: ${id}`, error);
    // Benzersiz kullanıcı adı kısıtlaması hatasını yakala
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
    }
    throw new Error('Kullanıcı güncellenirken bir hata oluştu.');
  }
}; 