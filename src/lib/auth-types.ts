// Contract: auth.dwizzy.my.id is the only auth authority consumed by dwizzyWEEB.

export interface AuthUser {
  id: string;
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
