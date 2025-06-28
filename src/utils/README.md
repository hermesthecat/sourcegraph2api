# Utils Klasörü

"Utils" (Utilities - Araçlar), uygulama genelinde tekrar tekrar kullanılabilen, belirli bir iş alanına (domain) ait olmayan, genel amaçlı yardımcı fonksiyonları ve sınıfları içeren bir klasörüdür. Bu klasör, kod tekrarını önlemeye (`Don't Repeat Yourself - DRY`) ve kodun daha modüler ve temiz olmasına yardımcı olur.

## Sorumluluklar

* **Genel Amaçlı Fonksiyonlar Sağlama:** Veri formatlama, doğrulama, string işleme, hata ayıklama gibi projenin birçok yerinde ihtiyaç duyulan küçük ve bağımsız işlevleri barındırır.
* **Çekirdek Servisleri Destekleme:** Loglama gibi uygulama genelindeki temel servisleri yapılandırır ve kullanıma sunar.
* **Kod Tekrarını Önleme:** Farklı modüllerde aynı kod parçasının tekrar yazılmasının önüne geçerek bakım maliyetini düşürür.

## Dosyalar

### `logger.ts`

Uygulamanın loglama (günlük kaydı) altyapısını kurar ve yönetir.

* **Winston Kütüphanesi:** Güçlü ve esnek bir loglama kütüphanesi olan `winston`'ı temel alır.
* **Dinamik Yapılandırma:** Log seviyesi ve renkli çıktı gibi ayarları `config` nesnesinden (artık veritabanından dinamik olarak yüklenen) alır.
* **Çoklu "Transport":** Logları birden fazla hedefe aynı anda yazdırabilir:
  * **Console:** Geliştirme ortamında anlık takip için logları konsola yazdırır. `debug` modunda renklendirme yapar.
  * **Dosya:** Hataları (`error.log`), tüm logları (`combined.log`), yakalanamayan istisnaları (`exceptions.log`) ve reddedilen Promise'leri (`rejections.log`) ayrı dosyalara kaydeder.
* **Yapılandırılabilir Format:** Logların formatını (`timestamp`, `level`, `message`, `stack trace`) merkezi olarak tanımlar.
* **`log` Nesnesi:** `log.info()`, `log.error()` gibi standart loglama fonksiyonlarının yanı sıra, her bir isteği kendi ID'si ile loglamayı sağlayan özel bir `log.request()` fonksiyonu sunar. Bu, bir isteğin yaşam döngüsünü takip etmeyi çok kolaylaştırır.

### `helpers.ts`

Çeşitli küçük ve genel amaçlı yardımcı fonksiyonları içerir.

* **Ağ ve Zamanlama:**
  * `delay`: Belirtilen milisaniye kadar bekleyen bir Promise döndürür.
  * `calculateBackoff`: Tekrarlanan denemeler (retry) için üssel olarak artan bir bekleme süresi hesaplar (Exponential Backoff).
* **Veri İşleme ve Doğrulama:**
  * `safeJsonParse`: Bir string'i JSON olarak ayrıştırmaya çalışır, hata olursa `null` döner.
  * `sanitizeString`: Bir string'den zararlı olabilecek kontrol karakterlerini temizler.
  * `isValidUrl`, `isValidCookie`: Verilen string'lerin geçerli bir URL veya cookie formatında olup olmadığını kontrol eder.
* **Formatlama:**
  * `formatMemoryUsage`: Bayt cinsinden verilen bellek boyutunu okunabilir bir formata (KB, MB, GB) dönüştürür.
  * `formatDuration`: Milisaniye cinsinden verilen süreyi okunabilir bir formata (ms, s, m, h) dönüştürür.
  * `truncateText`: Uzun metinleri belirli bir karakter sayısından sonra "..." ile kısaltır.
* **Hata Yönetimi:**
  * `extractStatusCode`: Bir hata nesnesinden HTTP durum kodunu çıkarmaya çalışır.
* **Diğerleri:**
  * `generateRandomString`: Rastgele bir karakter dizisi oluşturur.
  * `isProduction`: Uygulamanın üretim ortamında çalışıp çalışmadığını kontrol eder.
  * `getCurrentTimestamp`: Geçerli zamanı saniye cinsinden Unix zaman damgası olarak alır.
