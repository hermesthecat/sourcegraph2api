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
      error: null // Hata olmadığında bile 'error' değişkenini null olarak gönder
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
      message: req.query.message,
      error: req.query.error,
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
      return res.redirect('/admin/cookies?error=Düzenlenecek cookie bulunamadı.');
    }
    res.render('edit-cookie', {
      title: 'Cookie Düzenle',
      cookie,
      error: req.query.error,
    });
  } catch (error) {
    log.error('Cookie düzenleme sayfası yüklenirken hata:', error);
    res.redirect('/admin/cookies?error=Sayfa yüklenirken bir hata oluştu.');
  }
});

// Cookie'yi güncelle
router.post('/cookies/edit/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { alias, cookieValue } = req.body;
  if (!alias || !cookieValue) {
    return res.redirect(`/admin/cookies/edit/${id}?error=Takma ad ve cookie değeri boş olamaz.`);
  }
  try {
    await updateCookie(Number(id), alias, cookieValue);
    res.redirect('/admin/cookies?message=Cookie başarıyla güncellendi.');
  } catch (error) {
    log.error(`Cookie güncellenirken hata (ID: ${id}):`, error);
    res.redirect(`/admin/cookies/edit/${id}?error=Cookie güncellenirken bir hata oluştu.`);
  }
});

// Yeni bir cookie ekle
// POST /admin/cookies/add
router.post('/cookies/add', async (req: Request, res: Response) => {
  const { alias, cookieValue } = req.body;
  if (!alias || !cookieValue) {
    return res.redirect('/admin/cookies?error=Takma ad ve cookie değeri boş olamaz.');
  }
  try {
    await addCookie(alias, cookieValue);
    res.redirect('/admin/cookies?message=Cookie başarıyla eklendi.');
  } catch (error) {
    log.error('Cookie eklenirken hata:', error);
    res.redirect('/admin/cookies?error=Cookie eklenirken bir hata oluştu.');
  }
});

// Bir cookie'yi sil
// POST /admin/cookies/delete/:id
router.post('/cookies/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteCookie(Number(id));
    res.redirect('/admin/cookies?message=Cookie başarıyla silindi.');
  } catch (error) {
    log.error(`Cookie silinirken hata (ID: ${id}):`, error);
    res.redirect('/admin/cookies?error=Cookie silinirken bir hata oluştu.');
  }
});

// Bir cookie'nin durumunu değiştir
// POST /admin/cookies/toggle/:id
router.post('/cookies/toggle/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await toggleCookieStatus(Number(id));
    res.redirect('/admin/cookies?message=Cookie durumu başarıyla güncellendi.');
  } catch (error) {
    log.error(`Cookie durumu güncellenirken hata (ID: ${id}):`, error);
    res.redirect('/admin/cookies?error=Cookie durumu güncellenirken bir hata oluştu.');
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
      message: req.query.message,
      error: req.query.error,
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
    return res.redirect('/admin/apikeys?error=Takma ad boş olamaz.');
  }
  try {
    const newKey = `s2a-${uuidv4()}`; // Yeni, benzersiz bir anahtar oluştur
    await addApiKey(alias, newKey);
    res.redirect('/admin/apikeys?message=API anahtarı başarıyla oluşturuldu ve eklendi.');
  } catch (error) {
    log.error('API anahtarı eklenirken hata:', error);
    res.redirect('/admin/apikeys?error=API anahtarı eklenirken bir hata oluştu.');
  }
});

// Bir API anahtarını sil
// POST /admin/apikeys/delete/:id
router.post('/apikeys/delete/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteApiKey(Number(id));
    res.redirect('/admin/apikeys?message=API anahtarı başarıyla silindi.');
  } catch (error) {
    log.error(`API anahtarı silinirken hata (ID: ${id}):`, error);
    res.redirect('/admin/apikeys?error=API anahtarı silinirken bir hata oluştu.');
  }
});

// Bir API anahtarının durumunu değiştir
// POST /admin/apikeys/toggle/:id
router.post('/apikeys/toggle/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await toggleApiKeyStatus(Number(id));
    res.redirect('/admin/apikeys?message=API anahtarı durumu başarıyla güncellendi.');
  } catch (error) {
    log.error(`API anahtarı durumu güncellenirken hata (ID: ${id}):`, error);
    res.redirect('/admin/apikeys?error=API anahtarı durumu güncellenirken bir hata oluştu.');
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
      message: req.query.message,
      error: req.query.error,
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