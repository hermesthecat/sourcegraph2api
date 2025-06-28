import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models';
import { log } from '../utils/logger';

// Tell Passport to use the local strategy (username/password)
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      log.debug(`[Auth] Searching for username: ${username}`);
      const user = await User.findOne({ where: { username: username } });

      // User not found
      if (!user) {
        log.warn(`[Auth] User not found: ${username}`);
        return done(null, false, { message: 'Invalid username or password.' });
      }

      log.debug(`[Auth] User found: ${username}. Checking password...`);
      // Password not valid
      const isMatch = await user.validatePassword(password);
      if (!isMatch) {
        log.warn(`[Auth] Password mismatch: ${username}`);
        return done(null, false, { message: 'Invalid username or password.' });
      }

      // Successful login
      log.info(`[Auth] User successfully authenticated: ${username}`);
      return done(null, user);
    } catch (error) {
      log.error('Error during Passport strategy:', error);
      return done(error);
    }
  }
));

// Serialize the user to save to the session
passport.serializeUser((user: any, done) => {
  log.debug(`[Serialize] Saving user to session: ID ${user.id}`);
  done(null, user.id);
});

// Deserialize the user to retrieve from the session
passport.deserializeUser(async (id: number, done) => {
  log.debug(`[Deserialize] Retrieving user from session: ID ${id}`);
  try {
    const user = await User.findByPk(id);
    if (user) {
      log.debug('[Deserialize] User found in database.');
    } else {
      log.warn('[Deserialize] User not found in database!');
    }
    done(null, user);
  } catch (error) {
    log.error('[Deserialize] Error:', error);
    done(error);
  }
});

export default passport; 