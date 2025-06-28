import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models';
import { log } from '../utils/logger';

// Passport'a yerel stratejiyi (kullanıcı adı/parola) kullanmasını söyle
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      log.debug(`[Auth] Kullanıcı adı için arama yapılıyor: ${username}`);
      const user = await User.findOne({ where: { username: username } });

      // Kullanıcı bulunamadı
      if (!user) {
        log.warn(`[Auth] Kullanıcı bulunamadı: ${username}`);
        return done(null, false, { message: 'Geçersiz kullanıcı adı veya şifre.' });
      }

      log.debug(`[Auth] Kullanıcı bulundu: ${username}. Parola kontrol ediliyor...`);
      // Parola geçerli değil
      const isMatch = await user.validatePassword(password);
      if (!isMatch) {
        log.warn(`[Auth] Parola eşleşmedi: ${username}`);
        return done(null, false, { message: 'Geçersiz kullanıcı adı veya şifre.' });
      }

      // Başarılı giriş
      log.info(`[Auth] Kullanıcı başarıyla doğrulandı: ${username}`);
      return done(null, user);
    } catch (error) {
      log.error('Passport stratejisi sırasında hata:', error);
      return done(error);
    }
  }
));

// Kullanıcıyı session'a kaydetmek için serialize et
passport.serializeUser((user: any, done) => {
  log.debug(`[Serialize] Kullanıcı oturuma kaydediliyor: ID ${user.id}`);
  done(null, user.id);
});

// Session'dan kullanıcıyı geri almak için deserialize et
passport.deserializeUser(async (id: number, done) => {
  log.debug(`[Deserialize] Kullanıcı oturumdan alınıyor: ID ${id}`);
  try {
    const user = await User.findByPk(id);
    if (user) {
      log.debug('[Deserialize] Kullanıcı veritabanında bulundu.');
    } else {
      log.warn('[Deserialize] Kullanıcı veritabanında bulunamadı!');
    }
    done(null, user);
  } catch (error) {
    log.error('[Deserialize] Hata:', error);
    done(error);
  }
});

export default passport; 