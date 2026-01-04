import axios from 'axios';

// Use relative path for production/Nginx proxying
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8005'
    : '/cras-api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// In a full implementation, this would be managed by an AuthProvider

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (email: string, password: string) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },
    loginWithGoogle: async (idToken: string) => {
        const response = await api.post('/auth/google/login', { token: idToken });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/users/me');
        return response.data;
    }
};

export const studyService = {
    list: async () => {
        const response = await api.get('/studies/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/studies/', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/studies/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/studies/${id}`);
        return response.data;
    },
    linkSubject: async (studyId: string, subjectId: string) => {
        const response = await api.post(`/studies/${studyId}/subjects/${subjectId}`);
        return response.data;
    },
    unlinkSubject: async (studyId: string, subjectId: string) => {
        const response = await api.delete(`/studies/${studyId}/subjects/${subjectId}`);
        return response.data;
    },
    listSubjects: async (studyId: string) => {
        const response = await api.get(`/studies/${studyId}/subjects`);
        return response.data;
    }
};

export const subjectService = {
    list: async () => {
        const response = await api.get('/subjects/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/subjects/', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/subjects/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/subjects/${id}`);
        return response.data;
    }
};

export const procedureService = {
    list: async () => {
        const response = await api.get('/procedures/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/procedures/', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.patch(`/procedures/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/procedures/${id}`);
        return response.data;
    }
};

export const eventService = {
    list: async () => (await api.get('/events/')).data,
    create: async (data: any) => (await api.post('/events/', data)).data,
    get: async (id: string) => (await api.get(`/events/${id}`)).data,
    update: async (id: string, data: any) => (await api.patch(`/events/${id}`, data)).data,
    delete: async (id: string) => (await api.delete(`/events/${id}`)).data,
};

export const settingsService = {
    list: async () => (await api.get('/settings/')).data,
    update: async (key: string, value: string) => (await api.patch(`/settings/${key}?value=${encodeURIComponent(value)}`)).data,
    getConfig: async () => (await api.get('/settings/config')).data,
};

export const userService = {
    list: async () => (await api.get('/users/')).data,
    create: async (data: any) => (await api.post('/users/', data)).data,
    update: async (id: string, data: any) => (await api.patch(`/users/${id}`, data)).data,
    delete: async (id: string) => (await api.delete(`/users/${id}`)).data,
};

export default api;
