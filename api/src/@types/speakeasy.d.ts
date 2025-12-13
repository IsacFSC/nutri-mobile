declare module 'speakeasy' {
  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    qr_code_ascii: string;
    qr_code_hex: string;
    qr_code_base32: string;
    google_auth_qr: string;
    otpauth_url: string;
  }

  export interface GenerateSecretOptions {
    length?: number;
    name?: string;
    issuer?: string;
    symbols?: boolean;
    qr_codes?: boolean;
    google_auth_qr?: boolean;
  }

  export interface VerifyOptions {
    secret: string;
    encoding?: 'base32' | 'ascii' | 'hex';
    token: string;
    window?: number;
  }

  export interface TOTPOptions {
    secret: string;
    encoding?: 'base32' | 'ascii' | 'hex';
    time?: number;
    step?: number;
    digits?: number;
  }

  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
  
  export namespace totp {
    function verify(options: VerifyOptions): boolean;
    function generate(options: TOTPOptions): string;
  }
}
