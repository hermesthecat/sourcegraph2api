/**
 * Sourcegraph2API - Node.js Version
 * TypeScript Type Definitions / TypeScript Tür Tanımları
 */

// OpenAI API uyumlu request/response tipleri / OpenAI API compatible request/response types
export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
}

export interface ChatContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  top_p?: number;
  n?: number;
}

export interface OpenAIChatCompletionResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Choice[];
  usage?: Usage;
  system_fingerprint?: string;
}

export interface Choice {
  index: number;
  message?: OpenAIChatMessage;
  delta?: Delta;
  finish_reason?: 'stop' | 'length' | 'content_filter' | null;
  logprobs?: any;
}

export interface Delta {
  role?: string;
  content?: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// Sourcegraph API specific tipleri / Sourcegraph API specific types
export interface SGModelInfo {
  model: string;
  modelRef: string;
  maxTokens: number;
}

export interface SourcegraphRequest {
  query: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Konfigürasyon tipleri / Configuration types
export interface AppConfig {
  port: number;
  host?: string;
  env?: string;
  debug: boolean;
  sgCookie: string;
  apiSecret?: string;
  apiSecrets: string[];
  proxyUrl?: string;
  userAgent: string;
  requestRateLimit: number;
  rateLimitCookieLockDuration: number;
  routePrefix: string;
  swaggerEnable: boolean;
  ipBlackList: string[];
  nodeEnv: 'development' | 'production' | 'test';
}

// Cookie yönetimi tipleri / Cookie management types
export interface CookieManager {
  cookies: string[];
  currentIndex: number;
  getRandomCookie(): Promise<string>;
  getNextCookie(): Promise<string>;
  removeCookie(cookie: string): void;
  isRateLimited(cookie: string): boolean;
}

export interface RateLimitCookie {
  expirationTime: Date;
}

// HTTP istek tipleri / HTTP request types
export interface RequestContext {
  id: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

// Logger tipleri / Logger types
export interface LoggerOptions {
  level: 'error' | 'warn' | 'info' | 'debug';
  timestamp: boolean;
  json: boolean;
  colorize: boolean;
}

// Model listesi tipi / Model list type
export interface ModelListResponse {
  object: 'list';
  data: ModelInfo[];
}

export interface ModelInfo {
  id: string;
  object: 'model';
  created?: number;
  owned_by?: string;
}

// Error handling / Hata yönetimi
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
} 