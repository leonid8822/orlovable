const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
    generate: async (payload: any) => {
        try {
            const response = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getSettings: async () => {
        try {
            const response = await fetch(`${API_URL}/settings`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    createApplication: async (payload: any) => {
        try {
            const response = await fetch(`${API_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getApplication: async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/applications/${id}`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getHistory: async () => {
        try {
            const response = await fetch(`${API_URL}/history`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    updateApplication: async (id: string, updates: any) => {
        try {
            const response = await fetch(`${API_URL}/applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    listApplications: async (userId?: string) => {
        try {
            const url = userId ? `${API_URL}/applications?user_id=${userId}` : `${API_URL}/applications`;
            const response = await fetch(url);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    updateSettings: async (settings: any) => {
        try {
            const response = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Examples API
    listExamples: async (theme?: string, activeOnly: boolean = false) => {
        try {
            const params = new URLSearchParams();
            if (theme) params.append('theme', theme);
            if (activeOnly) params.append('active_only', 'true');
            const url = `${API_URL}/examples${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    createExample: async (example: any) => {
        try {
            const response = await fetch(`${API_URL}/examples`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(example)
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    updateExample: async (id: string, updates: any) => {
        try {
            const response = await fetch(`${API_URL}/examples/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    deleteExample: async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/examples/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    importApplicationToExample: async (applicationId: string, title?: string, description?: string, theme: string = 'main') => {
        try {
            const response = await fetch(`${API_URL}/examples/import-from-application`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application_id: applicationId, title, description, theme })
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
};
