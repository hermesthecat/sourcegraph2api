<details>
<summary><strong>English Version 🇬🇧</strong></summary>

# Sourcegraph2API - Node.js

🚀 **A high-performance, production-ready proxy server to use Sourcegraph's AI API in the OpenAI API format, complete with a full-featured Admin Panel.**

This project allows you to use Sourcegraph's powerful AI capabilities (including over 35 models like Claude, Gemini, and GPT series) through the standard OpenAI API format. It comes with a built-in admin panel to manage API keys, cookies, users, and monitor usage statistics.

## 📋 Table of Contents

- [Features](#-features)
- [Admin Panel](#-admin-panel)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Docker](#-docker)
- [Supported Models](#-supported-models)
- [Development](#-development)
- [License](#-license)

## ⚡ Features

- **Full OpenAI Compatibility**: Works seamlessly with existing OpenAI libraries and tools.
- **Built-in Admin Panel**: A comprehensive web interface to manage the entire proxy.
- **Dynamic Cookie & API Key Pools**: Manage multiple Sourcegraph cookies and generate API keys for your users, all from the UI.
- **Usage Statistics & Metrics**: Detailed dashboard with charts for requests, errors, and model usage.
- **Broad Model Support**: Access to over 35 of the latest AI models from Anthropic, Google, OpenAI, etc.
- **Streaming Support**: Full `stream: true` support for real-time responses.
- **Enterprise Security**: Rate limiting, IP blacklisting, and a robust user/API key authentication system.
- **Production-Ready**: Developed with TypeScript for stability and performance.

## 👑 Admin Panel

This project includes a powerful admin panel to manage and monitor your proxy server.

**How to Access:**

1. Start the server.
2. Open your browser and go to `http://localhost:7033/login`.
3. Log in with the default credentials:
    - **Username:** `admin`
    - **Password:** `admin`

**(Security Note: It is highly recommended to change the default admin password immediately after your first login.)**

**Panel Features:**

- **Dashboard**: View real-time statistics, including total requests, error rates, and usage charts for models, cookies, and API keys.
- **Cookie Management**: Add, delete, and toggle multiple Sourcegraph cookies to create a resilient request pool.
- **API Key Management**: Create, delete, and manage API keys for your users.
- **User Management**: Add or remove admin users who can access the panel.
- **Usage Metrics**: Browse through a detailed, paginated log of all API requests.

## 🚀 Installation

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v8.0.0` or higher (or `yarn`)

### Steps

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/hermesthecat/sourcegraph2api.git
    cd sourcegraph2api/nodejs
    ```

2. **Install Dependencies:**

    ```bash
    npm install
    ```

3. **Set Up Environment Variables:**
    Create a new file named `.env` by copying `env.example` and edit the values within it. **It is crucial to set a secure `SESSION_SECRET`**.

    ```bash
    cp env.example .env
    ```

4. **Start the Server:**
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

The application's configuration is managed in two ways:

1. **`.env` File (Startup Settings)**: These are core settings required to boot the server. They are only read once when the server starts.
2. **Admin Panel (Dynamic Settings)**: All other settings are managed dynamically from the **Admin Panel → Settings** page. These settings are stored in the database and can be changed on-the-fly without restarting the server.

### `.env` File Settings

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the server will run on. | `7033` |
| `HOST` | The host address the server will bind to. | `0.0.0.0` |
| `NODE_ENV` | The operating environment (`development` or `production`). | `production` |
| `DEBUG` | Enables detailed debug logging (`true` or `false`). | `false` |

### Admin Panel Settings

The following settings can be configured from the UI:

- **Session Secret**: A secret key for securing user sessions.
- **Request Rate Limit**: Max requests per minute per IP.
- **Route Prefix**: A global prefix for all API routes.
- **Proxy URL**: An HTTP/HTTPS proxy for outbound requests.
- **IP Blacklist**: Comma-separated IPs to block.
- **Log Level**: The verbosity of application logs (`info`, `debug`, etc.).

## 🎯 Usage

Once the server is running, first **create an API key in the [Admin Panel](#-admin-panel)**. Then, use that key to make requests with standard OpenAI libraries.

### With OpenAI Library (Node.js/TypeScript)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:7033/v1", // If you set a ROUTE_PREFIX, include it here
  apiKey: "s2a-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // Your API key generated from the admin panel
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
# Replace with your API key from the admin panel
API_KEY="s2a-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

curl http://localhost:7033/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

## 📡 API Endpoints

- `POST /v1/chat/completions`: The main endpoint for chat completion requests.
- `GET /v1/models`: Returns a list of all supported models.
- `GET /health`: A simple health check.
- `GET /login`: The login page for the admin panel.
- `GET /admin/dashboard`: The main dashboard for the admin panel.

## 🐳 Docker

1. **Build the Docker image:**

    ```bash
    docker build -t sourcegraph2api-nodejs .
    ```

2. **Run the container:**
    Make sure your `.env` file is created and configured.

    ```bash
    docker run -p 7033:7033 --env-file .env sourcegraph2api-nodejs
    ```

## 🤖 Supported Models

This proxy provides a wide variety of models supported by Sourcegraph in the OpenAI format.

### Main Models

| Brand | Popular Models |
| :--- | :--- |
| **Claude** (Anthropic) | `claude-3-opus`, `claude-3.5-sonnet-latest`, `claude-3-haiku` |
| **Gemini** (Google) | `gemini-1.5-pro`, `gemini-2.0-flash` |
| **GPT** (OpenAI) | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| **Other** | `mixtral-8x22b-instruct`, `deepseek-v3` |

### Full Model List

`claude-sonnet-4-latest`, `claude-sonnet-4-thinking-latest`, `claude-3-7-sonnet-latest`, `claude-3-7-sonnet-extended-thinking`, `claude-3-5-sonnet-latest`, `claude-3-opus`, `claude-3-5-haiku-latest`, `claude-3-haiku`, `claude-3.5-sonnet`, `claude-3-5-sonnet-20240620`, `claude-3-sonnet`, `claude-2.1`, `claude-2.0`, `deepseek-v3`, `gemini-1.5-pro`, `gemini-1.5-pro-002`, `gemini-2.0-flash-exp`, `gemini-2.0-flash`, `gemini-2.5-flash-preview-04-17`, `gemini-2.0-flash-lite`, `gemini-2.0-pro-exp-02-05`, `gemini-2.5-pro-preview-03-25`, `gemini-1.5-flash`, `gemini-1.5-flash-002`, `mixtral-8x7b-instruct`, `mixtral-8x22b-instruct`, `gpt-4o`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3-mini-medium`, `o3`, `o4-mini`, `o1`, `gpt-4-turbo`, `gpt-3.5-turbo`

## 🛠️ Development

### Project Structure

```bash
nodejs/
├── src/
│   ├── config/          # Configuration, environment variables, and model list
│   ├── controllers/     # Logic for handling incoming HTTP requests
│   ├── middleware/      # Middleware for authentication, logging, etc.
│   ├── models/          # Sequelize database models and relationships
│   ├── routes/          # API and web routes (endpoints)
│   ├── services/        # Core business logic (DB, Sourcegraph client, etc.)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions and logger
│   ├── app.ts           # Main setup for the Express application
│   └── index.ts         # The application's entry point
├── views/               # EJS templates for the Admin Panel
├── public/              # Static files (CSS, JS) for the Admin Panel
├── database.sqlite      # SQLite database file
├── package.json
└── .env.example
```

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

</details>

---

# Sourcegraph2API - Node.js

🚀 **Sourcegraph AI API'sini OpenAI API formatına dönüştüren, tam özellikli bir Yönetim Paneli ile birlikte gelen, yüksek performanslı ve üretime hazır proxy sunucusu.**

Bu proje, Sourcegraph'ın güçlü yapay zeka yeteneklerini (Claude, Gemini, GPT serisi dahil 35'ten fazla model) standart OpenAI API formatı üzerinden kullanmanızı sağlar. API anahtarlarını, cookie'leri, kullanıcıları yönetmek ve kullanım istatistiklerini izlemek için dahili bir yönetim paneli ile birlikte gelir.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Yönetim Paneli](#-yönetim-paneli)
- [Kurulum](#-kurulum)
- [Konfigürasyon](#-konfigürasyon)
- [Kullanım](#-kullanım)
- [API Endpoints](#-api-endpoints)
- [Docker](#-docker)
- [Desteklenen Modeller](#-desteklenen-modeller)
- [Geliştirme](#-geliştirme)
- [Lisans](#-lisans)

## ⚡ Özellikler

- **Tam OpenAI Uyumluluğu**: Mevcut OpenAI kütüphaneleri ve araçlarıyla sorunsuz çalışır.
- **Dahili Yönetim Paneli**: Tüm proxy sunucusunu yönetmek için kapsamlı bir web arayüzü.
- **Dinamik Cookie ve API Anahtarı Havuzları**: UI üzerinden birden fazla Sourcegraph cookie'sini ve kullanıcılarınız için API anahtarlarını yönetin.
- **Kullanım İstatistikleri ve Metrikler**: İstekler, hatalar ve model kullanımı için grafikler içeren ayrıntılı bir dashboard.
- **Geniş Model Desteği**: Anthropic, Google, OpenAI vb. 35'ten fazla en güncel yapay zeka modeline erişim.
- **Akış Desteği (Streaming)**: Gerçek zamanlı yanıtlar için tam `stream: true` desteği.
- **Kurumsal Güvenlik**: İstek sınırlama, IP kara listesi ve sağlam bir kullanıcı/API anahtarı kimlik doğrulama sistemi.
- **Üretime Hazır**: Stabilite ve performans için TypeScript ile geliştirilmiştir.

## 👑 Yönetim Paneli

Bu proje, proxy sunucunuzu yönetmek ve izlemek için güçlü bir yönetim paneli içerir.

**Nasıl Erişilir:**

1. Sunucuyu başlatın.
2. Tarayıcınızı açın ve `http://localhost:7033/login` adresine gidin.
3. Varsayılan kimlik bilgileriyle giriş yapın:
    - **Kullanıcı Adı:** `admin`
    - **Parola:** `admin`

**(Güvenlik Notu: İlk girişinizden hemen sonra varsayılan yönetici şifresini değiştirmeniz önemle tavsiye edilir.)**

**Panel Özellikleri:**

- **Dashboard**: Toplam istekler, hata oranları ve modeller, cookie'ler ve API anahtarları için kullanım grafikleri gibi gerçek zamanlı istatistikleri görüntüleyin.
- **Cookie Yönetimi**: Dayanıklı bir istek havuzu oluşturmak için birden fazla Sourcegraph cookie'si ekleyin, silin ve durumlarını değiştirin.
- **API Anahtarı Yönetimi**: Kullanıcılarınız için API anahtarları oluşturun, silin ve yönetin.
- **Kullanıcı Yönetimi**: Panele erişebilen yönetici kullanıcıları ekleyin veya kaldırın.
- **Kullanım Metrikleri**: Tüm API isteklerinin ayrıntılı, sayfalanmış bir günlüğüne göz atın.

## 🚀 Kurulum

### Gereksinimler

- **Node.js**: `v18.0.0` veya üstü
- **npm**: `v8.0.0` veya üstü (veya `yarn`)

### Adımlar

1. **Repository'yi Klonlayın:**

    ```bash
    git clone https://github.com/hermesthecat/sourcegraph2api.git
    cd sourcegraph2api/nodejs
    ```

2. **Bağımlılıkları Yükleyin:**

    ```bash
    npm install
    ```

3. **Ortam Değişkenlerini Ayarlayın:**
    `.env.example` dosyasını kopyalayarak `.env` adında yeni bir dosya oluşturun ve içindeki değerleri düzenleyin. **Güvenli bir `SESSION_SECRET` ayarlamak kritik öneme sahiptir.**

    ```bash
    cp env.example .env
    ```

4. **Sunucuyu Başlatın:**
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

Uygulama konfigürasyonu iki şekilde yönetilir:

1. **`.env` Dosyası (Başlangıç Ayarları)**: Bunlar, sunucuyu başlatmak için gereken temel ayarlardır. Yalnızca sunucu başlarken bir kez okunurlar.
2. **Yönetim Paneli (Dinamik Ayarlar)**: Diğer tüm ayarlar, **Yönetim Paneli → Ayarlar** sayfasından dinamik olarak yönetilir. Bu ayarlar veritabanında saklanır ve sunucuyu yeniden başlatmadan anında değiştirilebilir.

### `.env` Dosyası Ayarları

| Değişken | Açıklama | Varsayılan |
| :--- | :--- | :--- |
| `PORT` | Sunucunun çalışacağı port. | `7033` |
| `HOST` | Sunucunun bağlanacağı IP adresi. | `0.0.0.0` |
| `NODE_ENV` | Çalışma ortamı (`development` veya `production`). | `production` |
| `DEBUG` | Detaylı hata ayıklama loglarını aktif eder (`true` veya `false`). | `false` |

### Yönetim Paneli Ayarları

Aşağıdaki ayarlar kullanıcı arayüzünden yapılandırılabilir:

- **Oturum Gizli Anahtarı**: Kullanıcı oturumlarını güvence altına almak için gizli bir anahtar.
- **İstek Limiti**: IP başına dakika başına maksimum istek sayısı.
- **Rota Ön Eki**: Tüm API yolları için genel bir ön ek.
- **Proxy Adresi**: Giden istekler için bir HTTP/HTTPS proxy'si.
- **IP Kara Listesi**: Engellenecek, virgülle ayrılmış IP'ler.
- **Log Seviyesi**: Uygulama loglarının ayrıntı düzeyi (`info`, `debug` vb.).

## 🎯 Kullanım

Sunucu çalıştıktan sonra, önce **[Yönetim Paneli](#-yönetim-paneli)'nden bir API anahtarı oluşturun**. Ardından, bu anahtarı standart OpenAI kütüphaneleri ile istek yapmak için kullanın.

### OpenAI Kütüphanesi ile (Node.js/TypeScript)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:7033/v1", // Bir ROUTE_PREFIX ayarladıysanız, buraya ekleyin
  apiKey: "s2a-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // Yönetim panelinden oluşturduğunuz API anahtarınız
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
# Yönetim panelinden aldığınız API anahtarınızla değiştirin
API_KEY="s2a-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

curl http://localhost:7033/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Merhaba!"}],
    "stream": false
  }'
```

## 📡 API Endpoints

- `POST /v1/chat/completions`: Chat tamamlama istekleri için ana endpoint.
- `GET /v1/models`: Desteklenen tüm modellerin listesini döndürür.
- `GET /health`: Basit sağlık kontrolü.
- `GET /login`: Yönetim paneli için giriş sayfası.
- `GET /admin/dashboard`: Yönetim panelinin ana dashboard'u.

## 🐳 Docker

1. **Docker imajını oluşturun:**

    ```bash
    docker build -t sourcegraph2api-nodejs .
    ```

2. **Container'ı çalıştırın:**
    `.env` dosyanızın oluşturulduğundan ve yapılandırıldığından emin olun.

    ```bash
    docker run -p 7033:7033 --env-file .env sourcegraph2api-nodejs
    ```

## 🤖 Desteklenen Modeller

Bu proxy, Sourcegraph tarafından desteklenen çok çeşitli modelleri OpenAI formatında sunar.

### Ana Modeller

| Marka | Popüler Modeller |
| :--- | :--- |
| **Claude** (Anthropic) | `claude-3-opus`, `claude-3.5-sonnet-latest`, `claude-3-haiku` |
| **Gemini** (Google) | `gemini-1.5-pro`, `gemini-2.0-flash` |
| **GPT** (OpenAI) | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| **Diğer** | `mixtral-8x22b-instruct`, `deepseek-v3` |

### Tam Model Listesi

`claude-sonnet-4-latest`, `claude-sonnet-4-thinking-latest`, `claude-3-7-sonnet-latest`, `claude-3-7-sonnet-extended-thinking`, `claude-3-5-sonnet-latest`, `claude-3-opus`, `claude-3-5-haiku-latest`, `claude-3-haiku`, `claude-3.5-sonnet`, `claude-3-5-sonnet-20240620`, `claude-3-sonnet`, `claude-2.1`, `claude-2.0`, `deepseek-v3`, `gemini-1.5-pro`, `gemini-1.5-pro-002`, `gemini-2.0-flash-exp`, `gemini-2.0-flash`, `gemini-2.5-flash-preview-04-17`, `gemini-2.0-flash-lite`, `gemini-2.0-pro-exp-02-05`, `gemini-2.5-pro-preview-03-25`, `gemini-1.5-flash`, `gemini-1.5-flash-002`, `mixtral-8x7b-instruct`, `mixtral-8x22b-instruct`, `gpt-4o`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3-mini-medium`, `o3`, `o4-mini`, `o1`, `gpt-4-turbo`, `gpt-3.5-turbo`

## 🛠️ Geliştirme

### Proje Yapısı

```bash
nodejs/
├── src/
│   ├── config/          # Konfigürasyon, ortam değişkenleri ve model listesi
│   ├── controllers/     # Gelen HTTP isteklerini yöneten mantık
│   ├── middleware/      # Kimlik doğrulama, loglama gibi ara katman yazılımları
│   ├── models/          # Sequelize veritabanı modelleri ve ilişkileri
│   ├── routes/          # API ve web yolları (endpoints)
│   ├── services/        # Ana iş mantığı (VT, Sourcegraph istemcisi vb.)
│   ├── types/           # TypeScript tip tanımlamaları
│   ├── utils/           # Yardımcı fonksiyonlar ve logger
│   ├── app.ts           # Express uygulamasının ana kurulumu
│   └── index.ts         # Uygulamanın giriş noktası
├── views/               # Yönetim Paneli için EJS şablonları
├── public/              # Yönetim Paneli için statik dosyalar (CSS, JS)
├── database.sqlite      # SQLite veritabanı dosyası
├── package.json
└── .env.example
```

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.
