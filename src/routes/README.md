# Routes - API Routing Sistemi

Bu klasör, Node.js uygulamasının tüm API endpoint'lerini organize eder.

## 📁 Dosya Yapısı

```
routes/
├── index.ts          # Ana export dosyası
├── main.ts          # Ana routing konfigürasyonu
├── chat.ts          # Chat completion routes (basitleştirilmiş)
├── models.ts        # Models API routes (basitleştirilmiş)
├── health.ts        # Health check routes (basitleştirilmiş)
├── metrics.ts       # Metrics ve analytics routes (basitleştirilmiş)
└── README.md        # Bu dosya
```

## 🛤️ API Endpoints

### Public Endpoints
- `GET /` - API bilgileri ve endpoint listesi
- `GET /health` - Basit sağlık kontrolü
- `GET /health/detailed` - Detaylı sağlık kontrolü

### OpenAI Uyumlu Endpoints (Authentication Required)
- `POST /v1/chat/completions` - Chat completion API
- `GET /v1/models` - Desteklenen modeller listesi
- `GET /v1/models/{model}` - Spesifik model bilgisi

### Metrics Endpoints
- `GET /metrics` - Temel performans metrikleri
- `GET /metrics/dashboard` - Detaylı metrics dashboard
- `GET /metrics/health` - Service health durumu
- `POST /metrics/reset` - Metrics sıfırlama (admin)

## 🔧 Route Konfigürasyonu

### Main Routes (`main.ts`)
Ana routing sistemi burada tanımlanır:
- Root endpoints
- Health endpoints (rate limit exempt)
- V1 API router
- Metrics endpoints
- Route prefix işleme

### Route Prefix Desteği
Uygulamada `ROUTE_PREFIX` environment variable ile custom prefix tanımlanabilir:
```bash
ROUTE_PREFIX=/api/v2  # /api/v2/v1/chat/completions
```

### Middleware Entegrasyonu
Routes şu middleware'lerle entegre çalışır:
- **Authentication**: `openaiAuth()` - Bearer token kontrolü
- **Rate Limiting**: Otomatik olarak uygulanır (health hariç)
- **Request Logging**: Tüm request'ler loglanır
- **Error Handling**: Centralized error handling

## 📊 Analytics ve Metrics

Routing sistemine entegre analytics:
- Request counting
- Response time tracking
- Error rate monitoring
- Model usage statistics

## 🚀 Kullanım

Express app'e routing sistemi ekleme:
```typescript
import { setupRoutes } from './routes';

const app = express();
setupRoutes(app);
```

Veya manuel router kullanımı:
```typescript
import { createApiRouter } from './routes';

const app = express();
const apiRouter = createApiRouter();
app.use('/', apiRouter);
```

## ⚡ Özellikler

- **Type Safety**: Full TypeScript desteği
- **Modular Structure**: Her endpoint grubu ayrı dosyada
- **Middleware Integration**: Auth, rate limiting, logging
- **Error Handling**: Centralized error management
- **Documentation**: Swagger/OpenAPI desteği
- **Metrics**: Built-in analytics ve monitoring

## 🔐 Güvenlik

- Bearer token authentication
- Rate limiting (60 req/min default)
- IP blacklist desteği
- Input validation
- CORS ve helmet security headers 