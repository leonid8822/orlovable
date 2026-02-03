const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

import { supabase } from '@/integrations/supabase/client';

export const api = {
    // Upload image to Supabase Storage
    uploadImage: async (file: File, bucket: string = 'pendants'): Promise<{ url: string | null; error: any }> => {
        try {
            if (!supabase) {
                return { url: null, error: new Error('Supabase not configured') };
            }

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            // Upload file
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return { url: null, error: uploadError };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { url: publicUrl, error: null };
        } catch (error) {
            console.error('Upload error:', error);
            return { url: null, error };
        }
    },

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
    getHistory: async (limit: number = 100) => {
        try {
            const response = await fetch(`${API_URL}/history?limit=${limit}`);
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
    listApplications: async (userId?: string, limit: number = 100) => {
        try {
            const params = new URLSearchParams();
            if (userId) params.append('user_id', userId);
            params.append('limit', limit.toString());
            const url = `${API_URL}/applications?${params.toString()}`;
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
            if (!response.ok) {
                throw new Error(data.detail || 'Settings update failed');
            }
            return { data, error: null };
        } catch (error) {
            console.error('Settings update error:', error);
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
        phone?: string;
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
    },

    // Admin Clients API
    listClients: async () => {
        try {
            const response = await fetch(`${API_URL}/admin/clients`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getClient: async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/clients/${userId}`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    createInvoice: async (payload: {
        application_id?: string;
        amount: number;
        description: string;
        customer_email: string;
        customer_name?: string;
    }) => {
        try {
            const response = await fetch(`${API_URL}/admin/create-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Invoice creation failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    updateUserAdmin: async (userId: string, isAdmin: boolean) => {
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}/admin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_admin: isAdmin })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Update failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    // Client management
    createClient: async (payload: {
        email: string;
        name?: string;
        first_name?: string;
        last_name?: string;
        telegram_username?: string;
    }) => {
        try {
            const response = await fetch(`${API_URL}/admin/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Create failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    updateClient: async (userId: string, payload: {
        email?: string;
        name?: string;
        first_name?: string;
        last_name?: string;
        telegram_username?: string;
        is_admin?: boolean;
    }) => {
        try {
            const response = await fetch(`${API_URL}/admin/clients/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Update failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    assignClientToApplication: async (appId: string, userId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/applications/${appId}/client`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Assignment failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    searchClients: async (query: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/clients/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Gems management
    getGems: async () => {
        try {
            const response = await fetch(`${API_URL}/gems`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getAdminGems: async () => {
        try {
            const response = await fetch(`${API_URL}/admin/gems`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getGemShapes: async () => {
        try {
            const response = await fetch(`${API_URL}/gems/shapes`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    createGem: async (payload: {
        name: string;
        name_en?: string;
        shape?: string;
        size_mm?: number;
        color: string;
        image_base64?: string;
        remove_background?: boolean;
        bg_tolerance?: number;
        is_active?: boolean;
        sort_order?: number;
    }) => {
        try {
            const response = await fetch(`${API_URL}/admin/gems`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Create failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    updateGem: async (gemId: string, payload: {
        name?: string;
        name_en?: string;
        shape?: string;
        size_mm?: number;
        color?: string;
        image_base64?: string;
        remove_background?: boolean;
        bg_tolerance?: number;
        is_active?: boolean;
        sort_order?: number;
    }) => {
        try {
            const response = await fetch(`${API_URL}/admin/gems/${gemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Update failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    deleteGem: async (gemId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/gems/${gemId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Delete failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Order submission (without payment)
    submitOrder: async (applicationId: string, payload: {
        email: string;
        name?: string;
        phone?: string;
        telegram?: string;
        material: string;
        size: string;
        size_option: string;
        order_comment?: string;
        gems?: any[];
    }) => {
        try {
            const response = await fetch(`${API_URL}/applications/${applicationId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Order submission failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Shop / Products API
    getProducts: async (category?: string, featuredOnly?: boolean) => {
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (featuredOnly) params.append('featured_only', 'true');
            const url = `${API_URL}/products${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    getProduct: async (productId: string) => {
        try {
            const response = await fetch(`${API_URL}/products/${productId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Product not found');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    // Admin Products API
    adminGetProducts: async () => {
        try {
            const response = await fetch(`${API_URL}/admin/products`);
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    adminCreateProduct: async (product: {
        name: string;
        description?: string;
        category?: string;
        image_url: string;
        gallery_urls?: string[];
        price_silver: number;
        price_gold?: number;
        sizes_available?: string[];
        is_available?: boolean;
        is_featured?: boolean;
        display_order?: number;
        slug?: string;
    }) => {
        try {
            const response = await fetch(`${API_URL}/admin/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Create failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    adminUpdateProduct: async (productId: string, updates: Record<string, unknown>) => {
        try {
            const response = await fetch(`${API_URL}/admin/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Update failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },
    adminDeleteProduct: async (productId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/products/${productId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Delete failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    // Orders API
    adminGetOrders: async (params?: { status?: string; limit?: number }) => {
        try {
            const query = new URLSearchParams();
            if (params?.status) query.append('status', params.status);
            if (params?.limit) query.append('limit', params.limit.toString());

            const response = await fetch(`${API_URL}/admin/orders?${query}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Fetch failed');
            }
            return { data: data.data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    adminCreateOrder: async (order: any) => {
        try {
            const response = await fetch(`${API_URL}/admin/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Create failed');
            }
            return { data: data.data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    adminGetOrder: async (orderId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/orders/${orderId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Fetch failed');
            }
            return { data: data.data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    adminUpdateOrder: async (orderId: string, updates: any) => {
        try {
            const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Update failed');
            }
            return { data: data.data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    adminDeleteOrder: async (orderId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Delete failed');
            }
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    adminUpdateOrderStatus: async (orderId: string, statusUpdate: { status: string; comment?: string; changed_by?: string }) => {
        try {
            const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statusUpdate)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Status update failed');
            }
            return { data: data.data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    adminGetOrderHistory: async (orderId: string) => {
        try {
            const response = await fetch(`${API_URL}/admin/orders/${orderId}/history`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Fetch failed');
            }
            return { data: data.data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
};
