// app/api/auth/[...all]/route.ts
// NextJS Starter - Better Auth Handler with Arcjet Protection

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { arcjetAuth, handleArcjetDecision, getRateLimitInfo, getClientIP } from "@/lib/arcjet-config";
import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-logger";

const handlers = toNextJsHandler(auth);

// ===== ARCJET-PROTECTED POST HANDLER =====
export async function POST(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  
  // Apply Arcjet protection for login/register endpoints
  if (pathname.includes("/sign-in") || pathname.includes("/sign-up")) {
    const decision = await arcjetAuth.protect(request);
    
    // Log security events
    if (decision.isDenied()) {
      logSecurityEvent({
        type: decision.reason.isBot() ? "bot_blocked" : "rate_limit",
        ip: getClientIP(request),
        path: pathname,
        userAgent: request.headers.get("user-agent") || undefined,
        details: {
          reason: decision.reason,
          isBot: decision.reason.isBot?.(),
          isRateLimit: decision.reason.isRateLimit?.(),
        },
      });
    }
    
    // Handle denial
    const error = handleArcjetDecision(decision);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.error, code: error.code },
        { 
          status: error.code === "RATE_LIMIT_EXCEEDED" ? 429 : 403,
          headers: error.retryAfter 
            ? { "Retry-After": error.retryAfter.toString() }
            : undefined,
        }
      );
    }
    
    // Add rate limit headers
    const rateLimitInfo = getRateLimitInfo(decision);
    const response = await handlers.POST(request);
    
    if (rateLimitInfo && response) {
      response.headers.set("X-RateLimit-Limit", rateLimitInfo.limit.toString());
      response.headers.set("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
      if (rateLimitInfo.reset) {
        response.headers.set("X-RateLimit-Reset", rateLimitInfo.reset.toString());
      }
    }
    
    return response;
  }
  
  // For other auth endpoints, pass through
  return handlers.POST(request);
}

// ===== STANDARD GET HANDLER =====
export const GET = handlers.GET;