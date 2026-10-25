const API_BASE_URL = 'http://localhost:3001/api';

function getAuthToken() {
  return localStorage.getItem('sutra_token');
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => request('/auth/me'),
    bootstrapAdmin: (data) => request('/auth/bootstrap-admin', { method: 'POST', body: JSON.stringify(data) }),
    getUsers: () => request('/auth/users'),
  },

  // Dashboard
  dashboard: {
    getStats: () => request('/dashboard/stats'),
  },

  // Departments
  departments: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/departments${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/departments/${id}`),
    create: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
  },

  // Projects
  projects: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/projects${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/projects/${id}`),
    create: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  },

  // Conflicts
  conflicts: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/conflicts${query ? `?${query}` : ''}`);
    },
    scan: (options = {}) => request('/conflicts/scan', { method: 'POST', body: JSON.stringify(options) }),
    resolve: (id, data) => request(`/conflicts/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
    createCoordination: (id) => request(`/conflicts/${id}/coordination`, { method: 'POST' }),
  },

  // Resources
  resources: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/resources${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/resources/${id}`),
    create: (data) => request('/resources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getRequests: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/resources/requests/all${query ? `?${query}` : ''}`);
    },
    createRequest: (resourceId, data) => request(`/resources/${resourceId}/request`, { method: 'POST', body: JSON.stringify(data) }),
    updateRequestStatus: (requestId, data) => request(`/resources/requests/${requestId}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Discussions
  discussions: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/discussions${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/discussions/${id}`),
    create: (data) => request('/discussions', { method: 'POST', body: JSON.stringify(data) }),
    reply: (id, data) => request(`/discussions/${id}/replies`, { method: 'POST', body: JSON.stringify(data) }),
  },
};
