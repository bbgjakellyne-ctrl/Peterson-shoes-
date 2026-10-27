export type AppEnvironment = 'homologacao' | 'producao';

const ENV_SESSION_KEY = 'peterson_shoes_active_env';

export function getActiveEnvironment(): AppEnvironment {
  if (typeof window === 'undefined') {
    return 'homologacao';
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const urlEnv = (params.get('ambiente') || params.get('env') || '').toLowerCase().trim();

    if (urlEnv === 'homologacao' || urlEnv === 'homolog' || urlEnv === 'staging' || urlEnv === 'teste') {
      window.sessionStorage.setItem(ENV_SESSION_KEY, 'homologacao');
      return 'homologacao';
    }

    if (urlEnv === 'producao' || urlEnv === 'prod' || urlEnv === 'oficial') {
      window.sessionStorage.setItem(ENV_SESSION_KEY, 'producao');
      return 'producao';
    }

    const stored = window.sessionStorage.getItem(ENV_SESSION_KEY);
    if (stored === 'homologacao' || stored === 'producao') {
      return stored;
    }

    const host = window.location.hostname.toLowerCase();
    // No preview de desenvolvimento (ais-dev / localhost), inicia em Homologação por segurança
    if (
      host.includes('ais-dev') ||
      host.includes('localhost') ||
      host.includes('127.0.0.1')
    ) {
      return 'homologacao';
    }
  } catch {
    // Fallback
  }

  return 'homologacao';
}

export function isHomologacao(): boolean {
  return getActiveEnvironment() === 'homologacao';
}

export function switchEnvironment(nextEnv: AppEnvironment): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(ENV_SESSION_KEY, nextEnv);
    const url = new URL(window.location.href);
    url.searchParams.set('ambiente', nextEnv);
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
