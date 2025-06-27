/**
 * Models Controller - OpenAI uyumlu models API
 */

import { Request, Response } from 'express';
import { ModelListResponse, ModelInfo } from '../types';
import { getModelList } from '../config';
import { log } from '../utils/logger';

/**
 * Get Models API endpoint
 * GET /v1/models
 */
export async function getModels(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';
  
  try {
    log.request(requestId, 'info', 'Models list requested');

    // Tüm desteklenen modelleri al
    const modelNames = getModelList();
    
    // OpenAI formatında model listesi oluştur
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

    log.request(requestId, 'debug', `Returning ${models.length} models`);
    
    res.json(response);

  } catch (error: any) {
    log.request(requestId, 'error', `Models endpoint error: ${error.message}`);
    
    res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
        code: 'server_error'
      }
    });
  }
}

/**
 * Get specific model info
 * GET /v1/models/{model}
 */
export async function getModel(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId || 'unknown';
  const modelId = req.params.model;
  
  try {
    log.request(requestId, 'info', `Model info requested: ${modelId}`);

    const modelNames = getModelList();
    
    if (!modelNames.includes(modelId)) {
      res.status(404).json({
        error: {
          message: `Model ${modelId} not found`,
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

    log.request(requestId, 'debug', `Returning model info: ${modelId}`);
    
    res.json(model);

  } catch (error: any) {
    log.request(requestId, 'error', `Model endpoint error: ${error.message}`);
    
    res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'internal_error',
        code: 'server_error'
      }
    });
  }
} 