# Controllers Klasörü

Bu klasör, uygulamanın "C" (Controller) katmanını temsil eder. Gelen HTTP isteklerini alır, bu istekleri işlemek için gerekli olan servis katmanı fonksiyonlarını çağırır ve istemciye uygun HTTP yanıtını döner. Her bir controller, belirli bir işlevsel alana odaklanmıştır.

## Sorumluluklar

* **İstek/Yanıt Döngüsünü Yönetme:** Express'in `Request` ve `Response` nesnelerini kullanarak gelen istekleri işler ve yanıtları oluşturur.
* **İstek Doğrulama:** Gelen istek gövdelerini (`body`), parametreleri (`params`) ve sorgu dizelerini (`query`) doğrular. Eksik veya geçersiz veri durumunda istemciye 4xx hata kodları ile bilgi verir.
* **Servis Katmanını Çağırma:** İş mantığını içeren servisleri (örneğin, `sourcegraphClient`) çağırarak asıl işin yapılmasını sağlar.
* **Yanıt Formatlama:** Servislerden dönen verileri, API spesifikasyonuna (örneğin, OpenAI API formatı) uygun bir şekilde formatlayarak istemciye JSON formatında sunar.
* **Hata Yönetimi:** İşlemler sırasında oluşan hataları yakalar ve uygun HTTP hata kodları (genellikle 500) ile birlikte loglar.

## Dosyalar

### `chat.ts`

OpenAI uyumlu `/v1/chat/completions` endpoint'ini yönetir.

* `chatCompletion`: Ana fonksiyondur. Gelen isteği doğrular, modelin desteklenip desteklenmediğini kontrol eder ve isteğin `stream` olup olmamasına göre `handleStreaming` veya `handleNonStreaming` fonksiyonlarını çağırır.
* `handleStreaming`: Server-Sent Events (SSE) kullanarak yanıtı parça parça (chunk) gönderir.
* `handleNonStreaming`: Sourcegraph API'sinden gelen tüm yanıtı birleştirir ve tek bir JSON nesnesi olarak döner.

### `health.ts`

Uygulamanın sağlık durumunu kontrol etmek için kullanılan endpoint'leri yönetir.

* `healthCheck`: (`/health`) Uygulamanın temel durumunu (uptime, versiyon, environment) içeren basit bir yanıt döner.
* `detailedHealthCheck`: (`/health/detailed`) Bellek kullanımı, cookie durumu, yapılandırma detayları gibi daha ayrıntılı sistem bilgileri sunar.
* `rootEndpoint`: (`/`) Uygulamanın kök dizinine yapılan istekleri karşılar ve proje hakkında genel bilgiler ile mevcut endpoint'lerin bir listesini sunar.

### `models.ts`

OpenAI uyumlu `/v1/models` endpoint'lerini yönetir.

* `getModels`: (`/v1/models`) `config` dosyasında tanımlı olan ve desteklenen tüm modellerin bir listesini OpenAI formatında döner.
* `getModel`: (`/v1/models/{model}`) Belirli bir modelin detaylarını döner.

### `index.ts`

Bu dosya, klasördeki tüm controller fonksiyonlarını tek bir noktadan dışa aktararak (`export`) kodun daha düzenli ve yönetilebilir olmasını sağlar. Bu sayede, `routes` katmanı controller'lara daha temiz bir şekilde erişebilir.
