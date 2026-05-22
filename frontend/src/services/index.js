import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/me', data);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};

export const clientService = {
  createClient: async (data) => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  getClients: async (params) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  getClient: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  updateClient: async (id, data) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  deleteClient: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  getClientStats: async () => {
    const response = await api.get('/clients/stats');
    return response.data;
  },
};

export const leadService = {
  createLead: async (data) => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  getLeads: async (params) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  getLead: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  updateLead: async (id, data) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  convertLead: async (id, data) => {
    const response = await api.post(`/leads/${id}/convert`, data);
    return response.data;
  },

  getLeadStats: async () => {
    const response = await api.get('/leads/stats');
    return response.data;
  },
};

export const taskService = {
  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  getTasks: async (params) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getTaskStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  getTodayTasks: async () => {
    const response = await api.get('/tasks/today');
    return response.data;
  },
};

export const noteService = {
  createNote: async (data) => {
    const response = await api.post('/notes', data);
    return response.data;
  },

  getNotes: async (params) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  updateNote: async (id, data) => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },

  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  getActivityFeed: async (params) => {
    const response = await api.get('/notes/activity/feed', { params });
    return response.data;
  },
};

export const dashboardService = {
  getDashboardStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  getUserDashboard: async () => {
    const response = await api.get('/dashboard/user');
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/dashboard/reports');
    return response.data;
  },
};
