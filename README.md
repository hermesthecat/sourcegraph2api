<details>
<summary><strong>English Version 🇬🇧</strong></summary>

# Sourcegraph2API - Node.js

🚀 **A high-performance, production-ready proxy server to use Sourcegraph's AI API in the OpenAI API format.**

This project allows you to use Sourcegraph's powerful AI capabilities (including over 35 models like Claude, Gemini, and GPT series) through the standard OpenAI API format. This means you can connect your existing OpenAI integrations and libraries directly to Sourcegraph AI without any modifications.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Docker](#-docker)
- [Supported Models](#-supported-models)
- [Development](#-development)
- [License](#-license)

## ⚡ Features

- **Full OpenAI Compatibility**: Works seamlessly with existing OpenAI libraries and tools by calling models like `gpt-4`, `claude-3-opus`, etc.
- **Broad Model Support**: Access to over 35 of the latest AI models from Anthropic, Google, OpenAI, Mistral, and more.
- **Streaming Support**: Full `stream: true` support for real-time, uninterrupted response streaming.
- **Production-Ready**: Developed with TypeScript for robust error handling, performance optimization, and stability.
- **Enterprise Security**: Rate limiting, IP blacklisting, and API key authentication.
- **Performance**: Optimized for low latency and efficient resource usage.

## 🚀 Installation

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v8.0.0` or higher (or `yarn`)

### Steps

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/hermesthecat/sourcegraph2api.git
    cd sourcegraph2api/nodejs
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Set Up Environment Variables:**
    Create a new file named `.env` by copying `.env.example` and edit the values within it.

    ```bash
    cp env.example .env
    ```

4.  **Start the Server:**
    - **Development Mode (with auto-reload):**
      ```bash
      npm run dev
      ```
    - **Production Mode:**
      ```bash
      npm run build
      npm start
      ```

## ⚙️ Configuration

The server is configured via environment variables in the `.env` file.

| Variable             | Description                                                                              | Default      | Required |
| -------------------- | ---------------------------------------------------------------------------------------- | ------------ | -------- |
| `PORT`               | The port the server will run on.                                                         | `7033`       | ❌       |
| `NODE_ENV`           | The operating environment (`development` or `production`).                               | `production` | ❌       |
| `DEBUG`              | Enables detailed debug logging.                                                          | `false`      | ❌       |
| `SG_COOKIE`          | The credential (cookie) used to access the **Sourcegraph API**.                          | -            | ✅       |
| `API_SECRET`         | The API key(s) used to protect access to this **proxy server** (can be comma-separated). | -            | ✅       |
| `REQUEST_RATE_LIMIT` | The maximum number of requests allowed per minute.                                       | `60`         | ❌       |
| `ROUTE_PREFIX`       | A global prefix to be added to all API routes (e.g., `/api`).                            | -            | ❌       |
| `PROXY_URL`          | An HTTP/HTTPS proxy address to be used for requests to Sourcegraph.                      | -            | ❌       |
| `IP_BLACK_LIST`      | Comma-separated IP addresses to be blocked from accessing the server.                    | -            | ❌       |

### Example `.env` File

```env
# Server Settings
PORT=7033
NODE_ENV=production
DEBUG=false

# ===== Required Settings =====
# Your cookie from your Sourcegraph account
SG_COOKIE=your_sourcegraph_cookie_here

# Your password(s) to protect this proxy
# For multiple passwords: API_SECRET=key1,key2,key3
API_SECRET=a_super_secure_password

# ===== Optional Settings =====
# Request Limit (per minute)
REQUEST_RATE_LIMIT=100

# Route Prefix
ROUTE_PREFIX=/v1

# Proxy
# PROXY_URL=http://user:pass@host:port

# Blocked IPs
# IP_BLACK_LIST=1.1.1.1,2.2.2.2
```

## 🎯 Usage

Once the server is running, you can make requests using standard OpenAI libraries.

### With OpenAI Library (Node.js/TypeScript)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:7033/v1", // Also include your ROUTE_PREFIX
  apiKey: "a_super_secure_password", // Your API_SECRET value from .env
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "claude-3-opus", // Any supported model
    messages: [
      {
        role: "user",
        content: "Can you write 5 interview questions about TypeScript?",
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

### Test with cURL

```bash
curl http://localhost:7033/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a_super_secure_password" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

## 📡 API Endpoints

This proxy supports standard OpenAI API routes:

- `POST /v1/chat/completions`: The main endpoint for chat completion requests. Supports both `stream: true` and `stream: false` modes.
- `GET /v1/models`: Returns a list of all supported models.

Additionally, the following endpoint is available for system status:

- `GET /health`: A simple health check to see if the server is running.

## 🐳 Docker

You can easily run the project with Docker.

1.  **Build the Docker image:**

    ```bash
    # Build the image
    docker build -t sourcegraph2api-nodejs .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 7033:7033 --env-file .env sourcegraph2api-nodejs
    ```

## 🤖 Supported Models

This proxy provides a wide variety of models supported by Sourcegraph in the OpenAI format.

### Main Models

| Brand                  | Popular Models                                                |
| ---------------------- | ------------------------------------------------------------- |
| **Claude** (Anthropic) | `claude-3-opus`, `claude-3.5-sonnet-latest`, `claude-3-haiku` |
| **Gemini** (Google)    | `gemini-1.5-pro`, `gemini-2.0-flash`                          |
| **GPT** (OpenAI)       | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`                        |
| **Other**              | `mixtral-8x22b-instruct`, `deepseek-v3`                       |

### Full Model List

`claude-sonnet-4-latest`, `claude-sonnet-4-thinking-latest`, `claude-3-7-sonnet-latest`, `claude-3-7-sonnet-extended-thinking`, `claude-3-5-sonnet-latest`, `claude-3-opus`, `claude-3-5-haiku-latest`, `claude-3-haiku`, `claude-3.5-sonnet`, `claude-3-5-sonnet-20240620`, `claude-3-sonnet`, `claude-2.1`, `claude-2.0`, `deepseek-v3`, `gemini-1.5-pro`, `gemini-1.5-pro-002`, `gemini-2.0-flash-exp`, `gemini-2.0-flash`, `gemini-2.5-flash-preview-04-17`, `gemini-2.0-flash-lite`, `gemini-2.0-pro-exp-02-05`, `gemini-2.5-pro-preview-03-25`, `gemini-1.5-flash`, `gemini-1.5-flash-002`, `mixtral-8x7b-instruct`, `mixtral-8x22b-instruct`, `gpt-4o`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3-mini-medium`, `o3`, `o4-mini`, `o1`, `gpt-4-turbo`, `gpt-3.5-turbo`

## 🛠️ Development

### Project Structure

```
nodejs/
├── src/
│   ├── config/          # Configuration, environment variables, and model list
│   ├── controllers/     # Logic for handling incoming HTTP requests
│   ├── middleware/      # Middleware for authentication, logging, etc.
│   ├── routes/          # Where API routes (endpoints) are defined
│   ├── services/        # Core business logic (Sourcegraph client, cache, etc.)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions and logger
│   ├── app.ts           # Main setup for the Express application
│   └── index.ts         # The application's entry point
├── dist/                # Compiled JavaScript files
├── package.json
├── tsconfig.json
└── .env.example
```

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

</details>

---

# Sourcegraph2API - Node.js

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
    cd sourcegraph2api/nodejs
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

    # İmajı oluşturun
    docker build -t sourcegraph2api-nodejs .
    ```

2.  **Container'ı çalıştırın:**
    ```bash
    docker run -p 7033:7033 --env-file .env sourcegraph2api-nodejs
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

- **Documentation**: [API Docs](https://github.com/hermesthecat/sourcegraph2api/docs)
- **Issues**: [GitHub Issues](https://github.com/hermesthecat/sourcegraph2api/issues)

---

**Made with ❤️ by [hermesthecat](https://github.com/hermesthecat)**
