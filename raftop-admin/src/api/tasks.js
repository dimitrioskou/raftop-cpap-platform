const API_BASE =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getTasks(params = {}) {
  const query = buildQuery(params);
  return request(`/tasks${query}`);
}

export async function getTasksOverview(params = {}) {
  const query = buildQuery(params);
  return request(`/tasks/overview${query}`);
}

export async function createTask(payload = {}) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateTask(taskId, payload = {}) {
  if (!taskId) {
    throw new Error('taskId is required');
  }

  return request(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteTask(taskId) {
  if (!taskId) {
    throw new Error('taskId is required');
  }

  return request(`/tasks/${taskId}`, {
    method: 'DELETE'
  });
}