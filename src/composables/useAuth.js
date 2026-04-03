import { ref, readonly } from 'vue';

const user = ref(null);       // { id, username, avatarUrl, isAdmin, tree: { id, slug, title } | null }
const token = ref(null);      // JWT string
const isLoading = ref(false);

const API_BASE = import.meta.env.PROD ? '/tree/api' : 'http://localhost:3000/api';

// 从 localStorage 恢复
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  token.value = savedToken;
}

async function fetchMe() {
  if (!token.value) { user.value = null; return; }
  isLoading.value = true;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token.value}` }
    });
    if (res.ok) {
      user.value = await res.json();
    } else {
      logout();
    }
  } catch (err) {
    console.error('Auth check failed:', err);
  } finally {
    isLoading.value = false;
  }
}

function setToken(newToken) {
  token.value = newToken;
  localStorage.setItem('auth_token', newToken);
}

function logout() {
  token.value = null;
  user.value = null;
  localStorage.removeItem('auth_token');
}

function getAuthHeaders() {
  if (!token.value) return {};
  return { Authorization: `Bearer ${token.value}` };
}

function getApiBase() {
  return API_BASE;
}

export function useAuth() {
  return {
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    fetchMe,
    setToken,
    logout,
    getAuthHeaders,
    getApiBase
  };
}
