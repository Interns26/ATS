/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

export const TOKEN_STORAGE_KEY = "ats:token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
