// Embedded auth contract backed by Supabase.

export interface AuthUser {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  provider?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface AuthBridgeSessionResponse {
  authenticated: boolean;
  user?: AuthUser | null;
}

export interface AuthLogoutRequest {
  url: string;
  method: 'POST';
  credentials: 'include';
  body: URLSearchParams;
}

export interface AuthSessionState extends AuthStatus {
  loading: boolean;
}
