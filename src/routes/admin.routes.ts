/**
 * Admin Routes / Yönetim Rotaları
 * Cookie ve API Anahtarı yönetim arayüzü için rotaları tanımlar
 * Defines routes for the cookie and API key management interface
 */

import { Router, Request, Response } from 'express';
import { getAllCookies, addCookie, deleteCookie, toggleCookieStatus, getCookieById, updateCookie } from '../services/cookie.service';
import { getAllApiKeys, addApiKey, deleteApiKey, toggleApiKeyStatus } from '../services/apikey.service';
import { getUsageMetrics } from '../services/metric.service';
import * as statsService from '../services/statistics.service'; // İstatistik servisini import et
import { log } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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
      cookieStats,
      apiKeyStats,
      chartData,
      modelUsageData,
    ] = await Promise.all([
      statsService.getGeneralStats(),
      statsService.getCookieUsageStats(),
      statsService.getApiKeyUsageStats(),
      statsService.getDailyUsageForChart(),
      statsService.getModelUsageStats(),
    ]);

    res.render('dashboard', {
      title: 'Gösterge Paneli',
      generalStats,
      cookieStats,
      apiKeyStats,
      chartData: JSON.stringify(chartData), // Grafikte kullanmak için JSON'a çevir
      modelUsageData: JSON.stringify(modelUsageData), // Pasta grafik için
    });

  } catch (error) {
    log.error('Dashboard sayfası yüklenirken hata:', error);
    res.status(500).render('dashboard', {
      title: 'Hata',
      error: 'Dashboard verileri yüklenirken bir hata oluştu.',
      generalStats: {}, cookieStats: [], apiKeyStats: [], chartData: '{}', modelUsageData: '{}',
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
    log.error('Metrik sayfası yüklenirken hata:', error);
    res.status(500).render('metrics', {
      metrics: [],
      title: 'Hata',
      currentPage: 1,
      totalPages: 1,
      error: 'Metrikler yüklenirken bir hata oluştu.',
    });
  }
});

export { router as adminRouter }; 