/**
 * Sourcegraph API Service
 * Sourcegraph API ile iletişimi sağlar
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { log } from '../utils/logger';
import { OpenAIChatCompletionRequest, OpenAIChatMessage } from '../types';
import { 
  delay, 
  calculateBackoff, 
  safeJsonParse, 
  sanitizeString, 
  messagesToText,
  extractStatusCode,
  isValidCookie,
  truncateText
} from '../utils/helpers';

// Sourcegraph API sabitleri
const SOURCEGRAPH_BASE_URL = 'https://sourcegraph.com';
const CHAT_ENDPOINT = `${SOURCEGRAPH_BASE_URL}/.api/completions/stream?api-version=9&client-name=vscode&client-version=1.82.0`;

/**
 * Traceparent header oluştur (dağıtık izleme için)
 */
function generateTraceParent(): string {
  const version = '00';
  const traceId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const spanId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const flags = '01';
  return `${version}-${traceId}-${spanId}-${flags}`;
}

/**
 * OpenAI formatını Sourcegraph formatına çevir (Go createRequestBody ile uyumlu)
 */
function convertToSourcegraphFormat(request: OpenAIChatCompletionRequest, modelRef: string) {
  // Go versiyonu ile aynı format: messages array ile speaker/text structure
  const messages = request.messages.map((message: OpenAIChatMessage) => {
    let speaker: string = message.role;
    
    // Go'da user -> human dönüşümü var
    if (message.role === 'user') {
      speaker = 'human';
    }
    
    return {
      speaker: speaker,
      text: typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
    };
  });

  return {
    model: modelRef,
    messages: messages,
    maxTokensToSample: request.max_tokens || 4000,
    temperature: request.temperature || 0.7,
    topP: -1,
    topK: -1
  };
}

/**
 * Cookie Manager Class
 */
export class CookieManager {
  private cookies: string[] = [];
  private currentIndex: number = 0;
  private rateLimitedCookies: Map<string, Date> = new Map();

  constructor() {
    this.initializeCookies();
  }

  private initializeCookies() {
    if (config.sgCookie) {
      this.cookies = config.sgCookie
        .split(',')
        .map(cookie => cookie.trim())
        .filter(cookie => cookie.length > 0);
    }
  }

  /**
   * Rate limit kontrolü
   */
  private isRateLimited(cookie: string): boolean {
    const limitTime = this.rateLimitedCookies.get(cookie);
    if (!limitTime) return false;
    
    if (new Date() > limitTime) {
      this.rateLimitedCookies.delete(cookie);
      return false;
    }
    return true;
  }

  /**
   * Rastgele cookie al
   */
  getRandomCookie(): string {
    const availableCookies = this.cookies.filter(cookie => !this.isRateLimited(cookie));
    
    if (availableCookies.length === 0) {
      throw new Error('No available cookies - all are rate limited');
    }
    
    const randomIndex = Math.floor(Math.random() * availableCookies.length);
    return availableCookies[randomIndex];
  }

  /**
   * Sonraki cookie'yi al
   */
  getNextCookie(): string {
    const availableCookies = this.cookies.filter(cookie => !this.isRateLimited(cookie));
    
    if (availableCookies.length === 0) {
      throw new Error('No available cookies - all are rate limited');
    }
    
    const cookie = availableCookies[this.currentIndex % availableCookies.length];
    this.currentIndex++;
    return cookie;
  }

  /**
   * Cookie'yi rate limit listesine ekle
   */
  addRateLimitCookie(cookie: string, duration: number = 60): void {
    const expirationTime = new Date(Date.now() + duration * 1000);
    this.rateLimitedCookies.set(cookie, expirationTime);
    log.warn(`Cookie rate limited for ${duration}s: ${cookie.substring(0, 10)}...`);
  }

  /**
   * Cookie'yi tamamen kaldır
   */
  removeCookie(cookie: string): void {
    this.cookies = this.cookies.filter(c => c !== cookie);
    this.rateLimitedCookies.delete(cookie);
    log.warn(`Cookie removed: ${cookie.substring(0, 10)}...`);
  }

  /**
   * Mevcut cookie sayısı
   */
  getAvailableCookieCount(): number {
    return this.cookies.filter(cookie => !this.isRateLimited(cookie)).length;
  }
}

/**
 * Sourcegraph API Client
 */
export class SourcegraphClient {
  private httpClient: AxiosInstance;
  private cookieManager: CookieManager;

  constructor() {
    this.cookieManager = new CookieManager();
    
    this.httpClient = axios.create({
      timeout: 10 * 60 * 1000, // 10 dakika timeout
      headers: {
        'accept-encoding': 'gzip;q=0',
        'connection': 'keep-alive',
        'content-type': 'application/json',
        'user-agent': 'vscode/1.86.0 (Node.js v20.18.3)',
        'x-requested-with': 'vscode 1.86.0',
        'Host': 'sourcegraph.com',
      }
    });

    // Proxy ayarla
    if (config.proxyUrl) {
      log.info(`Using proxy: ${config.proxyUrl}`);
      // Proxy konfigürasyonu burada eklenebilir
    }
  }

