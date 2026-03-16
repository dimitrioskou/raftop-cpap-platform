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

export async function getFollowUpPatients(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/patients${query}`);
}

export async function getPriorityQueue(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/priority-queue${query}`);
}

export async function getDailyBoard(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/daily-board${query}`);
}

export async function getRecoveryFunnel(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/recovery-funnel${query}`);
}

export async function createDailyBoardTasks(payload = {}) {
  return request('/followup/daily-board/create-tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createFollowUpTask(payload = {}) {
  return request('/followup/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createFollowUpBundle(payload = {}) {
  return request('/followup/tasks/bundle', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createCriticalFollowUpTasks(payload = {}) {
  return request('/followup/tasks/critical', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getFollowUpOutcomes(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/outcomes${query}`);
}

export async function getAllFollowUpOutcomes(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/outcomes/all${query}`);
}

export async function getFollowUpOutcomesSummary(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/outcomes/summary${query}`);
}

export async function createFollowUpOutcome(payload = {}) {
  return request('/followup/outcomes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createFollowUpNote(payload = {}) {
  return request('/followup/notes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getAllFollowUpNotes(params = {}) {
  const query = buildQuery(params);
  return request(`/followup/notes${query}`);
}

export async function getFollowUpNotesByPatient(patientId) {
  if (!patientId) throw new Error('patientId is required');
  return request(`/followup/notes/patient/${patientId}`);
}

export async function getAllFollowUpOutcomesByPatient(patientId) {
  if (!patientId) throw new Error('patientId is required');
  return request(`/followup/outcomes/patient/${patientId}`);
}

export async function getFollowUpPatientProfile(patientId) {
  if (!patientId) throw new Error('patientId is required');
  return request(`/followup/patient/${patientId}`);
}

export async function updateFollowUpTask(taskId, payload = {}) {
  if (!taskId) throw new Error('taskId is required');

  return request(`/followup/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteFollowUpTask(taskId) {
  if (!taskId) throw new Error('taskId is required');

  return request(`/followup/tasks/${taskId}`, {
    method: 'DELETE'
  });
}

export async function runFollowUpEngine(payload = {}) {
  return request('/followup/run-engine', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}