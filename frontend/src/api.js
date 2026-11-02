const API_BASE = '/api';
const TOKEN_KEY = 'app1_token';
const USER_KEY = 'app1_user';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },

  save: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function request(path, options = {}) {
  const token = auth.getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || `HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  login: (body) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (body) => request('/users', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  updateUser: (id, body) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  deleteUser: (id) => request(`/users/${id}`, {
    method: 'DELETE'
  }),

  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) => request('/products', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  updateProduct: (id, body) => request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  deleteProduct: (id) => request(`/products/${id}`, {
    method: 'DELETE'
  })
};