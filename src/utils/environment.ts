export type AppEnvironment = 'homologacao' | 'producao';

const ENV_SESSION_KEY = 'peterson_shoes_active_env_v2';

export function getActiveEnvironment(): AppEnvironment {
  if (typeof window === 'undefined') {
    return 'producao';
  }

  try {
    // Clear any stale homologacao flag from previous sessions so orders are never split or hidden
    window.sessionStorage.removeItem(ENV_SESSION_KEY);
    window.sessionStorage.removeItem('peterson_shoes_active_env');
  } catch {
    // Ignore storage errors
  }

  return 'producao';
}

export function isHomologacao(): boolean {
  return false;
}

export function switchEnvironment(_nextEnv: AppEnvironment): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ENV_SESSION_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete('ambiente');
    url.searchParams.delete('env');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  } catch {
    // Ignore
  }
}

export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const env = getActiveEnvironment();
  const headers = new Headers(init.headers || {});
  headers.set('X-Peterson-Env', env);
  return fetch(input, {
    ...init,
    headers,
  });
}
