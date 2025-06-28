# Services Klasörü

Bu klasör, uygulamanın iş mantığının (business logic) merkezidir. Controller'lar tarafından alınan istekleri işler, veritabanı operasyonlarını yürütür, harici API'lerle iletişim kurar ve uygulamanın temel fonksiyonlarını yerine getirir. Servis katmanı, uygulamanın "beyni" olarak kabul edilebilir.

## Sorumluluklar

* **Veritabanı Etkileşimi:** `models` klasöründe tanımlanan Sequelize modellerini kullanarak veritabanına veri ekleme, okuma, güncelleme ve silme (CRUD) işlemlerini gerçekleştirir.
* **Harici API İletişimi:** Uygulamanın ana amacı olan Sourcegraph API'si ile iletişimi yönetir.
* **İş Mantığı:** Kimlik doğrulama, yetkilendirme, istatistik hesaplama, önbellekleme gibi karmaşık işlemleri yürütür.
* **Veri İşleme:** Ham verileri alır ve bunları anlamlı bilgilere veya istatistiklere dönüştürür.

## Dosyalar

### Çekirdek Servisler

* **`database.ts`**: Uygulamanın temelidir.
  * **Sequelize Kurulumu:** `database.sqlite` dosyasını kullanarak bir Sequelize instance'ı oluşturur ve veritabanı bağlantısını yönetir.
  * **Model Senkronizasyonu:** Uygulama başladığında `models` klasöründeki tüm modelleri veritabanı şemasıyla senkronize eder (`sequelize.sync`).
  * **Session Store:** `connect-session-sequelize` kullanarak kullanıcı oturumlarını (sessions) veritabanında saklamak için bir session store oluşturur.
  * **Varsayılan Kullanıcı:** Veritabanı boşsa, ilk başlangıçta bir `admin` kullanıcısı oluşturur.

* **`sourcegraph.ts`**: Uygulamanın ana proxy işlevini yerine getiren en kritik servistir.
  * `SourcegraphClient`: Sourcegraph API'sine istekleri yöneten bir sınıf içerir.
  * **İstek Dönüşümü:** Gelen OpenAI formatındaki istekleri Sourcegraph'ın beklediği formata (`convertToSourcegraphFormat`) dönüştürür.
  * **Cookie Havuzu:** Her istek için `cookie.service` üzerinden rastgele aktif bir cookie seçerek kimlik doğrulama başlıklarını (`Authorization`, `Cookie`) oluşturur.
  * **Streaming İstekleri:** `axios` ve Node.js `stream` modüllerini kullanarak Sourcegraph'tan gelen yanıtları parça parça (stream) işler ve istemciye iletir.
  * **Dinamik Endpointler:** `SOURCEGRAPH_BASE_URL` ve `CHAT_ENDPOINT` gibi değerleri artık `config` nesnesinden dinamik olarak alır, bu da panelden güncellenebilmelerini sağlar.
  * **Metrik Kaydı:** Her başarılı veya başarısız isteğin sonucunu `metric.service`'i çağırarak veritabanına kaydeder.

* **`auth.service.ts`**: Yönetim paneli kimlik doğrulamasını yönetir.
  * **Passport.js Kurulumu:** Kullanıcı adı ve parola ile girişi sağlayan `LocalStrategy`'yi yapılandırır.
  * **Session Yönetimi:** Kullanıcı bilgilerini session'a kaydetmek (`serializeUser`) ve session'dan geri okumak (`deserializeUser`) için gerekli fonksiyonları tanımlar.

* **`settings.service.ts`**: Uygulamanın dinamik ayarlarını veritabanında yönetir.
  * `getEditableSettings`: Yönetim panelindeki ayarlar sayfasında gösterilecek ayarları veritabanından getirir.
  * `updateSettings`: Yönetim panelinden gelen güncellenmiş ayarları veritabanına kaydeder ve `config` nesnesini anında günceller.

### Veri Yönetim (CRUD) Servisleri

Bu servisler, yönetim panelinden gelen istekleri işlemek için `models` katmanı üzerinde standart CRUD operasyonları sağlar.

* **`apikey.service.ts`**: API anahtarlarını yönetir (`getAllApiKeys`, `addApiKey`, `deleteApiKey`, `toggleApiKeyStatus`). `isValidActiveApiKey` fonksiyonu, `openaiAuth` middleware'i tarafından kullanılır.
* **`cookie.service.ts`**: Cookie'leri yönetir (`getAllCookies`, `addCookie`, `deleteCookie`, `toggleCookieStatus`). `getRandomActiveCookie` fonksiyonu, `sourcegraph.ts` tarafından her istekte kullanılır.
* **`user.service.ts`**: Yönetim paneli kullanıcılarını yönetir (`getAllUsers`, `addUser`, `deleteUser`, `updateUser`).

### Analitik ve İstatistik Servisleri

* **`metric.service.ts`**: Veritabanı tabanlı metrik kaydı yapar.
  * `recordUsage`: Her bir API isteğinin detaylarını (`ipAddress`, `model`, `wasSuccess` vb.) `usage_metrics` tablosuna kaydeder.
  * `getUsageMetrics`: Kaydedilmiş metrikleri sayfalama ve filtreleme yaparak sorgulama imkanı sunar (Yönetim panelindeki `/metrics` sayfası için).

* **`statistics.service.ts`**: `metric.service` tarafından toplanan verilerden anlamlı istatistikler üretir.
  * Veritabanında `COUNT`, `SUM`, `GROUP BY` gibi Sequelize'nin gelişmiş sorgulama yeteneklerini kullanarak dashboard için veri hazırlar (`getGeneralStats`, `getCookieUsageStats`, `getModelUsageStats`, `getDailyUsageForChart`).

### Yardımcı Servisler

* **`cache.ts`**: Bellek içi (in-memory) önbellekleme mekanizması sağlar.
  * `InMemoryCache`: TTL (Time-To-Live), maksimum boyut ve LRU-benzeri (en eski olanı sil) çıkarma politikalarını destekleyen bir sınıf içerir.
  * Farklı amaçlar için birden çok cache örneği (`responseCache`, `modelCache`) oluşturur.
  * `SafeCache`: Orijinal cache sınıfını saran ve hata yönetimini kolaylaştıran bir sarmalayıcıdır.

* **`analytics.ts`**: Veritabanından bağımsız, sadece bellek içi (in-memory) çalışan ve anlık performans metrikleri (toplam istek, hata oranı, ortalama yanıt süresi vb.) tutan bir servistir. Bu metrikler uygulama yeniden başladığında sıfırlanır.

* **`index.ts`**: Tüm servisleri tek bir yerden dışa aktararak diğer modüllerin servislere kolayca erişimini sağlar ve servislerin genel sağlık durumunu kontrol eden `getServicesHealth` fonksiyonunu içerir.
