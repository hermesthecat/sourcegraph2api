/**
 * Admin Routes / Yönetim Rotaları
 * Cookie ve API Anahtarı yönetim arayüzü için rotaları tanımlar
 * Defines routes for the cookie and API key management interface
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getAllCookies, addCookie, deleteCookie, toggleCookieStatus, getCookieById, updateCookie } from '../services/cookie.service';
import { getAllApiKeys, addApiKey, deleteApiKey, toggleApiKeyStatus } from '../services/apikey.service';
import { getUsageMetrics } from '../services/metric.service';
import * as statsService from '../services/statistics.service'; // İstatistik servisini import et
import { log } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { getAllUsers, addUser, deleteUser, findUserById, updateUser } from '../services/user.service'; // Kullanıcı servisini import et
import { 
    getGeneralStats,
    getApiKeyUsageStats,
    getCookieUsageStats,
    getModelUsageStats,
    getDailyUsageForChart
} from '../services/statistics.service';
import { logger } from '../utils/logger';

const router = Router();

// Middleware: Bu satırdan sonraki tüm rotalar için kimlik doğrulaması gerekir.
// Fonksiyonu doğrudan `router.use` içine yazarak modül yükleme sorununu çöz.
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  logger.warn('[AuthCheck] Kullanıcı doğrulanmamış. /login sayfasına yönlendiriliyor.');
  req.flash('error', 'Bu sayfayı görüntülemek için giriş yapmalısınız.');
  res.redirect('/login');
});

// ============================
// Flash Message Middleware
// ============================
// Bu middleware, her admin rotasından önce çalışarak session'daki mesajları EJS'e aktarır.
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
    logger.error('Dashboard verileri alınırken hata:', error);
    req.flash('error', 'Dashboard verileri alınırken bir hata oluştu.');
    res.status(500).render('dashboard', {
      title: 'Hata',
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

// Ana yönetim sayfasını render et (cookie listesi)
// GET /admin/cookies - Render the main admin page (cookie list)
router.get('/cookies', async (req: Request, res: Response) => {
  try {
    const cookies = await getAllCookies();
    // 'message' ve 'error' query parametrelerini view'e gönder
    res.render('cookies', {
      cookies: cookies,
      title: 'Cookie Yönetimi'
    });
  } catch (error) {
    log.error('Cookie yönetim sayfası yüklenirken hata:', error);
    res.status(500).render('cookies', {
      cookies: [],
      error: 'Sayfa yüklenirken bir hata oluştu.',
      title: 'Hata'
    });
  }
});

// Düzenleme sayfasını göster
router.get('/cookies/edit/:id', async (req: Request, res: Response) => {
  try {
    const cookie = await getCookieById(Number(req.params.id));
    if (!cookie) {
      // @ts-ignore
      req.session.error = 'Düzenlenecek cookie bulunamadı.';
      return res.redirect('/admin/cookies');
    }
    res.render('edit-cookie', {
      title: 'Cookie Düzenle',
      cookie,
    });
  } catch (error) {
    log.error('Cookie düzenleme sayfası yüklenirken hata:', error);
    // @ts-ignore
    req.session.error = 'Sayfa yüklenirken bir hata oluştu.';
    res.redirect('/admin/cookies');
  }
});

// Cookie'yi güncelle
router.post('/cookies/edit/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { alias, cookieValue } = req.body;
  if (!alias || !cookieValue) {
    // @ts-ignore
    req.session.error = 'Takma ad ve cookie değeri boş olamaz.';
    return res.redirect(`/admin/cookies/edit/${id}`);
  }
  try {
    await updateCookie(Number(id), alias, cookieValue);
    // @ts-ignore
    req.session.message = 'Cookie başarıyla güncellendi.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error(`Cookie güncellenirken hata (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'Cookie güncellenirken bir hata oluştu.';
    res.redirect(`/admin/cookies/edit/${id}`);
  }
});

// Yeni bir cookie ekle
// POST /admin/cookies/add
router.post('/cookies/add', async (req: Request, res: Response) => {
  const { alias, cookieValue } = req.body;
  if (!alias || !cookieValue) {
    // @ts-ignore
    req.session.error = 'Takma ad ve cookie değeri boş olamaz.';
    return res.redirect('/admin/cookies');
  }
  try {
    await addCookie(alias, cookieValue);
    // @ts-ignore
    req.session.message = 'Cookie başarıyla eklendi.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error('Cookie eklenirken hata:', error);
    // @ts-ignore
    req.session.error = 'Cookie eklenirken bir hata oluştu.';
    res.redirect('/admin/cookies');
  }
});

// Bir cookie'yi sil
// POST /admin/cookies/delete/:id
router.post('/cookies/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteCookie(Number(id));
    // @ts-ignore
    req.session.message = 'Cookie başarıyla silindi.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error(`Cookie silinirken hata (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'Cookie silinirken bir hata oluştu.';
    res.redirect('/admin/cookies');
  }
});

// Bir cookie'nin durumunu değiştir
// POST /admin/cookies/toggle/:id
router.post('/cookies/toggle/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await toggleCookieStatus(Number(id));
    // @ts-ignore
    req.session.message = 'Cookie durumu başarıyla güncellendi.';
    res.redirect('/admin/cookies');
  } catch (error) {
    log.error(`Cookie durumu güncellenirken hata (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'Cookie durumu güncellenirken bir hata oluştu.';
    res.redirect('/admin/cookies');
  }
});

// ============================
// API Key Management Routes
// ============================

// API anahtarı yönetim sayfasını render et
// GET /admin/apikeys
router.get('/apikeys', async (req: Request, res: Response) => {
  try {
    const apiKeys = await getAllApiKeys();
    res.render('apikeys', {
      apiKeys: apiKeys,
      title: 'API Anahtarı Yönetimi'
    });
  } catch (error) {
    log.error('API anahtarı yönetim sayfası yüklenirken hata:', error);
    res.status(500).render('apikeys', {
      apiKeys: [],
      error: 'Sayfa yüklenirken bir hata oluştu.',
      title: 'Hata'
    });
  }
});

// Yeni bir API anahtarı ekle
// POST /admin/apikeys/add
router.post('/apikeys/add', async (req: Request, res: Response) => {
  const { alias } = req.body;
  if (!alias) {
    // @ts-ignore
    req.session.error = 'Takma ad boş olamaz.';
    return res.redirect('/admin/apikeys');
  }
  try {
    const newKey = `s2a-${uuidv4()}`; // Yeni, benzersiz bir anahtar oluştur
    await addApiKey(alias, newKey);
    // @ts-ignore
    req.session.message = 'API anahtarı başarıyla oluşturuldu ve eklendi.';
    res.redirect('/admin/apikeys');
  } catch (error) {
    log.error('API anahtarı eklenirken hata:', error);
    // @ts-ignore
    req.session.error = 'API anahtarı eklenirken bir hata oluştu.';
    res.redirect('/admin/apikeys');
  }
});

// Bir API anahtarını sil
// POST /admin/apikeys/delete/:id
router.post('/apikeys/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteApiKey(Number(id));
    // @ts-ignore
    req.session.message = 'API anahtarı başarıyla silindi.';
    res.redirect('/admin/apikeys');
  } catch (error) {
    log.error(`API anahtarı silinirken hata (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'API anahtarı silinirken bir hata oluştu.';
    res.redirect('/admin/apikeys');
  }
});

// Bir API anahtarının durumunu değiştir
// POST /admin/apikeys/toggle/:id
router.post('/apikeys/toggle/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await toggleApiKeyStatus(Number(id));
    // @ts-ignore
    req.session.message = 'API anahtarı durumu başarıyla güncellendi.';
    res.redirect('/admin/apikeys');
  } catch (error) {
    log.error(`API anahtarı durumu güncellenirken hata (ID: ${id}):`, error);
    // @ts-ignore
    req.session.error = 'API anahtarı durumu güncellenirken bir hata oluştu.';
    res.redirect('/admin/apikeys');
  }
});

// ============================
// Usage Metrics Route
// ============================

// Kullanım metrikleri sayfasını render et
// GET /admin/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20; // Sayfa başına gösterilecek kayıt sayısı

    const { rows: metrics, count } = await getUsageMetrics({ page, limit });

    res.render('metrics', {
      metrics,
      title: 'Kullanım Metrikleri',
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    log.error('Kullanım metrikleri sayfası yüklenirken hata:', error);
    // @ts-ignore
    req.session.error = 'Metrikler yüklenirken bir hata oluştu.';
    res.redirect('/admin/dashboard');
  }
});

// ============================
// User Management Routes
// ============================

// Kullanıcı listesi sayfasını göster
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.render('users', {
      title: 'Kullanıcı Yönetimi',
      users,
    });
  } catch (error) {
    log.error('Kullanıcı yönetim sayfası yüklenirken hata:', error);
    // @ts-ignore
    req.session.error = 'Sayfa yüklenirken bir hata oluştu.';
    res.redirect('/admin/dashboard');
  }
});

// Yeni kullanıcı ekle
router.post('/users/add', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    await addUser(username, password);
    // @ts-ignore
    req.session.message = 'Kullanıcı başarıyla eklendi.';
  } catch (error: any) {
    log.error('Kullanıcı eklenirken hata:', error);
    // @ts-ignore
    req.session.error = error.message || 'Kullanıcı eklenirken bir hata oluştu.';
  }
  res.redirect('/admin/users');
});

// Kullanıcı sil
router.post('/users/delete/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        // Kendi kendini silmeyi engelle
        if (req.user && req.user.id === id) {
            req.flash('error', 'Kendinizi silemezsiniz.');
            return res.redirect('/admin/users');
        }
        await deleteUser(id);
        req.flash('success', 'Kullanıcı başarıyla silindi.');
    } catch (error: any) {
        req.flash('error', error.message);
    }
    res.redirect('/admin/users');
});

// Kullanıcıyı güncelle (Modal'dan gelen POST isteği)
router.post('/users/edit/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { username, password } = req.body;
    try {
        await updateUser(id, username, password);
        req.flash('success', 'Kullanıcı başarıyla güncellendi.');
    } catch (error: any) {
        req.flash('error', `Kullanıcı güncellenemedi: ${error.message}`);
    }
    res.redirect('/admin/users');
});

export { router as adminRouter }; 