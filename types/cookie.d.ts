// types/cookie.d.ts
// InvenStock - Cookie Module Type Declaration

declare module 'cookie' {
  export interface CookieSerializeOptions {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    priority?: 'low' | 'medium' | 'high';
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    secure?: boolean;
  }

  export function serialize(
    name: string,
    value: string,
    options?: CookieSerializeOptions
  ): string;

  export function parse(str: string): Record<string, string>;
}