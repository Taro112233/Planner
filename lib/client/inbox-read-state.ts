// lib/client/inbox-read-state.ts
// "Seen up to" timestamp for the inbox, per browser. Storage can be missing
// or throw (private mode, blocked site data), so every access is guarded and
// a failure just means everything reads as unread.

const KEY = 'planner-inbox-seen-at';

/** Fired after "อ่านทั้งหมด" so the sidebar badge clears at once. */
export const INBOX_SEEN_EVENT = 'planner:inbox-seen';

export function readInboxSeenAt(): number {
  try {
    return Number(window.localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Stamp "now" and return it, so the caller can update state in one step. */
export function writeInboxSeenAt(): number {
  const now = Date.now();
  try {
    window.localStorage.setItem(KEY, String(now));
  } catch {
    // Not persisted — the page still shows everything read until reload.
  }
  window.dispatchEvent(new Event(INBOX_SEEN_EVENT));
  return now;
}
