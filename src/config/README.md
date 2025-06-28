# Config Klasörü

Bu klasör, uygulamanın tüm yapılandırma ayarlarını yönetmekten sorumludur. Ortam değişkenlerini (`.env` dosyasından) okur, bunları işler ve uygulama genelinde kullanılabilir bir yapılandırma nesnesi olarak sunar.

## Dosyalar

### `index.ts`

Bu dosya, yapılandırma yönetiminin merkezidir ve aşağıdaki ana sorumlulukları yerine getirir:

* **Ortam Değişkenlerini Yükleme:** `dotenv` kütüphanesini kullanarak projenin kök dizinindeki `.env` dosyasından ortam değişkenlerini yükler.
* **Yardımcı Fonksiyonlar:** `getEnvString`, `getEnvNumber`, `getEnvBoolean`, `getEnvArray` gibi yardımcı fonksiyonlar aracılığıyla ortam değişkenlerine güvenli bir şekilde erişim sağlar. Bu fonksiyonlar, bir değişken tanımlanmamışsa varsayılan değerlerin kullanılmasına olanak tanır.
* **`config` Nesnesi:** Uygulamanın tüm ayarlarını içeren ve dışa aktarılan bir `config` nesnesi oluşturur. Bu nesne aşağıdaki gibi gruplandırılmış ayarları içerir:
  * **Temel Ayarlar:** `port`, `host`, `debug`, `nodeEnv`
  * **Güvenlik:** `sessionSecret`, `ipBlacklist`
  * **Ağ Ayarları:** `proxyUrl`, `userAgent`
  * **Hız Sınırlama:** `requestRateLimit`
* **`modelRegistry` Nesnesi:** Uygulamanın en kritik parçalarından biridir. Bu nesne, desteklenen tüm büyük dil modellerini (Claude, GPT, Gemini vb.) ve bu modellerin Sourcegraph API'sindeki referanslarını (`modelRef`) ve maksimum token sayılarını içeren statik bir kayıt defteridir. Bu, uygulamanın bir model proxy'si olarak çalışmasını sağlar.
* **Yapılandırma Doğrulama ve Loglama:**
  * `validateConfig`: Uygulama başlamadan önce temel yapılandırma ayarlarının (örneğin, geçerli bir `PORT` numarası) doğru olup olmadığını kontrol eder.
  * `logConfig`: Hata ayıklama (`debug`) modu aktif olduğunda, mevcut yapılandırmayı konsola yazdırarak geliştiricilere kolaylık sağlar.

## Kullanım

Burada tanımlanan `config` nesnesi, uygulama genelinde (servisler, ara katmanlar, uygulama başlangıç dosyası vb.) `import { config } from '../config'` ifadesiyle içe aktarılarak kullanılır. Bu merkezi yaklaşım, yapılandırma yönetimini basitleştirir ve tutarlılığı sağlar.
