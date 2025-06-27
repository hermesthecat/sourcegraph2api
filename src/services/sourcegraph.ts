/**
 * Sourcegraph API Service
 * Sourcegraph API ile iletişimi sağlar
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { log } from '../utils/logger';
import { OpenAIChatCompletionRequest, OpenAIChatMessage } from '../types';
import {
  delay,
  calculateBackoff,
} from '../utils/helpers';
import { PassThrough } from 'stream';
import https from 'https';

// Sourcegraph API sabitleri
const SOURCEGRAPH_BASE_URL = 'https://sourcegraph.com';
const CHAT_ENDPOINT = `${SOURCEGRAPH_BASE_URL}/.api/completions/stream?api-version=9&client-name=vscode&client-version=1.82.0`;

// Modelleri OpenAI formatından Sourcegraph formatına çevir
const MODEL_MAP: Record<string, string> = {
  'claude-3-haiku-20240307': 'anthropic/claude-3-haiku-20240307',
  'claude-3-sonnet-20240229': 'anthropic/claude-3-sonnet-20240229',
  'claude-3-opus-20240229': 'anthropic/claude-3-opus-20240229',
};

/**
 * Gelen isteği Sourcegraph API formatına dönüştürür.
 * @param request OpenAIChatCompletionRequest
 * @param modelRef string
 * @returns SourcegraphChatCompletionRequest
 */
function convertToSourcegraphFormat(
  request: OpenAIChatCompletionRequest,
  modelRef: string
) {
  const messages = request.messages.map((msg: OpenAIChatMessage) => ({
    speaker: msg.role === 'user' ? 'human' : 'assistant',
    text: msg.content,
  }));

  return {
    model: modelRef,
    messages: messages,
    maxTokensToSample: request.max_tokens || 4000,
    temperature: request.temperature ?? 0, // Go versiyonuyla uyumlu
    topP: -1, // Go versiyonuyla uyumlu
    topK: -1, // Go versiyonuyla uyumlu
  };
}

class SourcegraphClient {
  private getAuthHeaders(requestId: string) {
    const traceParent = `00-${uuidv4().replace(/-/g, '').slice(0, 32)}-${uuidv4().replace(/-/g, '').slice(0, 16)}-01`;

    // Go versiyonunda olduğu gibi, SG_COOKIE'yi alıp "token " önekiyle kullan.
    const authorization = `token ${config.sgCookie}`;

    return {
      'cookie': config.sgCookie,
      'authorization': authorization,
      'traceparent': traceParent,
      'x-sourcegraph-interaction-id': uuidv4(),
      'content-type': 'application/json',
      'user-agent': config.userAgent,
    };
  }
  
  async makeStreamRequest(
    request: OpenAIChatCompletionRequest,
    requestId: string
  ): Promise<AsyncIterable<string>> {
    const modelRef = MODEL_MAP[request.model] || request.model;
    const requestBody = convertToSourcegraphFormat(request, modelRef);
    const headers = this.getAuthHeaders(requestId);

    const stream = new PassThrough();
    
    // Proxy agent'ını yapılandır
    const httpsAgent = config.proxyUrl 
      ? new (require('https-proxy-agent'))(config.proxyUrl) 
      : new https.Agent({ rejectUnauthorized: false }); // Veya varsayılan agent

    axios({
        method: 'post',
        url: CHAT_ENDPOINT,
        data: requestBody,
        headers: headers,
        responseType: 'stream',
        httpsAgent: httpsAgent,
    }).then(response => {
        let buffer = '';
        response.data.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            let boundary;
            while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                const eventString = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 2);
                
                if (eventString.startsWith('data: ')) {
                    const data = eventString.substring(6).trim();
                    if (data === '[DONE]') {
                        stream.end();
                        return;
                    }
                    if (data) {
                        // SSE formatında data göndermeye gerek yok, doğrudan JSON gönder
                        stream.write(data);
                    }
                }
            }
        });

        response.data.on('end', () => {
            log.request(requestId, 'debug', 'Sourcegraph stream ended.');
            if (!stream.writableEnded) {
                stream.end();
            }
        });

        response.data.on('error', (err: Error) => {
            log.request(requestId, 'error', `Sourcegraph stream error: ${err.message}`);
            stream.emit('error', err);
            stream.end();
        });
    }).catch(error => {
        // GÜVENLİ HATA YÖNETİMİ
        // Axios'tan gelen error nesnesini ASLA doğrudan loglama veya JSON.stringify yapma.
        const statusCode = error.response?.status || 'unknown';
        let errorMessage = 'Axios request failed';

        if (error.response?.data) {
            // error.response.data bir stream veya buffer olabilir, güvenli bir şekilde metne çevir.
            try {
                // Eğer data bir Buffer ise
                if (Buffer.isBuffer(error.response.data)) {
                    errorMessage = error.response.data.toString('utf8');
                } 
                // Eğer data bir stream ise, bu asenkron olur ve burada işlemek karmaşıktır.
                // Şimdilik sadece status kodunu ve genel bir mesajı loglayalım.
                else if (typeof error.response.data.pipe === 'function') {
                    errorMessage = 'Received a stream as error data.';
                }
                // Diğer durumlar (JSON veya string olabilir)
                else {
                    errorMessage = JSON.stringify(error.response.data);
                }
            } catch (e) {
                errorMessage = 'Failed to stringify error data.';
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        log.request(requestId, 'error', `Axios request failed with status ${statusCode}. Data: ${errorMessage}`);
        stream.emit('error', new Error(`Request failed with status ${statusCode}`));
        stream.end();
    });

    async function* streamGenerator(): AsyncIterable<string> {
        for await (const chunk of stream) {
            yield chunk.toString();
        }
    }

    return streamGenerator();
  }
  
  async makeNonStreamRequest(
    request: OpenAIChatCompletionRequest,
    requestId: string
  ) {
    // Bu fonksiyon şimdilik stream versiyonuyla benzer şekilde bırakılabilir
    // veya özel bir non-stream implementasyonu yapılabilir.
    throw new Error('Non-streaming requests not implemented yet.');
  }
}

export const sourcegraphClient = new SourcegraphClient(); 