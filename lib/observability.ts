/**
 * Centralized Observability & Error Handling
 *
 * Provides structured logging, error tracking, and performance monitoring
 * that integrates with Vercel's logging infrastructure.
 *
 * Usage:
 *   import { logger, withErrorHandling, trackMetric } from '@/lib/observability';
 *
 *   // In API routes
 *   export default withErrorHandling(async (req, res) => { ... });
 *
 *   // Manual logging
 *   logger.info('User signed up', { userId: '123' });
 *   logger.error('Payment failed', { error, userId: '123' });
 *
 *   // Track custom metrics
 *   trackMetric('api.latency', duration, { endpoint: '/api/user' });
 */

import type { NextApiRequest, NextApiResponse } from "next";

// =============================================================================
// Types
// =============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface ErrorContext extends LogContext {
  error?: Error | unknown;
  stack?: string;
  code?: string;
  statusCode?: number;
}

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

// =============================================================================
// Environment Detection
// =============================================================================

const isProduction = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;
const deploymentUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_URL || "localhost";

// =============================================================================
// Structured Logger
// =============================================================================

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    environment: isProduction ? "production" : "development",
    deployment: deploymentUrl,
    ...context,
  };

  // In production/Vercel, use JSON for structured logging
  if (isProduction || isVercel) {
    return JSON.stringify(logData);
  }

  // In development, use readable format
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

function sanitizeError(error: unknown): ErrorContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: isProduction ? undefined : error.stack,
      code: (error as ApiError).code,
    };
  }
  return { errorMessage: String(error) };
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!isProduction) {
      console.debug(formatLog("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, context?: ErrorContext): void {
    const sanitizedContext = context?.error
      ? { ...context, ...sanitizeError(context.error), error: undefined }
      : context;
    console.error(formatLog("error", message, sanitizedContext));
  },

  // Special method for API request logging
  api(req: NextApiRequest, status: number, duration: number, context?: LogContext): void {
    const logData = {
      method: req.method,
      path: req.url,
      status,
      duration: `${duration}ms`,
      userAgent: req.headers["user-agent"]?.slice(0, 100),
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      ...context,
    };

    if (status >= 500) {
      console.error(formatLog("error", `API ${req.method} ${req.url}`, logData));
    } else if (status >= 400) {
      console.warn(formatLog("warn", `API ${req.method} ${req.url}`, logData));
    } else {
      console.info(formatLog("info", `API ${req.method} ${req.url}`, logData));
    }
  },
};

// =============================================================================
// Custom Error Classes
// =============================================================================

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, field ? `VALIDATION_${field.toUpperCase()}` : "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Permission denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  retryAfter?: number;

  constructor(message = "Too many requests", retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ExternalServiceError extends AppError {
  service: string;

  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`, 503, `${service.toUpperCase()}_ERROR`);
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

// =============================================================================
// Error Response Formatter
// =============================================================================

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    requestId?: string;
  };
}

function formatErrorResponse(
  error: Error | AppError,
  requestId?: string,
): { statusCode: number; body: ErrorResponse } {
  const isAppError = error instanceof AppError;

  // Don't expose internal error details in production
  const message = isAppError || !isProduction ? error.message : "An unexpected error occurred";

  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : "INTERNAL_ERROR";

  return {
    statusCode,
    body: {
      error: {
        message,
        code,
        statusCode,
        requestId,
      },
    },
  };
}

// =============================================================================
// API Route Wrapper with Error Handling
// =============================================================================

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

interface WithErrorHandlingOptions {
  /** Log all requests, not just errors */
  logAllRequests?: boolean;
  /** Custom error transformer */
  transformError?: (error: unknown) => AppError;
}

export function withErrorHandling(
  handler: ApiHandler,
  options: WithErrorHandlingOptions = {},
): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Add request ID to response headers for tracing
    res.setHeader("x-request-id", requestId);

    try {
      await handler(req, res);

      // Log successful requests if enabled
      if (options.logAllRequests) {
        const duration = Date.now() - startTime;
        logger.api(req, res.statusCode, duration, { requestId });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Transform error if transformer provided
      const processedError = options.transformError ? options.transformError(error) : error;

      // Log the error
      logger.error("API request failed", {
        error: processedError,
        requestId,
        method: req.method,
        path: req.url,
        duration: `${duration}ms`,
      });

      // Format and send error response
      const { statusCode, body } = formatErrorResponse(
        processedError instanceof Error ? processedError : new Error(String(processedError)),
        requestId,
      );

      // Add retry-after header for rate limit errors
      if (processedError instanceof RateLimitError && processedError.retryAfter) {
        res.setHeader("Retry-After", processedError.retryAfter);
      }

      if (!res.headersSent) {
        res.status(statusCode).json(body);
      }
    }
  };
}

// =============================================================================
// Performance Tracking
// =============================================================================

interface MetricTags {
  [key: string]: string | number | boolean;
}

export function trackMetric(name: string, value: number, tags?: MetricTags): void {
  // In Vercel, metrics are logged as structured JSON and can be queried
  const metricData = {
    metric: name,
    value,
    unit: inferUnit(name),
    tags,
    timestamp: Date.now(),
  };

  // Use console.info for metrics (Vercel picks these up)
  console.info(JSON.stringify({ type: "metric", ...metricData }));
}

function inferUnit(metricName: string): string {
  if (metricName.includes("latency") || metricName.includes("duration")) return "ms";
  if (metricName.includes("size") || metricName.includes("bytes")) return "bytes";
  if (metricName.includes("count") || metricName.includes("total")) return "count";
  if (metricName.includes("rate") || metricName.includes("per_second")) return "per_second";
  return "unit";
}

// Track async operation duration
export async function trackDuration<T>(
  name: string,
  operation: () => Promise<T>,
  tags?: MetricTags,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    trackMetric(name, Date.now() - start, { ...tags, success: true });
    return result;
  } catch (error) {
    trackMetric(name, Date.now() - start, { ...tags, success: false });
    throw error;
  }
}

// =============================================================================
// Health Check Utilities
// =============================================================================

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    name: string;
    status: "pass" | "fail";
    latency?: number;
    message?: string;
  }[];
  timestamp: string;
}

export async function runHealthCheck(
  checks: { name: string; check: () => Promise<void> }[],
): Promise<HealthCheckResult> {
  const results = await Promise.all(
    checks.map(async ({ name, check }) => {
      const start = Date.now();
      try {
        await check();
        return { name, status: "pass" as const, latency: Date.now() - start };
      } catch (error) {
        return {
          name,
          status: "fail" as const,
          latency: Date.now() - start,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  );

  const failedCount = results.filter((r) => r.status === "fail").length;
  const status =
    failedCount === 0 ? "healthy" : failedCount < results.length ? "degraded" : "unhealthy";

  return {
    status,
    checks: results,
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// Utilities
// =============================================================================

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// Assert environment variable exists
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AppError(
      `Missing required environment variable: ${name}`,
      500,
      "MISSING_ENV_VAR",
      false, // Not operational - configuration error
    );
  }
  return value;
}

// Safe JSON parse with error handling
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    logger.warn("Failed to parse JSON", { json: json.slice(0, 100) });
    return fallback;
  }
}
