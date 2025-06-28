# Views Klasörü

Bu klasör, uygulamanın "V" (View) katmanını temsil eder ve yönetim panelinin kullanıcı arayüzünü oluşturan tüm EJS (Embedded JavaScript) şablon dosyalarını içerir. Bu dosyalar, dinamik verileri (örneğin, veritabanından gelen cookie listesi) alarak sunucu tarafında HTML sayfaları oluşturmak (server-side rendering) için kullanılır.

`src/routes/admin.routes.ts` dosyasındaki rotalar, `res.render()` fonksiyonunu kullanarak bu şablon dosyalarını render eder ve kullanıcıya sunar.

## Sorumluluklar

* **Kullanıcı Arayüzünü Tanımlama:** Yönetim panelinin farklı sayfalarının (Dashboard, Cookie Yönetimi, Login vb.) HTML yapısını ve düzenini tanımlar.
* **Dinamik Veri Gösterimi:** Controller'lardan gelen verileri (örneğin, `cookies`, `apiKeys`, `stats`) EJS sözdizimi (`<%= %>`) kullanarak HTML içinde görüntüler.
* **Tekrar Kullanılabilir Bileşenler:** `partials` klasörü aracılığıyla, navigasyon menüsü gibi sayfalarda tekrar eden UI bileşenlerinin yeniden kullanılmasını sağlar.

## Dosyalar

### Ana Sayfa Şablonları

* **`login.ejs`**: Kullanıcıların yönetim paneline giriş yapması için kullanıcı adı ve parola alanlarını içeren giriş sayfası.
* **`dashboard.ejs`**: Giriş yapıldıktan sonra ulaşılan ana panel. Genel kullanım istatistiklerini, grafiklerini ve diğer özet bilgileri görüntüler.
* **`cookies.ejs`**: Veritabanındaki tüm `Cookie`'leri bir tablo halinde listeleyen, yeni cookie ekleme formu içeren ve mevcut olanları düzenleme/silme/aktifleştirme seçenekleri sunan sayfa.
* **`edit-cookie.ejs`**: Belirli bir cookie'yi düzenlemek için kullanılan özel form sayfası.
* **`apikeys.ejs`**: Veritabanındaki tüm API anahtarlarını listeleyen, yeni anahtar oluşturma ve mevcut olanları silme/aktifleştirme seçenekleri sunan sayfa.
* **`users.ejs`**: Yönetim paneline erişimi olan kullanıcıları listeleyen, yeni kullanıcı ekleme, düzenleme ve silme formlarını içeren sayfa.
* **`metrics.ejs`**: API kullanım loglarını (`UsageMetric` kayıtlarını) sayfalama (pagination) yaparak detaylı bir şekilde gösteren sayfa.
* **`settings.ejs`**: Uygulamanın dinamik olarak yönetilen ayarlarını (örneğin, `sessionSecret`, `requestRateLimit`, `userAgent`, `sourcegraphBaseUrl`) görüntülemek ve güncellemek için form alanlarını içeren sayfa.

### `partials/` Klasörü

Bu alt klasör, birden fazla sayfada kullanılan ve tekrar eden HTML parçalarını içerir. Bu, kod tekrarını önler ve bakımı kolaylaştırır.

* **`nav.ejs`**: Yönetim panelinin tüm sayfalarında görünen üst navigasyon çubuğunu içerir.
* **`messages.ejs`**: Kullanıcı bir işlem yaptıktan sonra (örneğin, "Cookie başarıyla eklendi") çıkan başarı veya hata mesajlarını (flash messages) görüntülemek için kullanılan bileşendir.
