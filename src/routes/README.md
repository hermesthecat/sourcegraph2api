# Routes Klasörü

Bu klasör, Express.js uygulamasının yönlendirme (routing) katmanını tanımlar. Gelen HTTP isteklerini belirli URL yollarına (endpoints) göre ilgili controller fonksiyonlarına yönlendirir. Ayrıca, belirli yollar için ara katmanları (middleware) uygular.

## Sorumluluklar

* **URL Yollarını Tanımlama:** Uygulamanın API endpoint'lerini (örneğin, `/v1/chat/completions`, `/admin/dashboard`) ve bu yollara hangi HTTP metodları (GET, POST, vb.) ile erişilebileceğini tanımlar.
* **Controller'ları Yönlendirme:** Gelen bir isteği, iş mantığını yürütecek olan ilgili controller fonksiyonuna bağlar.
* **Ara Katmanları Uygulama:** Belirli yollar veya yol grupları için kimlik doğrulama (`openaiAuth`), yetkilendirme (`isAuthenticated`) gibi ara katmanları uygular.
* **Yol Gruplama:** İlgili yolları `Express.Router` kullanarak modüler gruplar halinde organize eder (örneğin, `adminRouter`, `v1Router`).

## Dosyalar

### `main.ts`

Uygulamanın ana yönlendiricisini (`Router`) oluşturan ve yapılandıran dosyadır.

* `createApiRouter`: Ana router nesnesini oluşturur ve tüm alt rotaları (API, yönetim, sağlık kontrolü vb.) buna bağlar.
  * **Kök (`/`) ve Sağlık Kontrolü (`/health`) Rotaları:** Uygulama hakkında genel bilgi ve sağlık durumu endpoint'lerini tanımlar.
  * **Kimlik Doğrulama Rotaları (`/login`, `/logout`):** Yönetim paneli için kullanıcı giriş ve çıkış işlemlerini yönetir. `passport.js` ile entegredir.
  * **Yönetim Paneli (`/admin`):** `/admin` ön eki ile gelen tüm istekleri `admin.routes.ts` içinde tanımlanan `adminRouter`'a yönlendirir.
  * **V1 API Rotaları (`/v1`):** `/v1` ön eki ile gelen ve OpenAI uyumlu olan ana API rotalarını (`/chat/completions`, `/models`) tanımlar. Bu rotalar `openaiAuth` ara katmanı ile korunur.
  * **Metrik Rotaları (`/metrics`):** Uygulama performansı ve istatistikleri hakkında bilgi veren endpoint'leri içerir.
* `setupRoutes`: `createApiRouter` tarafından oluşturulan ana router'ı ana Express `app` nesnesine bağlar.
* `processRoutePrefix`: `config`'den (artık veritabanından dinamik olarak yüklenen) gelen `routePrefix` değerini işleyerek API rotalarının özel bir ön ek altında sunulmasına olanak tanır.

### `admin.routes.ts`

Yönetim paneli arayüzü için gerekli olan tüm rotaları içerir. Bu rotaların tamamı, kullanıcının oturum açmasını gerektiren bir ara katman tarafından korunmaktadır.

* **Dashboard (`/dashboard`):** Genel istatistikleri, kullanım grafiklerini ve model kullanım oranlarını gösteren ana panel sayfasını render eder.
* **Cookie Yönetimi (`/cookies`):** Cookie'leri listelemek, eklemek, düzenlemek, silmek ve aktif/pasif durumunu değiştirmek için CRUD (Oluştur, Oku, Güncelle, Sil) operasyonlarını yöneten rotaları içerir.
* **API Anahtarı Yönetimi (`/apikeys`):** API anahtarlarını listelemek, oluşturmak, silmek ve durumunu değiştirmek için CRUD rotalarını içerir.
* **Kullanıcı Yönetimi (`/users`):** Yönetim paneline erişebilen kullanıcıları listelemek, eklemek, güncellemek ve silmek için rotaları içerir.
* **Kullanım Metrikleri (`/metrics`):** API kullanım loglarını sayfalama (pagination) yaparak gösteren bir sayfa sunar.
* **Ayarlar (`/settings`):** Uygulamanın dinamik ayarlarını (örneğin, `sessionSecret`, `requestRateLimit`, `userAgent`) görüntülemek ve güncellemek için bir arayüz sağlar.
* **Flash Mesajları:** Kullanıcı işlemlerinden sonra (örneğin, "Cookie başarıyla eklendi") bilgilendirme mesajları göstermek için `connect-flash` ve session tabanlı bir ara katman kullanır.

### `index.ts`

`main.ts` dosyasındaki `createApiRouter` ve `setupRoutes` fonksiyonlarını dışa aktararak `app.ts` gibi üst katman modüllerinin bu fonksiyonlara temiz bir şekilde erişmesini sağlar.
