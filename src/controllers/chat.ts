/**
 * Chat Controller - OpenAI uyumlu chat completion API
 */

import { Request, Response } from 'express';
import { OpenAIChatCompletionRequest, OpenAIChatCompletionResponse, OpenAIErrorResponse } from '../types';
import { getModelInfo } from '../config';
import { sourcegraphClient } from '../services/sourcegraph';
import { log } from '../utils/logger';

/**
 * Response ID oluştur
 */
function generateResponseId(): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
  return `chatcmpl-${timestamp}`;
}

/**
 * Token sayısı hesapla
 */
function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chat Completion API endpoint
 */
export async function chatCompletion(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';
  
  try {
    const request: OpenAIChatCompletionRequest = req.body;
    
    // Validasyon
    if (!request.model) {
      res.status(400).json({
        error: { message: 'Model is required', type: 'invalid_request_error', code: 'missing_model' }
      } as OpenAIErrorResponse);
      return;
    }

    if (!request.messages?.length) {
      res.status(400).json({
        error: { message: 'Messages are required', type: 'invalid_request_error', code: 'missing_messages' }
      } as OpenAIErrorResponse);
      return;
    }

    // Model kontrolü
    const modelInfo = getModelInfo(request.model);
    if (!modelInfo) {
      res.status(400).json({
        error: { message: `Model ${request.model} not supported`, type: 'invalid_request_error', code: 'invalid_model' }
      } as OpenAIErrorResponse);
      return;
    }

    log.request(requestId, 'info', `Chat request: ${request.model}, stream: ${request.stream}`);

    if (request.stream) {
      await handleStreaming(request, requestId, res);
    } else {
      await handleNonStreaming(request, requestId, res);
    }

  } catch (error: any) {
    log.request(requestId, 'error', `Chat error: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        error: { message: 'Internal server error', type: 'internal_error', code: 'server_error' }
      } as OpenAIErrorResponse);
    }
  }
}

/**
 * Streaming response
 */
async function handleStreaming(
  request: OpenAIChatCompletionRequest,
  requestId: string,
  res: Response
): Promise<void> {
  const responseId = generateResponseId();
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const streamIterator = await sourcegraphClient.makeStreamRequest(request, requestId);
    
    for await (const chunk of streamIterator) {
      const content = processChunk(chunk);
      if (content) {
        const response: OpenAIChatCompletionResponse = {
          id: responseId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: request.model,
          choices: [{ index: 0, delta: { content }, finish_reason: null }]
        };
        res.write(`data: ${JSON.stringify(response)}\n\n`);
      }
    }
    
    res.write(`data: [DONE]\n\n`);
    res.end();
    
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown streaming error occurred';
    log.request(requestId, 'error', `Streaming error: ${errorMessage}`);
    
    const errorResponse = {
      error: {
        message: errorMessage,
        type: 'server_error',
        code: error.code || 'streaming_error'
      }
    };
    
    // Header'lar gönderilmediyse, normal bir JSON hatası gönder
    if (!res.headersSent) {
        res.status(500).json(errorResponse);
        return;
    }

    // Header'lar gönderildiyse, SSE formatında hata gönder
    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
}

/**
 * Non-streaming response
 */
async function handleNonStreaming(
  request: OpenAIChatCompletionRequest,
  requestId: string,
  res: Response
): Promise<void> {
  const responseId = generateResponseId();
  
  try {
    // Geçici olarak makeStreamRequest'i kullanıp sonucu birleştirelim
    const streamIterator = await sourcegraphClient.makeStreamRequest(request, requestId);
    let content = '';
    for await (const chunk of streamIterator) {
      const processed = processChunk(chunk);
      if (processed) {
        content += processed;
      }
    }

    const promptText = request.messages.map(m => typeof m.content === 'string' ? m.content : '').join(' ');
    const promptTokens = countTokens(promptText);
    const completionTokens = countTokens(content);

    const response: OpenAIChatCompletionResponse = {
      id: responseId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
      }
    };

    res.json(response);
    
  } catch (error) {
    throw error;
  }
}

/**
 * Chunk'ı işle
 */
function processChunk(chunk: string): string | null {
  try {
    const parsed = JSON.parse(chunk);
    if (parsed.error) {
      log.warn(`Received error event from Sourcegraph: ${parsed.error.message}`);
      return null;
    }
    return parsed.completion || null;
  } catch (e) {
    // JSON parse hatası olursa, chunk'ın kendisi bir string olabilir
    return chunk;
  }
} 