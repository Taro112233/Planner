// lib/arcjet-config.ts
// HealthTech Sandbox - Arcjet Security Configuration

import arcjet, { detectBot, shield, tokenBucket, slidingWindow } from "@arcjet/next";
import { NextRequest } from "next/server";

// ===== TYPE DEFINITIONS =====

/**
 * Arcjet decision result type
 * Based on @arcjet/next types
 */
interface ArcjetReason {
  isRateLimit?: () => boolean;
  isBot?: () => boolean;
  isShield?: () => boolean;
  resetTime?: number;
  max?: number;
  remaining?: number;
}

interface ArcjetResult {
  reason?: ArcjetReason;
  max?: number;
  remaining?: number;
  resetTime?: number;
}

interface ArcjetDecision {
  isDenied: () => boolean;
  reason: ArcjetReason;
  results: ArcjetResult[];
}

// ===== ARCJET INSTANCES =====

/**
 * Arcjet instance for authentication endpoints (login/register)
 * - Stricter rate limits to prevent brute force
 * - Bot detection enabled
 * - Shield protection against injection attacks
 */
export const arcjetAuth = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
    slidingWindow({
      mode: "LIVE",
      interval: "15m",
      max: 5,
    }),
  ],
});

/**
 * Arcjet instance for API endpoints (request creation, comments)
 * - Moderate rate limits for normal usage
 * - Allow search engines and monitoring bots
 * - Shield protection
 */
export const arcjetAPI = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:MONITOR",
      ],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: 60,
      capacity: 20,
    }),
  ],
});

/**
 * Arcjet instance for file upload endpoints
 * - Lower rate limits due to resource intensity
 * - Smaller bucket capacity
 */
export const arcjetUpload = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 2,
      interval: 60,
      capacity: 5,
    }),
  ],
});

// ===== HELPER FUNCTIONS =====

/**
 * Extract client IP from NextRequest
 * Handles local development, Vercel production, and various proxy setups
 * 
 * Priority order:
 * 1. x-forwarded-for (Vercel, most proxies)
 * 2. x-real-ip (Nginx, some CDNs)
 * 3. request.ip (runtime property, type-cast)
 * 4. "unknown" fallback
 */
export function getClientIP(request: NextRequest): string {
  // 1. Check x-forwarded-for (most common in production)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Format: "client, proxy1, proxy2" - we want the client IP
    const firstIP = forwardedFor.split(",")[0].trim();
    if (firstIP && firstIP !== "unknown") {
      return firstIP;
    }
  }
  
  // 2. Check x-real-ip (alternative header used by some proxies)
  const realIP = request.headers.get("x-real-ip");
  if (realIP && realIP !== "unknown") {
    return realIP;
  }
  
  // 3. Try request.ip (exists in runtime but not in types)
  // This is available in Vercel Edge runtime and local dev
  try {
    const reqWithIP = request as NextRequest & { ip?: string };
    if (reqWithIP.ip && typeof reqWithIP.ip === "string") {
      return reqWithIP.ip;
    }
  } catch {
    // Ignore if property doesn't exist
  }
  
  // 4. Fallback
  return "unknown";
}

/**
 * Check Arcjet decision and return standardized error response
 */
export function handleArcjetDecision(decision: ArcjetDecision) {
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit?.()) {
      return {
        error: "Too many requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED" as const,
        retryAfter: decision.reason.resetTime
          ? Math.ceil((decision.reason.resetTime - Date.now()) / 1000)
          : 60,
      };
    }

    if (decision.reason.isBot?.()) {
      return {
        error: "Automated requests are not allowed",
        code: "BOT_DETECTED" as const,
      };
    }

    if (decision.reason.isShield?.()) {
      return {
        error: "Request blocked for security reasons",
        code: "SECURITY_VIOLATION" as const,
      };
    }

    return {
      error: "Access denied",
      code: "ACCESS_DENIED" as const,
    };
  }

  return null;
}

/**
 * Get rate limit information from Arcjet decision
 */
export function getRateLimitInfo(decision: ArcjetDecision) {
  const rateLimit = decision.results.find((r: ArcjetResult) => 
    r.reason?.isRateLimit?.() || r.reason?.max !== undefined
  );

  if (!rateLimit) return null;

  return {
    limit: rateLimit.reason?.max ?? rateLimit.max ?? 0,
    remaining: rateLimit.reason?.remaining ?? rateLimit.remaining ?? 0,
    reset: rateLimit.reason?.resetTime ?? rateLimit.resetTime,
  };
}