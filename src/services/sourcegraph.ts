/**
 * Sourcegraph API Service / Sourcegraph API Servisi
 * Sourcegraph API ile iletişimi sağlar / Manages communication with the Sourcegraph API
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

// Sourcegraph API sabitleri / Sourcegraph API constants
const SOURCEGRAPH_BASE_URL = 'https://sourcegraph.com';
const CHAT_ENDPOINT = `${SOURCEGRAPH_BASE_URL}/.api/completions/stream?api-version=9&client-name=vscode&client-version=1.82.0`;

// Modelleri OpenAI formatından Sourcegraph formatına çevir / Convert models from OpenAI format to Sourcegraph format
const MODEL_MAP: Record<string, string> = {
  'claude-3-haiku-20240307': 'anthropic/claude-3-haiku-20240307',
  'claude-3-sonnet-20240229': 'anthropic/claude-3-sonnet-20240229',
  'claude-3-opus-20240229': 'anthropic/claude-3-opus-20240229',
};

/**
 * Gelen isteği Sourcegraph API formatına dönüştürür. / Converts the incoming request to the Sourcegraph API format.
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
    temperature: request.temperature ?? 0, // Go versiyonuyla uyumlu / Compatible with Go version
    topP: -1, // Go versiyonuyla uyumlu / Compatible with Go version
    topK: -1, // Go versiyonuyla uyumlu / Compatible with Go version
  };
}

class SourcegraphClient {
  private getAuthHeaders(requestId: string) {
    const traceParent = `00-${uuidv4().replace(/-/g, '').slice(0, 32)}-${uuidv4().replace(/-/g, '').slice(0, 16)}-01`;

    // Go versiyonunda olduğu gibi, SG_COOKIE'yi alıp "token " önekiyle kullan. / As in the Go version, get SG_COOKIE and use it with the "token " prefix.
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

    // Proxy agent'ını yapılandır / Configure the proxy agent
    const httpsAgent = config.proxyUrl
      ? new (require('https-proxy-agent'))(config.proxyUrl)
      : new https.Agent({ rejectUnauthorized: false }); // Veya varsayılan agent / Or the default agent

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
        buffer += chunk.toString('utf-8');
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const messageBlock = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);

          let eventType = '';
          let eventData = '';

          const lines = messageBlock.split('\n');
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              eventData += line.substring(5).trim();
            }
          }

          if (eventType === 'done' || eventData === '[DONE]') {
            if (!stream.writableEnded) {
              stream.end();
            }
            return;
          }

          // Sadece 'completion' olayından gelen veriyi işle ve gönder. / Process and send only the data from the 'completion' event.
          if (eventType === 'completion' && eventData) {
            stream.write(eventData);
          }
        }
      });

      response.data.on('end', () => {
        log.request(requestId, 'debug', 'Sourcegraph stream ended. / Sourcegraph akışı sona erdi.');
        if (!stream.writableEnded) {
          stream.end();
        }
      });

      response.data.on('error', (err: Error) => {
        log.request(requestId, 'error', `Sourcegraph stream error: ${err.message} / Sourcegraph akış hatası: ${err.message}`);
        stream.emit('error', err);
        stream.end();
      });
    }).catch(error => {
      // GÜVENLİ HATA YÖNETİMİ / SAFE ERROR HANDLING
      // Axios'tan gelen error nesnesini ASLA doğrudan loglama veya JSON.stringify yapma. / NEVER log or JSON.stringify the error object from Axios directly.
      const statusCode = error.response?.status || 'unknown';
      let errorMessage = 'Axios request failed';

      if (error.response?.data) {
        // error.response.data bir stream veya buffer olabilir, güvenli bir şekilde metne çevir. / error.response.data could be a stream or buffer, convert it to text safely.
        try {
          // Eğer data bir Buffer ise / If data is a Buffer
          if (Buffer.isBuffer(error.response.data)) {
            errorMessage = error.response.data.toString('utf8');
          }
          // Eğer data bir stream ise, bu asenkron olur ve burada işlemek karmaşıktır. / If data is a stream, this would be asynchronous and complex to handle here.
          // Şimdilik sadece status kodunu ve genel bir mesajı loglayalım. / For now, let's just log the status code and a generic message.
          else if (typeof error.response.data.pipe === 'function') {
            errorMessage = 'Received a stream as error data. / Hata verisi olarak bir akış alındı.';
          }
          // Diğer durumlar (JSON veya string olabilir) / Other cases (could be JSON or string)
          else {
            errorMessage = JSON.stringify(error.response.data);
          }
        } catch (e) {
          errorMessage = 'Failed to stringify error data. / Hata verisi metne dönüştürülemedi.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      log.request(requestId, 'error', `Axios request failed with status ${statusCode}. Data: ${errorMessage} / Axios isteği ${statusCode} durumuyla başarısız oldu. Veri: ${errorMessage}`);
      stream.emit('error', new Error(`Request failed with status ${statusCode} / İstek ${statusCode} durumuyla başarısız oldu`));
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
    // Bu fonksiyon şimdilik stream versiyonuyla benzer şekilde bırakılabilir / This function can be left similar to the stream version for now
    // veya özel bir non-stream implementasyonu yapılabilir. / or a custom non-stream implementation can be made.
    throw new Error('Non-streaming requests not implemented yet. / Akış olmayan istekler henüz uygulanmadı.');
  }
}

export const sourcegraphClient = new SourcegraphClient(); 