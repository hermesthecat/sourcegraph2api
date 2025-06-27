# Sourcegraph2API - Node.js Version

🚀 **Sourcegraph AI API'sini OpenAI API formatında kullanmanızı sağlayan proxy server - Node.js/TypeScript implementasyonu**

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Kurulum](#-kurulum)
- [Konfigürasyon](#-konfigürasyon)
- [Kullanım](#-kullanım)
- [API Endpoints](#-api-endpoints)
- [Geliştirme](#-geliştirme)
- [Docker](#-docker)
- [Desteklenen Modeller](#-desteklenen-modeller)

## ⚡ Özellikler

### 🎯 Ana Özellikler
- **OpenAI API Uyumluluğu**: Mevcut OpenAI entegrasyonlarınızla çalışır
- **34+ AI Model Desteği**: Claude, Gemini, GPT, DeepSeek, Mixtral serisi
- **Streaming Support**: Real-time response streaming
- **Production Ready**: Full TypeScript, comprehensive error handling
- **Enterprise Security**: Rate limiting, IP blacklist, authentication

### 🛡️ Güvenlik & Performance
- **Rate Limiting**: Configurable request limiting (default: 60/min)
- **Cookie Pool Management**: Automatic cookie rotation
- **Request Analytics**: Built-in metrics and monitoring
- **Error Resilience**: Retry logic with exponential backoff
- **Memory Management**: Efficient caching and cleanup

### 📊 Monitoring & Analytics
- **Real-time Metrics**: Request counts, response times, error rates
- **Model Usage Stats**: Per-model usage analytics
- **Health Monitoring**: System health and service status
- **Performance Dashboard**: `/metrics/dashboard` endpoint

## 🚀 Kurulum

### Gereksinimler
- **Node.js**: ≥ 18.0.0
- **npm**: ≥ 8.0.0 veya **yarn**
- **TypeScript**: ≥ 5.0.0

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/hermesthecat/sourcegraph2api.git
cd sourcegraph2api/nodejs
```

### 2. Dependencies'leri Kurun
```bash
npm install
# veya
yarn install
```

### 3. Environment Konfigürasyonu
```bash
cp env.example .env
# .env dosyasını düzenleyin
```

### 4. Server'ı Başlatın
```bash
# Development mode
npm run dev

# Production build
npm run start:prod

# Production mode (compiled)
npm run build
npm start
```

## ⚙️ Konfigürasyon

### Environment Variables

| Variable | Açıklama | Default | Gerekli |
|----------|----------|---------|---------|
| `PORT` | Server port | `7033` | ❌ |
| `NODE_ENV` | Environment | `production` | ❌ |
| `SG_COOKIE` | Sourcegraph cookie | - | ✅ |
| `API_SECRET` | API authentication secret | - | ✅ |
| `PROXY_URL` | Proxy server URL | - | ❌ |
| `REQUEST_RATE_LIMIT` | Requests per minute | `60` | ❌ |
| `ROUTE_PREFIX` | API route prefix | - | ❌ |
| `IP_BLACK_LIST` | Comma-separated blocked IPs | - | ❌ |
| `DEBUG` | Debug logging | `false` | ❌ |

### Örnek .env Dosyası
```env
# Server Configuration
PORT=7033
NODE_ENV=production
DEBUG=false

# Sourcegraph Integration
SG_COOKIE=your_sourcegraph_cookie_here

# Security
API_SECRET=your_secret_key
IP_BLACK_LIST=192.168.1.100,10.0.0.50

# Performance
REQUEST_RATE_LIMIT=60
ROUTE_PREFIX=/api

# Network (optional)
PROXY_URL=http://proxy.example.com:8080
```

## 🎯 Kullanım

### OpenAI Client ile Kullanım

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:7033/v1',
  apiKey: 'your_api_secret'
});

const response = await client.chat.completions.create({
  model: 'claude-3-5-sonnet-latest',
  messages: [
    { role: 'user', content: 'Merhaba! Nasılsın?' }
  ],
  stream: true
});
```

### cURL ile Test
```bash
curl -X POST "http://localhost:7033/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_secret" \
  -d '{
    "model": "claude-3-5-sonnet-latest",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

## 📡 API Endpoints

### OpenAI Uyumlu Endpoints
- `POST /v1/chat/completions` - Chat completion (streaming/non-streaming)
- `GET /v1/models` - Desteklenen modeller listesi
- `GET /v1/models/{model}` - Spesifik model bilgisi

### System Endpoints
- `GET /` - API bilgileri ve durum
- `GET /health` - Basit sağlık kontrolü
- `GET /health/detailed` - Detaylı sistem durumu

### Metrics & Monitoring
- `GET /metrics` - Temel performans metrikleri
- `GET /metrics/dashboard` - Detaylı analytics dashboard
- `GET /metrics/health` - Service health summary

## 🛠️ Geliştirme

### Project Structure
```
nodejs/
├── src/
│   ├── config/          # Konfigürasyon ve model registry
│   ├── controllers/     # HTTP request handlers
│   ├── middleware/      # Express middleware stack
│   ├── routes/          # API routing system
│   ├── services/        # Business logic (Sourcegraph, cache, analytics)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper utilities ve logger
│   ├── app.ts           # Express app configuration
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript (auto-generated)
├── package.json
├── tsconfig.json
└── env.example
```

### Development Commands
```bash
# Development mode (auto-reload)
npm run dev

# Build project
npm run build

# Type checking
npx tsc --noEmit

# Linting
npm run lint
npm run lint:fix

# Testing
npm test

# Code formatting
npm run format
```

### TypeScript Configuration
Proje strict TypeScript ayarlarıyla yapılandırılmıştır:
- Strict null checks
- No implicit any
- Unused locals detection
- Full type safety

## 🐳 Docker

### Docker Build
```bash
# Dockerfile oluşturun (multi-stage build)
docker build -t sourcegraph2api-nodejs .

# Container çalıştırın
docker run -p 7033:7033 --env-file .env sourcegraph2api-nodejs
```

### Docker Compose (Önerilen)
```yaml
version: '3.8'
services:
  sourcegraph2api:
    build: ./nodejs
    ports:
      - "7033:7033"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7033/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🤖 Desteklenen Modeller

### Claude Serisi (Anthropic)
- `claude-sonnet-4-latest` - En yeni Claude model
- `claude-3-5-sonnet-latest` - Claude 3.5 Sonnet 
- `claude-3-opus` - Claude 3 Opus
- `claude-3-haiku` - Claude 3 Haiku

### Gemini Serisi (Google)
- `gemini-2.0-flash` - Gemini 2.0 Flash
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash

### GPT Serisi (OpenAI)
- `gpt-4o` - GPT-4 Omni
- `gpt-4o-mini` - GPT-4 Omni Mini
- `o3-mini-medium` - O3 Mini Medium

### Diğer Modeller
- `deepseek-v3` - DeepSeek v3
- `mixtral-8x7b-instruct` - Mixtral 8x7B
- `mixtral-8x22b-instruct` - Mixtral 8x22B

**Toplam: 34+ model desteklenmektedir.**

## 📈 Performance & Monitoring

### Metrics Dashboard
Visit `http://localhost:7033/metrics/dashboard` for:
- Request/response statistics
- Model usage analytics
- Error rates and types
- System performance metrics
- Cache statistics

### Logging
Comprehensive logging with:
- Request/response tracking
- Error logging with stack traces
- Performance monitoring
- Debug information (in debug mode)

### Health Monitoring
- `/health` - Quick health check
- `/health/detailed` - Comprehensive system status
- Built-in uptime monitoring

## 🤝 Katkıda Bulunma

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](../LICENSE) dosyasına bakın.

## 🔗 Bağlantılar

- **Original Go Version**: [Sourcegraph2API Go](https://github.com/hermesthecat/sourcegraph2api)
- **Documentation**: [API Docs](https://github.com/hermesthecat/sourcegraph2api/docs)
- **Issues**: [GitHub Issues](https://github.com/hermesthecat/sourcegraph2api/issues)

---

**Made with ❤️ by [hermesthecat](https://github.com/hermesthecat)** 