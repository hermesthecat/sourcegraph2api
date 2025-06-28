# Types Klasörü

Bu klasör, projenin tamamında kullanılan TypeScript tür tanımlamalarını (`interface`, `class`, `type`) merkezi bir konumda toplar. Bu, kodun daha okunabilir, sürdürülebilir ve tip güvenli olmasını sağlar. TypeScript'in statik tipleme özellikleri sayesinde, geliştirme aşamasında olası hataların önüne geçilir.

## Sorumluluklar

* **Veri Yapılarını Tanımlama:** Uygulama içinde dolaşan veri nesnelerinin (örneğin, API istekleri, veritabanı nesneleri, yapılandırma) şeklini (`shape`) ve alanlarının tiplerini tanımlar.
* **API Sözleşmesi (Contract) Oluşturma:** Özellikle harici API'ler (OpenAI gibi) ile olan etkileşimlerde, istek ve yanıt gövdelerinin yapısını net bir şekilde belirler. Bu, API ile uyumluluğu garanti eder.
* **Tip Güvenliği Sağlama:** Projenin farklı katmanları (controllers, services, models) arasında veri aktarılırken tiplerin tutarlı kalmasını sağlar.
* **Geliştirici Deneyimini İyileştirme:** Kod editörlerinde (VS Code gibi) otomatik tamamlama, tip kontrolü ve anında hata bildirimi gibi özelliklerin çalışmasını mümkün kılar.

## Dosyalar

### `index.ts`

Bu dosya, projedeki tüm özel tür tanımlamalarını içerir ve mantıksal gruplara ayrılmıştır:

* **OpenAI Uyumlu Tipler:**
  * `OpenAIChatCompletionRequest`: `/v1/chat/completions` endpoint'ine gelen istek gövdesinin yapısını tanımlar.
  * `OpenAIChatCompletionResponse`: Bu endpoint'ten dönen (stream veya non-stream) yanıtın yapısını tanımlar.
  * `OpenAIChatMessage`, `Choice`, `Usage`, `Delta` gibi alt arayüzler, OpenAI API spesifikasyonuna tam uyumluluk sağlar.
  * `OpenAIErrorResponse`: Hata durumlarında istemciye döndürülecek standart hata nesnesinin yapısını belirler.

* **Uygulama ve Yapılandırma Tipleri:**
  * `BaseConfig`: `.env` dosyasından okunan ve sunucu başlangıcında belirlenen temel yapılandırma ayarlarının (örn: `port`, `host`, `debug`) tipini tanımlar.
  * `DynamicConfig`: Veritabanında saklanan ve yönetim panelinden dinamik olarak güncellenebilen ayarların (örn: `sessionSecret`, `requestRateLimit`, `userAgent`, `sourcegraphBaseUrl`) tipini tanımlar.
  * `AppConfig`: `BaseConfig` ve `DynamicConfig`'i birleştirerek uygulamanın tam yapılandırma nesnesinin tipini tanımlar.
  * `AppUser`: Yönetim paneli kullanıcısının temel özelliklerini (`id`, `username`) içerir.

* **Express & Passport.js Tip Genişletmeleri:**
  * `declare global { namespace Express { ... } }`: TypeScript'in "declaration merging" özelliğini kullanarak, `passport.js` gibi kütüphanelerin Express'in `Request` nesnesine eklediği `user`, `login()`, `logout()`, `isAuthenticated()` gibi özelliklerin tiplerini tanımlar. Bu, bu özelliklerin tip güvenli bir şekilde kullanılmasına olanak tanır.

* **Yardımcı Tipler:**
  * `ModelInfo`, `ModelListResponse`: `/v1/models` endpoint'i için veri yapılarını tanımlar.
  * `AppError`: Uygulama genelinde standartlaştırılmış hata yönetimi için kullanılan, `statusCode` ve `isOperational` gibi ek özellikler içeren özel bir `Error` sınıfıdır. Bu, operasyonel hatalar (tahmin edilebilir, örneğin "Kullanıcı bulunamadı") ile programlama hatalarını (beklenmedik hatalar) ayırt etmeye yardımcı olur.
