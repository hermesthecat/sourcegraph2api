# Middleware Klasörü

Bu klasör, Express.js uygulamasının "ara katman" (middleware) fonksiyonlarını içerir. Ara katmanlar, gelen istek (`request`) ve giden yanıt (`response`) nesneleri üzerinde işlem yapan, istek/yanıt döngüsünün ortasında yer alan fonksiyonlardır. Bu katman, kimlik doğrulama, loglama, güvenlik, hata yönetimi gibi "çapraz kesen ilgileri" (cross-cutting concerns) yönetmek için kritik bir rol oynar.

## Sorumluluklar

* **Kimlik Doğrulama ve Yetkilendirme:** Gelen isteklerin geçerli kimlik bilgileri (API anahtarı, session token vb.) içerip içermediğini kontrol eder.
* **İstek İşleme:** Her isteğe benzersiz bir ID atama, istek detaylarını loglama gibi işlemleri gerçekleştirir.
* **Güvenlik:** CORS (Cross-Origin Resource Sharing) politikalarını uygulama, güvenlik başlıkları ekleme (Helmet.js), istek oranını sınırlama (rate limiting) ve belirli IP adreslerini engelleme gibi görevleri yerine getirir. Bu ayarlar artık veritabanından dinamik olarak yönetilmektedir.
* **Performans:** Yanıtları sıkıştırarak (`compression`) ağ trafiğini azaltır.
* **Hata Yönetimi:** Uygulama genelinde oluşan hataları merkezi bir şekilde yakalar, loglar ve istemciye standart bir formatta hata yanıtı döner.

## Dosyalar

### `auth.ts`

Kimlik doğrulama ile ilgili tüm ara katmanları içerir.

* `openaiAuth`: OpenAI API'si ile uyumlu `Bearer <token>` formatındaki `Authorization` başlığını kontrol eder. Gelen API anahtarının veritabanında aktif olup olmadığını `apikey.service` üzerinden doğrular. Başarılı olursa, `apiKey` ve `apiKeyId` bilgilerini istek nesnesine (`req`) ekler.
* `isAuthenticated`: Yönetim paneli gibi web arayüzü rotalarını korumak için kullanılır. Passport.js'in `req.isAuthenticated()` metodunu kullanarak kullanıcının oturum açıp açmadığını kontrol eder. Oturum açmamış kullanıcıları giriş sayfasına yönlendirir.
* `apiAuth` (`@deprecated`): Eski `proxy-secret` başlığını kullanan ve artık geliştirilmesi düşünülmeyen bir kimlik doğrulama yöntemidir.

### `index.ts`

Uygulamanın genelinde kullanılan çeşitli ara katmanları tanımlar ve dışa aktarır.

* `requestId`: Her isteğe bir UUID atayarak loglama ve takip işlemlerini kolaylaştırır.
* `requestLogger`: Gelen istekleri ve tamamlanan yanıtların durum kodunu, süresini vb. loglar.
* `corsMiddleware`: Tarayıcıların farklı domain'lerden gelen isteklere izin vermesini sağlayan CORS ayarlarını yapar.
* `securityMiddleware`: `helmet` kütüphanesini kullanarak uygulamayı bilinen web zafiyetlerine karşı korumak için çeşitli HTTP güvenlik başlıkları ekler.
* `compressionMiddleware`: Yanıt gövdelerini (JSON, HTML vb.) sıkıştırarak istemciye daha hızlı gönderilmesini sağlar. SSE (Server-Sent Events) akışları için sıkıştırmayı atlar.
* `rateLimitMiddleware`: Belirli bir zaman aralığında bir IP adresinden gelebilecek istek sayısını `config`'den (veritabanından) aldığı `requestRateLimit` değerine göre sınırlar.
* `ipBlacklistMiddleware`: `config`'den (veritabanından) aldığı `ipBlacklist` dizisinde bulunan IP adreslerinden gelen istekleri engeller.
* `errorHandler`: Uygulamanın herhangi bir yerinde `next(error)` ile tetiklenen veya yakalanamayan hatalar için son çare (catch-all) mekanizmasıdır. Hataları loglar ve 500 Internal Server Error yanıtı döner.
* `notFoundHandler`: Tanımlı rotalardan hiçbiriyle eşleşmeyen istekler için 404 Not Found yanıtı döner.
