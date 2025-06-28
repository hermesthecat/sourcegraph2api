# `src` Klasörü - Uygulama Kaynak Kodu

Bu klasör, **Sourcegraph2API** projesinin tüm TypeScript kaynak kodunu içerir. Uygulama, modüler ve katmanlı bir mimariyi takip ederek geliştirilmiştir. Her alt klasör, belirli bir sorumluluğu yerine getiren ve projenin genel yapısını oluşturan bir katmanı temsil eder.

## Projenin Amacı

Bu proje, **Sourcegraph AI API**'sini, popüler **OpenAI API** formatına dönüştüren bir proxy sunucusudur. Bu sayede, OpenAI API'si ile entegre olabilen herhangi bir araç veya uygulama, bu proxy üzerinden Sourcegraph'ın güçlü kod anlama yeteneklerini kullanabilir. Ayrıca, proje kendi içinde bir yönetim paneli, veritabanı, kimlik doğrulama, kullanım takibi ve daha birçok özellik barındırır.

## Mimari ve Klasör Yapısı

Proje, genel olarak **Model-View-Controller (MVC)** benzeri bir yaklaşımla birlikte **Servis Katmanı Mimarisi**'ni benimser. Bu, endişelerin ayrılmasını (Separation of Concerns) sağlar ve kodun daha test edilebilir, sürdürülebilir ve ölçeklenebilir olmasına yardımcı olur.

---

### 1. Giriş Noktası ve Uygulama Kurulumu

Uygulamanın kalbi ve başlangıç noktası `src` klasörünün kökünde yer alır.

* **`index.ts`**: Uygulamanın ana giriş noktasıdır (`entrypoint`). `main()` fonksiyonu, uygulama başlarken yapılması gereken tüm adımları sırasıyla yönetir:
    1. Yapılandırmayı doğrular (`validateConfig`).
    2. Veritabanı bağlantısını kurar ve modelleri senkronize eder (`initializeDatabase`).
    3. Yapılandırmayı loglar (`logConfig`).
    4. Express sunucusunu başlatır (`startServer`).

* **`app.ts`**: Express uygulamasının kendisini oluşturur ve yapılandırır.
  * `createApp()`: Express `app` nesnesini oluşturur.
  * **Middleware Yığını (Stack):** Gelen her isteğin geçtiği ara katmanları belirli bir sırada (güvenlik, loglama, CORS, rate limiting, vb.) yapılandırır.
  * **View Engine:** Yönetim paneli için EJS (Embedded JavaScript templates) görüntü motorunu ayarlar.
  * **Rota Kurulumu:** `setupRoutes` fonksiyonu ile tüm API ve web rotalarını uygulamaya bağlar.
  * **Hata Yönetimi:** 404 (Not Found) ve genel 500 (Internal Server Error) hata yakalama mekanizmalarını kurar.

---

### 2. Katmanlar ve Sorumlulukları

Aşağıda, `src` içindeki her bir alt klasörün (katmanın) açıklaması bulunmaktadır.

#### [`config/`](./config/README.md)

Uygulamanın tüm yapılandırmasını yönetir. `.env` dosyasından ortam değişkenlerini okur ve uygulama genelinde kullanılabilir, tip güvenli bir `config` nesnesi sunar. Ayrıca, desteklenen tüm dil modellerinin bir kaydını (`modelRegistry`) tutar.

#### [`models/`](./models/README.md)

Veritabanı şemasını tanımlayan **Model** katmanıdır. Sequelize ORM kullanılarak veritabanı tabloları (`User`, `ApiKey`, `Cookie`, `UsageMetric`) TypeScript sınıfları olarak soyutlanır ve aralarındaki ilişkiler (`hasMany`, `belongsTo`) burada kurulur.

#### [`services/`](./services/README.md)

Uygulamanın **iş mantığının (business logic)** merkezidir. Veritabanı işlemleri (CRUD), harici Sourcegraph API'si ile iletişim, kimlik doğrulama mantığı (Passport.js), istatistik hesaplama ve önbellekleme gibi karmaşık operasyonlar bu katmanda yer alır.

#### [`middleware/`](./middleware/README.md)

Gelen istekleri işleyen **ara katman** fonksiyonlarını içerir. Kimlik doğrulama (`openaiAuth`, `isAuthenticated`), loglama (`requestLogger`), güvenlik (`helmet`), CORS, hız sınırlama (`rate-limit`) ve hata yönetimi gibi çapraz kesen ilgiler (cross-cutting concerns) burada yönetilir.

#### [`controllers/`](./controllers/README.md)

Gelen HTTP isteklerini alan ve yanıtlayan **Controller** katmanıdır. İstekleri doğrular, ilgili servis fonksiyonlarını çağırır ve servislerden dönen sonuçları istemcinin beklediği formatta (genellikle JSON) yanıt olarak döner.

#### [`routes/`](./routes/README.md)

Uygulamanın URL yollarını (endpoints) tanımlayan **yönlendirme** katmanıdır. Hangi URL yolunun hangi HTTP metoduyla hangi controller fonksiyonuna bağlanacağını belirler. API (`/v1`) ve yönetim paneli (`/admin`) için ayrı rota grupları içerir.

#### [`types/`](./types/README.md)

Proje genelinde kullanılan tüm **TypeScript türlerini** (`interface`, `class`) barındırır. Bu, API sözleşmelerini, veri yapılarını ve nesnelerin şeklini tanımlayarak kodun tip güvenli olmasını sağlar.

#### [`utils/`](./utils/README.md)

Belirli bir katmana ait olmayan, genel amaçlı **yardımcı fonksiyonları** içerir. Loglama altyapısı (`logger.ts`) ve diğer çeşitli yardımcı araçlar (`helpers.ts`) burada bulunur.
