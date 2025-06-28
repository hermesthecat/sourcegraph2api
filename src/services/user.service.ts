import { User } from '../models';
import { logger } from '../utils/logger';

/**
 * Fetches all users.
 * @returns {Promise<User[]>} List of users.
 */
export async function getAllUsers(): Promise<User[]> {
  return User.findAll({
    order: [['username', 'ASC']],
  });
}

/**
 * Adds a new user.
 * @param {string} username - The new user's username.
 * @param {string} password - The new user's password.
 * @returns {Promise<User>} The created user.
 */
export async function addUser(username: string, password: string): Promise<User> {
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  return User.create({ username, password });
}

/**
 * Deletes a user by their ID.
 * @param {number} id - The ID of the user to delete.
 * @returns {Promise<number>} Number of deleted rows.
 */
export const deleteUser = async (id: number): Promise<void> => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found.');
  }
  // Security: Prevent deletion of the "admin" user
  if (user.username === 'admin') {
    throw new Error('Default admin user cannot be deleted.');
  }
  await User.destroy({ where: { id } });
};

/**
 * Finds a user by their ID.
 * @param id The ID of the user to search for
 * @returns User object or null if not found
 */
export const findUserById = async (id: number): Promise<User | null> => {
  try {
    const user = await User.findByPk(id);
    return user;
  } catch (error) {
    logger.error(`[UserService] Error finding user by ID: ${id}`, error);
    throw new Error('An error occurred while finding the user.');
  }
};

/**
 * Updates a user's information.
 * @param id The ID of the user to update
 * @param username New username
 * @param password New password (optional)
 * @returns The updated user object
 */
export const updateUser = async (id: number, username: string, password?: string) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User to update not found.');
    }

    // Critical Protection: Prevent changing the 'admin' user's name
    if (user.username === 'admin' && username !== 'admin') {
      throw new Error('The username for "admin" user cannot be changed.');
    }

    user.username = username;
    // Only update password if a new password is provided
    if (password && password.trim() !== '') {
      // Check password length
      if (password.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
      }
      user.password = password;
    }

    await user.save();
    logger.info(`[UserService] User updated: ${username} (ID: ${id})`);
    return user;
  } catch (error: any) {
    logger.error(`[UserService] Error updating user: ${id}`, error);
    // Catch unique username constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('This username is already in use.');
    }
    // Re-throw original error to provide more detailed information
    throw error;
  }
}; 