// lib/security-logger.ts
// NextJS Starter - Centralized Security Event Management

interface SecurityEventBase {
  timestamp: Date;
  ip: string;
  path: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

interface RateLimitEvent extends SecurityEventBase {
  type: 'rate_limit';
}

interface BotBlockedEvent extends SecurityEventBase {
  type: 'bot_blocked';
}

interface ShieldBlockedEvent extends SecurityEventBase {
  type: 'shield_blocked';
}

interface HostingIPEvent extends SecurityEventBase {
  type: 'hosting_ip';
}

interface SuspiciousPayloadEvent extends SecurityEventBase {
  type: 'suspicious_payload';
}

interface RCEAttemptEvent extends SecurityEventBase {
  type: 'rce_attempt';
}

interface InvalidRequestEvent extends SecurityEventBase {
  type: 'invalid_request';
}

export type SecurityEvent = 
  | RateLimitEvent 
  | BotBlockedEvent 
  | ShieldBlockedEvent 
  | HostingIPEvent
  | SuspiciousPayloadEvent
  | RCEAttemptEvent
  | InvalidRequestEvent;

// Simple in-memory storage for security events
const securityEvents: SecurityEvent[] = [];

/**
 * Log a security event to memory storage
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const securityEvent = {
    timestamp: new Date(),
    ...event
  } as SecurityEvent;
  
  securityEvents.push(securityEvent);
  
  // Keep only last 1000 events in memory
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, securityEvents.length - 1000);
  }
  
  // Log critical events to console for immediate visibility
  if (event.type === 'rce_attempt' || event.type === 'suspicious_payload') {
    console.error('🚨 [SECURITY ALERT]', {
      type: event.type,
      ip: event.ip,
      path: event.path,
      timestamp: new Date().toISOString(),
      details: event.details
    });
  }
}

/**
 * Get all security events
 */
export function getSecurityEvents(): SecurityEvent[] {
  return [...securityEvents];
}

/**
 * Get security events within a date range
 */
export function getSecurityEventsInRange(startDate: Date, endDate: Date): SecurityEvent[] {
  return securityEvents.filter(event => 
    event.timestamp >= startDate && event.timestamp <= endDate
  );
}

/**
 * Get security events of specific type
 */
export function getSecurityEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
  return securityEvents.filter(event => event.type === type);
}

/**
 * Clear all security events
 */
export function clearSecurityEvents(): void {
  securityEvents.length = 0;
}

/**
 * Get security statistics
 */
export function getSecurityStats(timeRange: { start: Date; end: Date }) {
  const eventsInRange = getSecurityEventsInRange(timeRange.start, timeRange.end);
  
  const eventsByType = eventsInRange.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ipCounts = eventsInRange.reduce((acc, event) => {
    acc[event.ip] = (acc[event.ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pathCounts = eventsInRange.reduce((acc, event) => {
    acc[event.path] = (acc[event.path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalEvents = eventsInRange.filter(e => 
    e.type === 'rce_attempt' || 
    e.type === 'suspicious_payload' ||
    e.type === 'shield_blocked'
  );

  return {
    totalEvents: eventsInRange.length,
    criticalEvents: criticalEvents.length,
    eventsByType,
    uniqueIPs: Object.keys(ipCounts).length,
    topIPs: Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count })),
    topPaths: Object.entries(pathCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count })),
    recentCriticalEvents: criticalEvents.slice(-10)
  };
}

/**
 * Get real-time threat level
 */
export function getThreatLevel(minutes = 5): 'low' | 'medium' | 'high' | 'critical' {
  const startTime = new Date(Date.now() - minutes * 60 * 1000);
  const recentEvents = getSecurityEventsInRange(startTime, new Date());
  
  const criticalCount = recentEvents.filter(e => 
    e.type === 'rce_attempt' || e.type === 'suspicious_payload'
  ).length;
  
  const suspiciousCount = recentEvents.filter(e =>
    e.type === 'shield_blocked' || e.type === 'rate_limit'
  ).length;
  
  if (criticalCount >= 3) return 'critical';
  if (criticalCount >= 1 || suspiciousCount >= 10) return 'high';
  if (suspiciousCount >= 5) return 'medium';
  return 'low';
}

export type {
  SecurityEventBase,
  RateLimitEvent,
  BotBlockedEvent,
  ShieldBlockedEvent,
  HostingIPEvent,
  SuspiciousPayloadEvent,
  RCEAttemptEvent,
  InvalidRequestEvent
};