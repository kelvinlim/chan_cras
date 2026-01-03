import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8005';

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
    list: async () => {
        const response = await api.get('/events/');
        return response.data;
    },
    create: async (eventData: any) => {
        const response = await api.post('/events/', eventData);
        return response.data;
    },
    update: async (id: string, eventData: any) => {
        const response = await api.patch(`/events/${id}`, eventData);
        return response.data;
    }
};

export default api;