  /**
   * Streaming chat request gönder
   */
  async makeStreamRequest(
    request: OpenAIChatCompletionRequest,
    modelRef: string,
    requestId: string
  ): Promise<AsyncIterable<string>> {
    const maxRetries = this.cookieManager.getAvailableCookieCount();
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const cookie = attempt === 0 
          ? this.cookieManager.getRandomCookie() 
          : this.cookieManager.getNextCookie();

        log.request(requestId, 'debug', `Attempting request with cookie ${attempt + 1}/${maxRetries}`);

        return await this.performStreamRequest(request, modelRef, cookie, requestId);

      } catch (error: any) {
        attempt++;
        const statusCode = error.response?.status || error.status || 'unknown';
        
        log.request(requestId, 'warn', `Request attempt ${attempt} failed: ${error.message}`);
        log.request(requestId, 'error', `Error status: ${statusCode}`);
        
        // Güvenli hata loglaması
        if (error.response) {
          // Axios hatası (sunucudan cevap var)
          log.request(requestId, 'debug', `Error data: ${JSON.stringify(error.response.data)}`);
          log.request(requestId, 'debug', `Error headers: ${JSON.stringify(error.response.headers)}`);
        } else if (error.request) {
          // Axios hatası (cevap yok)
          log.request(requestId, 'debug', 'Error: No response received from server.');
        } else {
          // Diğer hatalar
          log.request(requestId, 'debug', `Error details: ${error.message}`);
        }
        
        // 400 hatası - model izni yok
        if (statusCode === 400) {
          log.request(requestId, 'error', `No permission to call this model - status 400`);
          // 400 hatası genellikle model izni ile ilgili, cookie değiştir
        }

        // Rate limit hatası
        if (statusCode === 429) {
          const currentCookie = this.cookieManager.getRandomCookie();
          this.cookieManager.addRateLimitCookie(currentCookie, config.rateLimitCookieLockDuration);
          log.request(requestId, 'warn', `Cookie rate limited - switching to next cookie`);
        }

        // Son deneme
        if (attempt >= maxRetries) {
          throw new Error(`All cookie attempts exhausted. Last error: ${error.message} (Status: ${statusCode})`);
        }
      }
    }

    throw new Error('Unexpected error in makeStreamRequest');
  }

  /**
   * Gerçek stream request'i gerçekleştir
   */
  private async performStreamRequest(
    request: OpenAIChatCompletionRequest,
    modelRef: string,
    cookie: string,
    requestId: string
  ): Promise<AsyncIterable<string>> {
    const requestBody = convertToSourcegraphFormat(request, modelRef);
    const traceParent = generateTraceParent();

    const headers = {
      'accept-encoding': 'gzip;q=0',
      'authorization': `token ${cookie}`,
      'connection': 'keep-alive',
      'content-type': 'application/json',
      'traceparent': traceParent,
      'user-agent': 'vscode/1.86.0 (Node.js v20.18.3)',
      'x-requested-with': 'vscode 1.86.0',
      'x-sourcegraph-interaction-id': uuidv4(),
      'Host': 'sourcegraph.com',
      'Transfer-Encoding': 'chunked'
    };

    log.request(requestId, 'debug', `Making stream request to Sourcegraph API`);
    log.request(requestId, 'debug', `Request body: ${JSON.stringify(requestBody)}`);
    log.request(requestId, 'debug', `Request headers: ${JSON.stringify(headers)}`);

    const response = await this.httpClient.post(CHAT_ENDPOINT, requestBody, {
      headers,
      responseType: 'stream'
    });

    return this.processStreamResponse(response, requestId);
  }

  /**
   * Stream response'u işle
   */
  private async *processStreamResponse(
    response: AxiosResponse,
    requestId: string
  ): AsyncIterable<string> {
    const stream = response.data;

    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            log.request(requestId, 'debug', 'Stream completed');
            return;
          }

          // Cloudflare challenge kontrolü
          if (this.isCloudflareChallenge(data)) {
            throw new Error('Cloudflare challenge detected');
          }

          // Not login kontrolü
          if (this.isNotLogin(data)) {
            throw new Error('Authentication failed - not logged in');
          }

          yield data;
        }
      }
    }
  }

  /**
   * Non-streaming request gönder
   */
  async makeNonStreamRequest(
    request: OpenAIChatCompletionRequest,
    modelRef: string,
    requestId: string
  ): Promise<string> {
    // Stream request kullanıp tüm verileri birleştir
    const streamIterator = await this.makeStreamRequest(request, modelRef, requestId);
    let fullResponse = '';

    for await (const chunk of streamIterator) {
      try {
        const parsed = JSON.parse(chunk);
        if (parsed.delta && parsed.delta.content) {
          fullResponse += parsed.delta.content;
        }
      } catch (error) {
        // JSON parse hatası - chunk'ı doğrudan ekle
        fullResponse += chunk;
      }
    }

    return fullResponse;
  }

  /**
   * Cloudflare challenge kontrolü
   */
  private isCloudflareChallenge(data: string): boolean {
    return data.includes('cf-challenge') || data.includes('cloudflare');
  }

  /**
   * Login kontrolü
   */
  private isNotLogin(data: string): boolean {
    return data.includes('not authenticated') || data.includes('login required');
  }

  /**
   * Mevcut cookie sayısını al
   */
  getAvailableCookieCount(): number {
    return this.cookieManager.getAvailableCookieCount();
  }
}

// Singleton instance
export const sourcegraphClient = new SourcegraphClient(); 