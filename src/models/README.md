# Models Klasörü

Bu klasör, uygulamanın "M" (Model) katmanını temsil eder ve veritabanı şemasını tanımlar. [Sequelize](https://sequelize.org/) ORM (Object-Relational Mapper) kullanılarak, veritabanı tabloları TypeScript sınıfları olarak soyutlanır. Bu, veritabanı işlemlerinin (oluşturma, okuma, güncelleme, silme) daha güvenli ve kolay bir şekilde yapılmasına olanak tanır.

## Sorumluluklar

* **Veritabanı Tablo Şemalarını Tanımlama:** Her bir model dosyası, veritabanındaki bir tabloya karşılık gelir ve o tablonun sütunlarını, veri tiplerini, kısıtlamalarını (birincil anahtar, benzersizlik vb.) ve varsayılan değerlerini tanımlar.
* **Veri Yapılarını Belirleme:** Uygulama içinde kullanılacak veri yapılarının (örneğin, `User`, `ApiKey`) niteliklerini (attributes) ve tiplerini belirtir.
* **Model İlişkilerini Kurma:** `index.ts` dosyası aracılığıyla modeller arasındaki ilişkileri (One-to-Many, Many-to-Many vb.) tanımlar. Bu, ilişkili verilerin kolayca sorgulanmasını sağlar (`JOIN` işlemleri gibi).
* **Veri Bütünlüğünü Sağlama:** Kancalar (hooks) gibi Sequelize özellikleri kullanılarak veri tabanına yazılmadan önce verilerin doğrulanmasını veya işlenmesini (örneğin, parola hash'leme) sağlar.

## Dosyalar

### `apikey.model.ts`

`api_keys` tablosunu temsil eden `ApiKey` modelini tanımlar. Bu tablo, uygulamaya programatik erişim için kullanılan API anahtarlarını saklar.

* **Alanlar:** `id`, `key` (asıl anahtar), `alias` (kolay isim), `isActive`.

### `cookie.model.ts`

`cookies` tablosunu temsil eden `Cookie` modelini tanımlar. Bu tablo, Sourcegraph'a istek atmak için kullanılan `SG_COOKIE` değerlerini saklar.

* **Alanlar:** `id`, `alias`, `cookieValue` (asıl cookie), `isActive`.

### `setting.model.ts`

`settings` tablosunu temsil eden `Setting` modelini tanımlar. Bu tablo, uygulamanın dinamik olarak yönetilen yapılandırma ayarlarını anahtar-değer çiftleri olarak saklar. `SESSION_SECRET`, `REQUEST_RATE_LIMIT`, `USER_AGENT` gibi ayarlar artık burada saklanır.

* **Alanlar:** `key` (ayarın adı), `value` (ayarın değeri).

### `usage.model.ts`

`usage_metrics` tablosunu temsil eden `UsageMetric` modelini tanımlar. Bu tablo, yapılan her API isteğini loglayarak kullanım istatistikleri için veri sağlar.

* **Alanlar:** `id`, `ipAddress`, `requestTimestamp`, `wasSuccess`, `errorMessage`, `model`, `cookieId`, `apiKeyId`.

### `user.model.ts`

`users` tablosunu temsil eden `User` modelini tanımlar. Bu tablo, yönetim paneline giriş yapabilen kullanıcıların bilgilerini saklar.

* **Alanlar:** `id`, `username`, `password`.
* **Özellikler:**
  * **Parola Hash'leme:** `beforeSave` kancası (hook) ile bir kullanıcı kaydı oluşturulmadan veya güncellenmeden önce `password` alanını otomatik olarak `bcryptjs` ile hash'ler.
  * `validatePassword`: Girilen bir parolanın veritabanındaki hash'lenmiş parola ile eşleşip eşleşmediğini kontrol eden bir metot içerir.

### `index.ts`

Bu dosya, tüm modelleri merkezi bir yerden yönetir:

* **Modelleri İçe Aktarır:** Diğer tüm model dosyalarını (artık `setting.model.ts` dahil) içe aktarır.
* **İlişkileri Tanımlar:**
  * `ApiKey` ve `UsageMetric` arasında **One-to-Many** ilişki kurar (bir API anahtarının birden çok kullanım metriği olabilir).
  * `Cookie` ve `UsageMetric` arasında **One-to-Many** ilişki kurar (bir cookie'nin birden çok kullanım metriği olabilir).
* **Modelleri Dışa Aktarır:** Tüm modelleri ve ilişkileri tek bir noktadan dışa aktararak uygulama genelinde kolayca kullanılmalarını sağlar.
