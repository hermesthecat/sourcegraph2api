/**
 * Admin Routes / Yönetim Rotaları
 * Cookie yönetim arayüzü için rotaları tanımlar
 * Defines routes for the cookie management interface
 */

import { Router, Request, Response } from 'express';
import { getAllCookies, addCookie, deleteCookie, toggleCookieStatus } from '../services/cookie.service';
import { log } from '../utils/logger';

const router = Router();

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

export { router as adminRouter }; 