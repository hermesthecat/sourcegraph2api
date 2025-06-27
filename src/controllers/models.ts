/**
 * Models Controller - OpenAI uyumlu models API
 * Models Controller - OpenAI compatible models API
 */

import { Request, Response } from 'express';
import { ModelListResponse, ModelInfo } from '../types';
import { getModelList } from '../config';
import { log } from '../utils/logger';

/**
 * Get Models API endpoint
 * GET /v1/models
 * Modelleri alma API uç noktası
 */
export async function getModels(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';

  try {
    log.request(requestId, 'info', 'Models list requested / Model listesi istendi');

    // Tüm desteklenen modelleri al / Get all supported models
    const modelNames = getModelList();

    // OpenAI formatında model listesi oluştur / Create model list in OpenAI format
    const models: ModelInfo[] = modelNames.map(modelName => ({
      id: modelName,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'sourcegraph'
    }));

    const response: ModelListResponse = {
      object: 'list',
      data: models
    };

    log.request(requestId, 'debug', `Returning ${models.length} models / ${models.length} model döndürülüyor`);

    res.json(response);

  } catch (error: any) {
    log.request(requestId, 'error', `Models endpoint error / Modeller uç nokta hatası: ${error.message}`);

    res.status(500).json({
      error: {
        message: 'Internal server error / Dahili sunucu hatası',
        type: 'internal_error',
        code: 'server_error'
      }
    });
  }
}

/**
 * Get specific model info
 * GET /v1/models/{model}
 * Belirli model bilgisini al
 */
export async function getModel(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';
  const modelId = req.params.model;

  try {
    log.request(requestId, 'info', `Model info requested / Model bilgisi istendi: ${modelId}`);

    const modelNames = getModelList();

    if (!modelNames.includes(modelId)) {
      res.status(404).json({
        error: {
          message: `Model ${modelId} not found / ${modelId} modeli bulunamadı`,
          type: 'invalid_request_error',
          code: 'model_not_found'
        }
      });
      return;
    }

    const model: ModelInfo = {
      id: modelId,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'sourcegraph'
    };

    log.request(requestId, 'debug', `Returning model info / Model bilgisi döndürülüyor: ${modelId}`);

    res.json(model);

  } catch (error: any) {
    log.request(requestId, 'error', `Model endpoint error / Model uç nokta hatası: ${error.message}`);

    res.status(500).json({
      error: {
        message: 'Internal server error / Dahili sunucu hatası',
        type: 'internal_error',
        code: 'server_error'
      }
    });
  }
} 