const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('enterprise_access_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Auth request failed');
  }

  return data;
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  return handleResponse(response);
}

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  return handleResponse(response);
}