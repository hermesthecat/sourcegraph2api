/**
 * Sourcegraph API Service
 * Manages communication with the Sourcegraph API
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
import { getRandomActiveCookie } from './cookie.service'; // Import cookie service
import { recordUsage } from './metric.service'; // Import metric service

// Sourcegraph API constants
// These values will now be dynamically obtained from the config

// Convert models from OpenAI format to Sourcegraph format
const MODEL_MAP: Record<string, string> = {
  'claude-3-haiku-20240307': 'anthropic/claude-3-haiku-20240307',
  'claude-3-sonnet-20240229': 'anthropic/claude-3-sonnet-20240229',
  'claude-3-opus-20240229': 'anthropic/claude-3-opus-20240229',
};

/**
 * Converts the incoming request to the Sourcegraph API format.
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
    temperature: request.temperature ?? 0, // Compatible with Go version
    topP: -1, // Compatible with Go version
    topK: -1, // Compatible with Go version
  };
}

class SourcegraphClient {
  private async getAuthHeaders(requestId: string) { // Make function async
    const traceParent = `00-${uuidv4().replace(/-/g, '').slice(0, 32)}-${uuidv4().replace(/-/g, '').slice(0, 16)}-01`;

    // Get a random active cookie from the pool
    const activeCookie = await getRandomActiveCookie();

    if (!activeCookie) {
      log.request(requestId, 'error', 'No active cookies available in the pool. Request rejected.');
      throw new Error('No active cookies available in the pool.');
    }

    const cookieValue = activeCookie.cookieValue;

    // Add cookie ID to request for metric recording
    // @ts-ignore
    this.cookieId = activeCookie.id;

    // As in the Go version, get SG_COOKIE and use it with the "token " prefix.
    const authorization = `token ${cookieValue}`;

    return {
      'cookie': cookieValue,
      'authorization': authorization,
      'traceparent': traceParent,
      'x-sourcegraph-interaction-id': uuidv4(),
      'content-type': 'application/json',
      'user-agent': config.userAgent, // Get from dynamic config
    };
  }

  async makeStreamRequest(
    request: OpenAIChatCompletionRequest,
    requestId: string,
    // Let's also get the Express Request object
    expressRequest: import('express').Request
  ): Promise<AsyncIterable<string>> {
    let activeCookieId: number | null = null;
    try {
      const modelRef = MODEL_MAP[request.model] || request.model;
      const requestBody = convertToSourcegraphFormat(request, modelRef);
      // @ts-ignore
      const headers = await this.getAuthHeaders(requestId);
      // @ts-ignore
      activeCookieId = this.cookieId; // Get cookie ID

      const stream = new PassThrough();

      // Configure the proxy agent
      const httpsAgent = config.proxyUrl
        ? new (require('https-proxy-agent'))(config.proxyUrl)
        : new https.Agent({ rejectUnauthorized: false }); // Or the default agent

      axios({
        method: 'post',
        url: `${config.sourcegraphBaseUrl}${config.chatEndpoint}`,
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

            // Process and send only the data from the 'completion' event.
            if (eventType === 'completion' && eventData) {
              stream.write(eventData);
            }
          }
        });

        response.data.on('end', () => {
          recordUsage({
            ipAddress: expressRequest.ip || 'unknown',
            apiKeyId: expressRequest.apiKeyId || null,
            cookieId: activeCookieId,
            model: request.model,
            wasSuccess: true,
          });
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
        // SAFE ERROR HANDLING
        // NEVER log or JSON.stringify the error object from Axios directly.
        const statusCode = error.response?.status || 'unknown';
        let errorMessage = 'Axios request failed';

        if (error.response?.data) {
          // error.response.data could be a stream or buffer, convert it to text safely.
          try {
            // If data is a Buffer
            if (Buffer.isBuffer(error.response.data)) {
              errorMessage = error.response.data.toString('utf8');
            }
            // If data is a stream, this would be asynchronous and complex to handle here.
            // For now, let's just log the status code and a generic message.
            else if (typeof error.response.data.pipe === 'function') {
              errorMessage = 'Received a stream as error data.';
            }
            // Other cases (could be JSON or string)
            else {
              errorMessage = JSON.stringify(error.response.data);
            }
          } catch (e) {
            errorMessage = 'Failed to stringify error data.';
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Record failed metric
        recordUsage({
          ipAddress: expressRequest.ip || 'unknown',
          apiKeyId: expressRequest.apiKeyId || null,
          cookieId: activeCookieId, // Record which cookie was attempted even if it failed
          model: request.model,
          wasSuccess: false,
          errorMessage: `Status ${statusCode}: ${errorMessage}`
        });

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
    } catch (error: any) {
      // This catch block is usually triggered when a cookie is not found
      recordUsage({
        ipAddress: expressRequest.ip || 'unknown',
        apiKeyId: expressRequest.apiKeyId || null,
        cookieId: null, // Null because no cookie was found
        model: request.model, // Attempt to record model even if error
        wasSuccess: false,
        errorMessage: error.message
      });
      throw error;
    }
  }

  async makeNonStreamRequest(
    request: OpenAIChatCompletionRequest,
    requestId: string
  ) {
    // This function can be left similar to the stream version for now
    // or a custom non-stream implementation can be made.
    throw new Error('Non-streaming requests not implemented yet.');
  }
}

export const sourcegraphClient = new SourcegraphClient(); 