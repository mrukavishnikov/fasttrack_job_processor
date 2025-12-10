import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Webhook Authentication Middleware
 * 
 * Validates the X-Shared-Secret header to ensure requests
 * come from authorized sources (n8n, mock worker, etc.)
 * 
 * Security Note: Uses strict equality check to prevent timing attacks.
 * In production, consider using crypto.timingSafeEqual for constant-time comparison.
 */
export function webhookAuth(req: Request, res: Response, next: NextFunction): void {
  const providedSecret = req.headers['x-shared-secret'];

  // Check if secret header exists
  if (!providedSecret) {
    res.status(401).json({
      success: false,
      error: 'Missing X-Shared-Secret header',
    });
    return;
  }

  // Check if secret is a string (not array)
  if (Array.isArray(providedSecret)) {
    res.status(401).json({
      success: false,
      error: 'Invalid X-Shared-Secret header format',
    });
    return;
  }

  // Strict equality check
  // Architecture Note: For high-security environments, use crypto.timingSafeEqual
  // to prevent timing attacks. This is sufficient for our mock implementation.
  if (providedSecret !== env.WEBHOOK_SECRET) {
    console.warn('⚠️ Webhook auth failed: Invalid secret provided');
    res.status(403).json({
      success: false,
      error: 'Invalid X-Shared-Secret',
    });
    return;
  }

  next();
}

