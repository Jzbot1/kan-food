// Typed API client for the Shipbite backend
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getToken = () => localStorage.getItem('shipbite_token');

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error || 'Request failed' };
    return { data: json as T, error: null };
  } catch (err) {
    return { data: null, error: 'Network error — is the backend running on port 4000?' };
  }
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; phone: string; password: string; role: string }) =>
    request<{ token: string; user: any }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request<any>('/api/auth/me', {}),

  // Restaurants
  getRestaurants: () => request<any[]>('/api/restaurants', {}),
  getMyRestaurants: () => request<any[]>('/api/restaurants/mine', {}),
  getPendingRestaurants: () => request<any[]>('/api/restaurants/pending', {}),
  applyRestaurant: (body: any) =>
    request<any>('/api/restaurants', { method: 'POST', body: JSON.stringify(body) }),
  approveRestaurant: (id: string) =>
    request<any>(`/api/restaurants/${id}/approve`, { method: 'PUT' }),
  addMenuItem: (restaurantId: string, body: any) =>
    request<any>(`/api/restaurants/${restaurantId}/menu`, { method: 'POST', body: JSON.stringify(body) }),

  // Orders
  placeOrder: (body: any) =>
    request<any>('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrders: () => request<any[]>('/api/orders/mine', {}),
  getRestaurantOrders: (restaurantId: string) =>
    request<any[]>(`/api/orders/restaurant/${restaurantId}`, {}),
  getDriverOrders: () => request<any[]>('/api/orders/driver', {}),
  getAvailableOrders: () => request<any[]>('/api/orders/available', {}),
  updateOrderStatus: (orderId: string, body: { status: string; otp?: string; driverId?: string }) =>
    request<any>(`/api/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Users
  getProfile: () => request<any>('/api/users/me', {}),
  updateProfile: (body: any) =>
    request<any>('/api/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  getAddresses: () => request<any[]>('/api/users/addresses', {}),
  addAddress: (body: any) =>
    request<any>('/api/users/addresses', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress: (id: string, body: any) =>
    request<any>(`/api/users/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAddress: (id: string) =>
    request<any>(`/api/users/addresses/${id}`, { method: 'DELETE' }),
  topupWallet: (amount: number) =>
    request<any>('/api/users/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) }),

  // Admin
  getAdminStats: () => request<any>('/api/admin/stats', {}),
  getSubscriptionPlans: () => request<any[]>('/api/admin/subscription-plans', {}),
  createSubscriptionPlan: (body: any) =>
    request<any>('/api/admin/subscription-plans', { method: 'POST', body: JSON.stringify(body) }),
  updateSubscriptionPlan: (id: string, body: any) =>
    request<any>(`/api/admin/subscription-plans/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSubscriptionPlan: (id: string) =>
    request<any>(`/api/admin/subscription-plans/${id}`, { method: 'DELETE' }),
  getAuditLogs: () => request<any[]>('/api/admin/audit-logs', {}),
  getSupportTickets: () => request<any[]>('/api/admin/support-tickets', {}),
  getAllUsers: () => request<any[]>('/api/admin/users', {}),
  getAllDrivers: () => request<any[]>('/api/admin/drivers', {}),

  // Global Categories
  getCategories: () => request<any[]>('/api/categories', {}),
  createCategory: (body: { name: string; description?: string }) =>
    request<any>('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: { name: string; description?: string }) =>
    request<any>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id: string) =>
    request<any>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Drivers
  getDriverProfile: () => request<any>('/api/drivers/me', {}),
  toggleOnline: (isOnline: boolean) =>
    request<any>('/api/drivers/online', { method: 'PUT', body: JSON.stringify({ isOnline }) }),
  updateLocation: (lat: number, lng: number) =>
    request<any>('/api/drivers/location', { method: 'PUT', body: JSON.stringify({ lat, lng }) }),
  acceptOrder: (orderId: string) =>
    request<any>(`/api/drivers/orders/${orderId}/accept`, { method: 'POST' }),
};

export const setAuthToken = (token: string) => localStorage.setItem('shipbite_token', token);
export const clearAuthToken = () => localStorage.removeItem('shipbite_token');
export const hasAuthToken = () => !!localStorage.getItem('shipbite_token');
