# Config Klasörü

Bu klasör, uygulamanın tüm yapılandırma ayarlarını yönetmekten sorumludur. Ancak artık ayarların çoğu `.env` dosyasından değil, veritabanından dinamik olarak yönetilmektedir.

## Sorumluluklar

* **Temel Yapılandırma:** Sunucu başlatılırken ihtiyaç duyulan `PORT`, `HOST`, `NODE_ENV`, `DEBUG` gibi temel ayarları `.env` dosyasından okur. Bu ayarların güncellenmesi için sunucunun yeniden başlatılması gerekir.
* **Dinamik Yapılandırma Yükleme:** Uygulama başlatıldığında, veritabanından `settings` tablosundaki dinamik ayarları (`SESSION_SECRET`, `REQUEST_RATE_LIMIT`, `ROUTE_PREFIX`, `PROXY_URL`, `IP_BLACKLIST`, `LOG_LEVEL`, `USER_AGENT`, `TZ`, `REASONING_HIDE`, `SOURCEGRAPH_BASE_URL`, `CHAT_ENDPOINT` gibi) yükler ve bellekte tutar.
* **Anlık Güncelleme:** Yönetim panelinden yapılan ayar değişiklikleri, veritabanının yanı sıra bellekteki aktif yapılandırma nesnesini de anında günceller. Bu sayede sunucuyu yeniden başlatmaya gerek kalmaz.
* **Model Kaydı:** Uygulamanın desteklediği tüm dil modellerini (`modelRegistry`) ve bu modellere ait Sourcegraph referanslarını ve maksimum token sayılarını içeren statik bir kayıt defterini barındırır.

## Dosyalar

### `index.ts`

Bu dosya, yapılandırma yönetiminin merkezidir ve aşağıdaki ana sorumlulukları yerine getirir:

* **`getBaseConfig()`**: `.env` dosyasından `PORT`, `HOST`, `DEBUG`, `NODE_ENV` gibi temel ayarları okur.
* **`loadConfigFromDb()`**: `Setting` modelini kullanarak veritabanındaki ayarları yükler. Veritabanında eksik olan varsayılan ayarları oluşturur ve `liveConfig` nesnesini doldurur.
* **`config` Nesnesi (Proxy):** Uygulama genelinde kullanılan ana yapılandırma nesnesidir. Bu bir proxy nesnesidir, bu sayede `config.sessionSecret` gibi bir değere erişildiğinde her zaman bellekteki en güncel değeri alır.
* **`updateLiveConfig()`**: Bellekteki `liveConfig` nesnesini anında günceller. Bu fonksiyon, ayarlar panelinden bir ayar güncellendiğinde çağrılır.
* **`modelRegistry` Nesnesi:** Uygulamanın desteklediği dil modellerinin statik listesini içerir.
* **`getModelInfo()` ve `getModelList()`:** Model kayıt defterine erişim sağlayan yardımcı fonksiyonlar.

## Kullanım

`config` nesnesi, uygulama genelinde `import { config } from '../config'` ifadesiyle içe aktarılarak kullanılır. Bu merkezi ve dinamik yaklaşım, yapılandırma yönetimini basitleştirir ve sunucu yeniden başlatma ihtiyacını ortadan kaldırır.
