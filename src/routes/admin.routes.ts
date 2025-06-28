/**
 * Admin Routes
 * Defines routes for the cookie and API key management interface
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getAllCookies, addCookie, deleteCookie, toggleCookieStatus, getCookieById, updateCookie } from '../services/cookie.service';
import { getAllApiKeys, addApiKey, deleteApiKey, toggleApiKeyStatus } from '../services/apikey.service';
import { getUsageMetrics } from '../services/metric.service';
import * as statsService from '../services/statistics.service'; // Import statistics service
import { log } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { getAllUsers, addUser, deleteUser, findUserById, updateUser } from '../services/user.service'; // Import user service
import { getEditableSettings, updateSettings } from '../services/settings.service'; // Import settings service
import {
  getGeneralStats,
  getApiKeyUsageStats,
  getCookieUsageStats,
  getModelUsageStats,
  getDailyUsageForChart
} from '../services/statistics.service';
import { logger } from '../utils/logger';

const router = Router();

// Middleware: Authentication is required for all routes after this line.
// Write the function directly into `router.use` to resolve module loading issue.
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  logger.warn('[AuthCheck] User not authenticated. Redirecting to /login.');
  req.flash('error', 'You must be logged in to view this page.');
  res.redirect('/login');
});

// ============================
// Flash Message Middleware
// ============================
// This middleware runs before every admin route to pass messages from the session to EJS.
router.use((req, res, next) => {
  // @ts-ignore
  res.locals.message = req.session.message;
  // @ts-ignore
  res.locals.error = req.session.error;
  // @ts-ignore
  delete req.session.message;
  // @ts-ignore
  delete req.session.error;
  next();
});

// ============================
// Dashboard Route
// ============================
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [
      generalStats,
      cookieUsage,
      apiKeyUsage,
      dailyUsage,
      modelUsage
    ] = await Promise.all([
      getGeneralStats(),
      getCookieUsageStats(),
      getApiKeyUsageStats(),
      getDailyUsageForChart(),
      getModelUsageStats()
    ]);

    res.render('dashboard', {
      title: 'Dashboard',
      currentRoute: '/admin/dashboard',
      generalStats,
      cookieStats: cookieUsage,
      apiKeyStats: apiKeyUsage,
      chartData: JSON.stringify(dailyUsage),
      modelUsageData: JSON.stringify(modelUsage)
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    req.flash('error', 'An error occurred while fetching dashboard data.');
    res.status(500).render('dashboard', {
      title: 'Error',
      currentRoute: '/admin/dashboard',
      generalStats: { totalRequests: 0, totalErrors: 0, errorRate: 0, activeCookies: 0, activeApiKeys: 0 },
      cookieStats: [],
      apiKeyStats: [],
      chartData: JSON.stringify({ labels: [], data: [] }),
      modelUsageData: JSON.stringify({ labels: [], data: [] })
    });
  }
});

// ============================
// Cookie Management Routes
// ============================

// Render the main admin page (cookie list)
// GET /admin/cookies
router.get('/cookies', async (req: Request, res: Response) => {
  try {
    const cookies = await getAllCookies();
    // Pass 'message' and 'error' query parameters to the view
    res.render('cookies', {
      cookies: cookies,
      title: 'Cookie Management'
    });
  } catch (error) {
    log.error('Error loading cookie management page:', error);
    res.status(500).render('cookies', {
      cookies: [],
      error: 'An error occurred while loading the page.',
      title: 'Error'
    });
  }
});

// Show edit page
router.get('/cookies/edit/:id', async (req: Request, res: Response) => {
  try {
    const cookie = await getCookieById(Number(req.params.id));
    if (!cookie) {
      // @ts-ignore
      req.session.error = 'Cookie not found for editing.';
      return res.redirect('/admin/cookies');
    }
    res.render('edit-cookie', {
      title: 'Edit Cookie',
      cookie,
    });
  } catch (error) {
    log.error('Error loading cookie edit page:', error);
    // @ts-ignore
    req.session.error = 'An error occurred while loading the page.';
    res.redirect('/admin/cookies');
  }
});

// Update cookie
router.post('/cookies/edit/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { alias, cookieValue } = req.body;
  if (!alias || !cookieValue) {
    // @ts-ignore
    req.session.error = 'Alias and cookie value cannot be empty.';
    return res.redirect(`/admin/cookies/edit/${id}`);
  }
  try {
    await updateCookie(Number(id), alias, cookieValue);
    // @ts-ignore
    req.session.message = 'Cookie updated successfully.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error(`Error updating cookie (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'An error occurred while updating the cookie.';
    res.redirect(`/admin/cookies/edit/${id}`);
  }
});

// Add a new cookie
// POST /admin/cookies/add
router.post('/cookies/add', async (req: Request, res: Response) => {
  const { alias, cookieValue } = req.body;
  if (!alias || !cookieValue) {
    // @ts-ignore
    req.session.error = 'Alias and cookie value cannot be empty.';
    return res.redirect('/admin/cookies');
  }
  try {
    await addCookie(alias, cookieValue);
    // @ts-ignore
    req.session.message = 'Cookie added successfully.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error('Error adding cookie:', error);
    // @ts-ignore
    req.session.error = 'An error occurred while adding the cookie.';
    res.redirect('/admin/cookies');
  }
});

// Delete a cookie
// POST /admin/cookies/delete/:id
router.post('/cookies/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteCookie(Number(id));
    // @ts-ignore
    req.session.message = 'Cookie deleted successfully.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error(`Error deleting cookie (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'An error occurred while deleting the cookie.';
    res.redirect('/admin/cookies');
  }
});

// Toggle a cookie's status
// POST /admin/cookies/toggle/:id
router.post('/cookies/toggle/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await toggleCookieStatus(Number(id));
    // @ts-ignore
    req.session.message = 'Cookie status updated successfully.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error(`Error updating cookie status (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'An error occurred while updating the cookie status.';
    res.redirect('/admin/cookies');
  }
});

// ============================
// API Key Management Routes
// ============================

// Render the API key management page
// GET /admin/apikeys
router.get('/apikeys', async (req: Request, res: Response) => {
  try {
    const apiKeys = await getAllApiKeys();
    res.render('apikeys', {
      apiKeys: apiKeys,
      title: 'API Key Management'
    });
  } catch (error) {
    log.error('Error loading API key management page:', error);
    res.status(500).render('apikeys', {
      apiKeys: [],
      error: 'An error occurred while loading the page.',
      title: 'Error'
    });
  }
});

// Add a new API key
// POST /admin/apikeys/add
router.post('/apikeys/add', async (req: Request, res: Response) => {
  const { alias } = req.body;
  if (!alias) {
    // @ts-ignore
    req.session.error = 'Alias cannot be empty.';
    return res.redirect('/admin/apikeys');
  }
  try {
    const newKey = `s2a-${uuidv4()}`;
    await addApiKey(alias, newKey);
    // @ts-ignore
    req.session.message = `API Key successfully added: ${newKey}`;
    res.redirect('/admin/apikeys');
  } catch (error) {
    log.error('Error adding API key:', error);
    // @ts-ignore
    req.session.error = 'An error occurred while adding the API key.';
    res.redirect('/admin/apikeys');
  }
});

// Delete an API key
// POST /admin/apikeys/delete/:id
router.post('/apikeys/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteApiKey(Number(id));
    // @ts-ignore
    req.session.message = 'API Key successfully deleted.';
    res.redirect('/admin/apikeys');
  } catch (error) {
    log.error(`Error deleting API Key (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'An error occurred while deleting the API Key.';
    res.redirect('/admin/apikeys');
  }
});

// Toggle API key status
// POST /admin/apikeys/toggle/:id
router.post('/apikeys/toggle/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await toggleApiKeyStatus(Number(id));
    // @ts-ignore
    req.session.message = 'API Key status updated successfully.';
    res.redirect('/admin/apikeys');
  } catch (error) {
    log.error(`Error updating API Key status (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'An error occurred while updating the API Key status.';
    res.redirect('/admin/apikeys');
  }
});

// ============================
// User Management Routes
// ============================

// Render user management page
// GET /admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.render('users', {
      users: users,
      title: 'User Management'
    });
  } catch (error) {
    log.error('Error loading user management page:', error);
    res.status(500).render('users', {
      users: [],
      error: 'An error occurred while loading the page.',
      title: 'Error'
    });
  }
});

// Show add user page
router.get('/users/add', (req: Request, res: Response) => {
  res.render('edit-user', {
    title: 'Add New User',
    user: null, // Yeni kullanıcı eklerken boş kullanıcı nesnesi
  });
});

// Add new user
// POST /admin/users/add
router.post('/users/add', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    // @ts-ignore
    req.session.error = 'Username and password cannot be empty.';
    return res.redirect('/admin/users/add');
  }
  try {
    await addUser(username, password);
    // @ts-ignore
    req.session.message = 'User successfully added.';
    res.redirect('/admin/users');
  } catch (error: any) {
    log.error('Error adding user:', error);
    // @ts-ignore
    req.session.error = error.message.includes('SQLITE_CONSTRAINT') ? 'Username already exists.' : 'An error occurred while adding the user.';
    res.redirect('/admin/users/add');
  }
});

// Show edit user page
router.get('/users/edit/:id', async (req: Request, res: Response) => {
  try {
    const user = await findUserById(Number(req.params.id));
    if (!user) {
      // @ts-ignore
      req.session.error = 'User not found for editing.';
      return res.redirect('/admin/users');
    }
    res.render('edit-user', {
      title: 'Edit User',
      user,
    });
  } catch (error) {
    log.error('Error loading user edit page:', error);
    // @ts-ignore
    req.session.error = 'An error occurred while loading the page.';
    res.redirect('/admin/users');
  }
});

// Update user
router.post('/users/edit/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password } = req.body;
  if (!username) {
    // @ts-ignore
    req.session.error = 'Username cannot be empty.';
    return res.redirect(`/admin/users/edit/${id}`);
  }
  try {
    await updateUser(Number(id), username, password || undefined);
    // @ts-ignore
    req.session.message = 'User updated successfully.';
    res.redirect('/admin/users');
  } catch (error: any) {
    log.error(`Error updating user (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = error.message.includes('SQLITE_CONSTRAINT') ? 'Username already exists.' : 'An error occurred while updating the user.';
    res.redirect(`/admin/users/edit/${id}`);
  }
});

// Delete user
// POST /admin/users/delete/:id
router.post('/users/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteUser(Number(id));
    // @ts-ignore
    req.session.message = 'User successfully deleted.';
    res.redirect('/admin/users');
  } catch (error) {
    log.error(`Error deleting user (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'An error occurred while deleting the user.';
    res.redirect('/admin/users');
  }
});

// ============================
// Usage Metrics Routes
// ============================

// Render usage metrics page
router.get('/metrics', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const { rows: metrics, count: totalCount } = await getUsageMetrics({ page, limit });
    res.render('metrics', {
      title: 'Usage Metrics',
      metrics,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      currentRoute: '/admin/metrics',
    });
  } catch (error) {
    log.error('Error loading usage metrics page:', error);
    res.status(500).render('metrics', {
      title: 'Error',
      metrics: [],
      currentPage: 1,
      totalPages: 1,
      error: 'An error occurred while loading usage metrics.',
      currentRoute: '/admin/metrics',
    });
  }
});

// ============================
// Settings Routes
// ============================

// Render settings page
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await getEditableSettings();
    res.render('settings', {
      title: 'Settings',
      settings,
      currentRoute: '/admin/settings',
    });
  } catch (error) {
    log.error('Error loading settings page:', error);
    res.status(500).render('settings', {
      title: 'Error',
      settings: [],
      error: 'An error occurred while loading settings.',
      currentRoute: '/admin/settings',
    });
  }
});

// Update settings
router.post('/settings', async (req: Request, res: Response) => {
  const settingsToUpdate = req.body;
  try {
    await updateSettings(settingsToUpdate);
    // @ts-ignore
    req.session.message = 'Settings updated successfully.';
    res.redirect('/admin/settings');
  } catch (error) {
    log.error('Error updating settings:', error);
    // @ts-ignore
    req.session.error = 'An error occurred while updating settings.';
    res.redirect('/admin/settings');
  }
});

export default router;