# Sourcegraph2API - Node.js Versiyonu

🚀 **Sourcegraph AI API'sini OpenAI API formatına dönüştüren, yüksek performanslı ve üretime hazır proxy sunucusu.**

Bu proje, Sourcegraph'ın güçlü yapay zeka yeteneklerini (Claude, Gemini, GPT serisi dahil 35'ten fazla model) standart OpenAI API formatı üzerinden kullanmanızı sağlar. Bu sayede mevcut OpenAI entegrasyonlarınızı ve kütüphanelerinizi hiçbir değişiklik yapmadan doğrudan Sourcegraph AI ile konuşturabilirsiniz.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Kurulum](#-kurulum)
- [Konfigürasyon](#-konfigürasyon)
- [Kullanım](#-kullanım)
- [API Endpoints](#-api-endpoints)
- [Geliştirme](#-geliştirme)
- [Docker](#-docker)
- [Desteklenen Modeller](#-desteklenen-modeller)
- [Lisans](#-lisans)

## ⚡ Özellikler

- **Tam OpenAI Uyumluluğu**: Mevcut OpenAI kütüphaneleri ve araçlarıyla (`gpt-4`, `claude-3-opus` vb. modelleri çağırarak) sorunsuz çalışır.
- **Geniş Model Desteği**: Anthropic, Google, OpenAI, Mistral ve daha fazlasından 35'ten fazla en güncel yapay zeka modeline erişim.
- **Akış Desteği (Streaming)**: Gerçek zamanlı ve kesintisiz yanıt akışı için tam `stream: true` desteği.
- **Üretime Hazır**: Hata yönetimi, performans optimizasyonları ve stabilite için TypeScript ile geliştirilmiştir.
- **Kurumsal Güvenlik**: İstek sınırlama (Rate Limiting), IP kara listesi ve API anahtarı ile kimlik doğrulama.
- **Performans**: Düşük gecikme süresi ve verimli kaynak kullanımı için optimize edilmiştir.

## 🚀 Kurulum

### Gereksinimler

- **Node.js**: `v18.0.0` veya üstü
- **npm**: `v8.0.0` veya üstü (veya `yarn`)

### Adımlar

1.  **Repository'yi Klonlayın:**

    ```bash
    git clone https://github.com/hermesthecat/sourcegraph2api.git
    cd sourcegraph2api
    ```

2.  **Bağımlılıkları Yükleyin:**

    ```bash
    npm install
    ```

3.  **Ortam Değişkenlerini Ayarlayın:**
    `.env.example` dosyasını kopyalayarak `.env` adında yeni bir dosya oluşturun ve içindeki değerleri kendinize göre düzenleyin.

    ```bash
    cp env.example .env
    ```

4.  **Sunucuyu Başlatın:**
    - **Geliştirme Modu (Otomatik Yenileme ile):**
      ```bash
      npm run dev
      ```
    - **Üretim Modu:**
      ```bash
      npm run build
      npm start
      ```

## ⚙️ Konfigürasyon

Sunucu, `.env` dosyasındaki ortam değişkenleri ile yapılandırılır.

| Değişken             | Açıklama                                                                                                   | Varsayılan   | Gerekli |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ------------ | ------- |
| `PORT`               | Sunucunun çalışacağı port.                                                                                 | `7033`       | ❌      |
| `NODE_ENV`           | Çalışma ortamı (`development` veya `production`).                                                          | `production` | ❌      |
| `DEBUG`              | Detaylı hata ayıklama loglarını aktif eder.                                                                | `false`      | ❌      |
| `SG_COOKIE`          | **Sourcegraph API**'sine erişim için kullanılacak kimlik bilgisi (cookie).                                 | -            | ✅      |
| `API_SECRET`         | Bu **proxy sunucusuna** erişimi korumak için kullanılacak API anahtarı/anahtarları (virgülle ayrılabilir). | -            | ✅      |
| `REQUEST_RATE_LIMIT` | Dakika başına izin verilen maksimum istek sayısı.                                                          | `60`         | ❌      |
| `ROUTE_PREFIX`       | Tüm API yollarının önüne eklenecek genel önek (örn: `/api`).                                               | -            | ❌      |
| `PROXY_URL`          | Sourcegraph'a yapılan istekler için kullanılacak HTTP/HTTPS proxy adresi.                                  | -            | ❌      |
| `IP_BLACK_LIST`      | Sunucuya erişimi engellenecek IP adresleri (virgülle ayrılmış).                                            | -            | ❌      |

### Örnek `.env` Dosyası

```env
# Sunucu Ayarları
PORT=7033
NODE_ENV=production
DEBUG=false

# ===== Gerekli Ayarlar =====
# Sourcegraph hesabınızdan alacağınız cookie
SG_COOKIE=sg_cookie_degeriniz_buraya

# Bu proxy'yi korumak için belirlediğiniz parola(lar)
# Birden fazla parola için: API_SECRET=key1,key2,key3
API_SECRET=super_guvenli_bir_parola

# ===== Opsiyonel Ayarlar =====
# İstek Limiti (dakikada)
REQUEST_RATE_LIMIT=100

# Rota Öneki
ROUTE_PREFIX=/v1

# Proxy
# PROXY_URL=http://user:pass@host:port

# Engelli IP'ler
# IP_BLACK_LIST=1.1.1.1,2.2.2.2
```

## 🎯 Kullanım

Sunucuyu başlattıktan sonra, standart OpenAI kütüphanelerini kullanarak istek yapabilirsiniz.

### OpenAI Kütüphanesi ile (Node.js/TypeScript)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:7033/v1", // ROUTE_PREFIX'i de ekleyin
  apiKey: "super_guvenli_bir_parola", // .env dosyasındaki API_SECRET değeriniz
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "claude-3-opus", // Desteklenen herhangi bir model
    messages: [
      {
        role: "user",
        content: "TypeScript ile ilgili 5 tane mülakat sorusu yazar mısın?",
      },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();
```

### cURL ile Test

```bash
curl http://localhost:7033/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer super_guvenli_bir_parola" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Merhaba!"}],
    "stream": false
  }'
```

## 📡 API Endpoints

Bu proxy, standart OpenAI API yollarını destekler:

- `POST /v1/chat/completions`: Chat tamamlama istekleri için ana endpoint. `stream: true` ve `stream: false` modlarını destekler.
- `GET /v1/models`: Desteklenen tüm modellerin listesini döndürür.

Ek olarak, sistem durumu için aşağıdaki endpoint mevcuttur:

- `GET /health`: Sunucunun çalışıp çalışmadığını kontrol etmek için basit sağlık kontrolü.

## 🐳 Docker

Projeyi Docker ile kolayca çalıştırabilirsiniz.

1.  **Docker imajını oluşturun:**

    ```bash
    # Projenin ana dizininde (sourcegraph2api/) çalıştırın
    docker build -t sourcegraph2api-nodejs -f nodejs/Dockerfile .
    ```

2.  **Container'ı çalıştırın:**
    `nodejs` klasöründeki `.env` dosyanızı kullanarak container'ı başlatın.
    ```bash
    docker run -p 7033:7033 --env-file nodejs/.env sourcegraph2api-nodejs
    ```

## 🤖 Desteklenen Modeller

Bu proxy, Sourcegraph tarafından desteklenen çok çeşitli modelleri OpenAI formatında sunar.

### Ana Modeller

| Marka                  | Popüler Modeller                                              |
| ---------------------- | ------------------------------------------------------------- |
| **Claude** (Anthropic) | `claude-3-opus`, `claude-3.5-sonnet-latest`, `claude-3-haiku` |
| **Gemini** (Google)    | `gemini-1.5-pro`, `gemini-2.0-flash`                          |
| **GPT** (OpenAI)       | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`                        |
| **Diğer**              | `mixtral-8x22b-instruct`, `deepseek-v3`                       |

### Tam Model Listesi

`claude-sonnet-4-latest`, `claude-sonnet-4-thinking-latest`, `claude-3-7-sonnet-latest`, `claude-3-7-sonnet-extended-thinking`, `claude-3-5-sonnet-latest`, `claude-3-opus`, `claude-3-5-haiku-latest`, `claude-3-haiku`, `claude-3.5-sonnet`, `claude-3-5-sonnet-20240620`, `claude-3-sonnet`, `claude-2.1`, `claude-2.0`, `deepseek-v3`, `gemini-1.5-pro`, `gemini-1.5-pro-002`, `gemini-2.0-flash-exp`, `gemini-2.0-flash`, `gemini-2.5-flash-preview-04-17`, `gemini-2.0-flash-lite`, `gemini-2.0-pro-exp-02-05`, `gemini-2.5-pro-preview-03-25`, `gemini-1.5-flash`, `gemini-1.5-flash-002`, `mixtral-8x7b-instruct`, `mixtral-8x22b-instruct`, `gpt-4o`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3-mini-medium`, `o3`, `o4-mini`, `o1`, `gpt-4-turbo`, `gpt-3.5-turbo`

## 🛠️ Geliştirme

### Proje Yapısı

```
nodejs/
├── src/
│   ├── config/          # Konfigürasyon, ortam değişkenleri ve model listesi
│   ├── controllers/     # Gelen HTTP isteklerini yöneten mantık
│   ├── middleware/      # Kimlik doğrulama, loglama gibi ara katman yazılımları
│   ├── routes/          # API yollarının (endpoints) tanımlandığı yer
│   ├── services/        # Ana iş mantığı (Sourcegraph istemcisi, cache vb.)
│   ├── types/           # TypeScript tip tanımlamaları
│   ├── utils/           # Yardımcı fonksiyonlar ve logger
│   ├── app.ts           # Express uygulamasının ana kurulumu
│   └── index.ts         # Uygulamanın giriş noktası
├── dist/                # Derlenmiş JavaScript dosyaları
├── package.json
├── tsconfig.json
└── .env.example
```

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

## 🔗 Bağlantılar

- **Original Go Version**: [Sourcegraph2API Go](https://github.com/hermesthecat/sourcegraph2api)
- **Documentation**: [API Docs](https://github.com/hermesthecat/sourcegraph2api/docs)
- **Issues**: [GitHub Issues](https://github.com/hermesthecat/sourcegraph2api/issues)

---

**Made with ❤️ by [hermesthecat](https://github.com/hermesthecat)**
