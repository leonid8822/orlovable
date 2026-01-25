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
    },

    // Auth API
    requestCode: async (payload: { email: string; name?: string; application_id?: string; subscribe_newsletter?: boolean }) => {
        try {
            const response = await fetch(`${API_URL}/auth/request-code`, {
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
    requestVerificationCode: async (payload: { email: string; name?: string; application_id?: string; subscribe_newsletter?: boolean }) => {
        try {
            const response = await fetch(`${API_URL}/auth/request-code`, {
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
    verifyCode: async (payload: { email: string; code: string; application_id?: string }) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-code`, {
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

    // User Profile API
    getUserProfile: async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/users/${userId}`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    updateUserProfile: async (userId: string, updates: {
        first_name?: string;
        last_name?: string;
        telegram_username?: string;
        subscribe_newsletter?: boolean;
    }) => {
        try {
            const response = await fetch(`${API_URL}/users/${userId}/profile`, {
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

    // Payment API
    createPayment: async (payload: {
        application_id: string;
        amount: number;
        email?: string;
        name?: string;
        order_comment?: string;
    }) => {
        try {
            const response = await fetch(`${API_URL}/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Payment creation failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getPaymentStatus: async (orderId: string) => {
        try {
            const response = await fetch(`${API_URL}/payments/status/${orderId}`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    listPayments: async (status?: string, limit: number = 50) => {
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            params.append('limit', limit.toString());
            const response = await fetch(`${API_URL}/admin/payments?${params.toString()}`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Admin Auth API
    adminRequestCode: async (email: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/request-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    adminVerifyCode: async (email: string, code: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    verifyAdminSession: async (token: string, email: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/verify-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email })
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    adminLogout: async (email: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Check if user is admin by user_id
    checkAdminStatus: async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/check/${userId}`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
};
