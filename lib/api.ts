const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const shouldUseProxy = () => {
  return process.env.NEXT_PUBLIC_USE_PROXY === "true";
};

const resolveRequestUrl = (endpoint: string) => {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  if (shouldUseProxy()) {
    return {
      url: `/api/proxy${normalizedEndpoint}`,
      isExternal: false,
    };
  }

  if (!API_BASE_URL) {
    throw new Error(
      "لم يتم تهيئة عنوان واجهة البرمجة الصحيح (NEXT_PUBLIC_API_URL)"
    );
  }

  let backendPath = normalizedEndpoint;
  if (API_BASE_URL.endsWith("/api") && normalizedEndpoint.startsWith("/api/")) {
    backendPath = normalizedEndpoint.replace(/^\/api/, "");
  }

  return {
    url: `${API_BASE_URL}${backendPath}`,
    isExternal: true,
  };
};

const apiClient = {
  async post(endpoint: string, data: any) {
    const { url, isExternal } = resolveRequestUrl(endpoint);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["x-auth-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "حدث خطأ");
    }

    return response.json();
  },

  async patch(endpoint: string, data: any) {
    const { url } = resolveRequestUrl(endpoint);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["x-auth-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "حدث خطأ");
    }

    return response.json();
  },

  async put(endpoint: string, data: any) {
    const { url } = resolveRequestUrl(endpoint);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["x-auth-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "حدث خطأ");
    }

    return response.json();
  },

  async get(endpoint: string, params?: any, options?: { skipAuthRedirect?: boolean }) {
    try {
      const { url, isExternal } = resolveRequestUrl(endpoint);
      const urlInstance = isExternal
        ? new URL(url)
        : new URL(url, window.location.origin);

      if (params) {
        Object.keys(params).forEach((key) =>
          urlInstance.searchParams.append(key, params[key])
        );
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["x-auth-token"] = token;
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(urlInstance.toString(), {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            // فقط أعد التوجيه إذا لم يتم طلب تخطي إعادة التوجيه
            if (!options?.skipAuthRedirect) {
              // تأكد من أننا لسنا في صفحة login بالفعل
              if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
              }
            }
          }
          throw new Error("غير مصرح");
        }

        try {
          const error = await response.json();
          throw new Error(error.error || error.message || "حدث خطأ");
        } catch (e) {
          throw new Error("حدث خطأ في الاتصال بالخادم");
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("استجابة غير صالحة من الخادم");
      }

      return response.json();
    } catch (error: any) {
      if (
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("Load failed"))
      ) {
        throw new Error(
          "فشل الاتصال بالخادم. تأكد من أن الخادم يعمل وأن عنوان API صحيح."
        );
      }
      throw error;
    }
  },

  async getDirect(endpoint: string, params?: any) {
    try {
      const { url, isExternal } = resolveRequestUrl(endpoint);
      const urlInstance = isExternal
        ? new URL(url)
        : new URL(url, window.location.origin);

      if (params) {
        Object.keys(params).forEach((key) =>
          urlInstance.searchParams.append(key, params[key])
        );
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["x-auth-token"] = token;
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(urlInstance.toString(), {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
          throw new Error("غير مصرح");
        }

        try {
          const error = await response.json();
          throw new Error(error.error || error.message || "حدث خطأ");
        } catch (e) {
          throw new Error("حدث خطأ في الاتصال بالخادم");
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("استجابة غير صالحة من الخادم");
      }

      return response.json();
    } catch (error: any) {
      if (
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("Load failed"))
      ) {
        throw new Error(
          "فشل الاتصال بالخادم. تأكد من أن الخادم يعمل وأن عنوان API صحيح."
        );
      }
      throw error;
    }
  },

  async delete(endpoint: string) {
    const { url } = resolveRequestUrl(endpoint);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["x-auth-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as any).error || (error as any).message || "حدث خطأ"
      );
    }

    // Some DELETE endpoints may return empty body
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : { success: true };
    } catch {
      return { success: true };
    }
  },
};

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post("/api/auth/login", { email, password }),
  register: (data: any) => apiClient.post("/api/auth/register", data),
  logout: () => apiClient.post("/api/auth/logout", {}),
};

export const employeeAuthAPI = {
  login: (email: string, password: string) =>
    apiClient.post("/api/auth/employee-login", { email, password }),
};

export const dashboardAPI = {
  getStats: async (options?: { skipAuthRedirect?: boolean }) => {
    return apiClient.get("/api/admin/stats", undefined, options);
  },
  getUsers: (params?: any) => apiClient.get("/api/admin/users", params),
  getCarrierStats: (params?: any) =>
    apiClient.get("/api/admin/carriers/stats", params),
  getRecentActivity: (params?: any) =>
    apiClient.get("/api/admin/activity", params),
};

export const usersAPI = {
  getAll: (params?: any) => apiClient.get("/api/admin/users", params),
  getById: (id: string) => apiClient.get(`/api/customer/users/${id}`),
  create: (data: any) => apiClient.post("/api/customer/users", data),
  update: (id: string, data: any) =>
    apiClient.post(`/api/customer/users/${id}`, data),
  delete: (id: string) => apiClient.post(`/api/customer/users/${id}`, {}),
  updateStatus: (id: string, status: string) =>
    apiClient.post(`/api/customer/users/${id}/status`, { status }),
};

export const ordersAPI = {
  getAll: (params?: any) => apiClient.get("/api/order", params),
  getById: (id: string) => apiClient.get(`/api/order/${id}`),
  create: (data: any) => apiClient.post("/api/order", data),
  update: (id: string, data: any) => apiClient.post(`/api/order/${id}`, data),
  delete: (id: string) => apiClient.post(`/api/order/${id}`, {}),
  updateStatus: (id: string, status: string) =>
    apiClient.post(`/api/order/${id}/status`, { status }),
};

export const shipmentsAPI = {
  getAll: (params?: any) => apiClient.get("/api/shipment", params),
  getById: (id: string) => apiClient.get(`/api/shipment/${id}`),
  create: (data: any) => apiClient.post("/api/shipment", data),
  update: (id: string, data: any) =>
    apiClient.post(`/api/shipment/${id}`, data),
  delete: (id: string) => apiClient.post(`/api/shipment/${id}`, {}),
  updateStatus: (id: string, status: string) =>
    apiClient.post(`/api/shipment/${id}/status`, { status }),
  track: (trackingNumber: string) =>
    apiClient.get(`/api/shipment/track/${trackingNumber}`),
};

export const adminShipmentsAPI = {
  getAll: (params?: any) => apiClient.get("/api/admin/shipments", params),
  updateStatus: (id: string, status: string, notes?: string) =>
    apiClient.patch(`/api/admin/shipments/${id}/status`, {
      status,
      ...(notes ? { notes } : {}),
    }),
};

export const adminInvoicesAPI = {
  getAll: (params?: any) => apiClient.get("/api/admin/invoices", params),
};

export const adminOrdersAPI = {
  getAll: (params?: any) => apiClient.get("/api/admin/orders", params),
};

export const adminPlatformsAPI = {
  getAll: (params?: any) => apiClient.get("/api/admin/platforms", params),
  updateSettings: (id: string, data: any) =>
    apiClient.put(`/api/admin/platforms/${id}/settings`, data),
  disconnect: (id: string) =>
    apiClient.post(`/api/admin/platforms/${id}/disconnect`, {}),
  syncAll: () => apiClient.post("/api/admin/platforms/sync-all", {}),
};

export const adminWalletsAPI = {
  getPendingTransfers: (params?: any) =>
    apiClient.get("/api/admin/wallets/pending-transfers", params),
  getTransfers: (params?: any) =>
    apiClient.get("/api/admin/wallets/transfers", params),
  approveBankTransfer: (
    transactionId: string,
    payload: { approved: boolean; notes?: string }
  ) =>
    apiClient.put(
      `/api/admin/wallets/approve-bank-transfer/${transactionId}`,
      payload
    ),
  getUserWallet: (userId: string) =>
    apiClient.get(`/api/admin/users/${userId}/wallet`),
  addBalanceToUser: (
    userId: string,
    payload: { amount: number; description?: string }
  ) => apiClient.post(`/api/admin/wallets/${userId}/add-balance`, payload),
  subtractBalanceFromUser: (
    userId: string,
    payload: { amount: number; description?: string }
  ) => apiClient.post(`/api/admin/wallets/${userId}/subtract-balance`, payload),
};

export const adminEmployeesAPI = {
  getAll: (params?: any) => apiClient.get("/api/admin/employees", params),
  getStats: (params?: any) =>
    apiClient.get("/api/admin/employees/stats", params),
  getById: (id: string) => apiClient.get(`/api/admin/employees/${id}`),
  create: (data: any) => apiClient.post("/api/admin/employees", data),
  update: (id: string, data: any) =>
    apiClient.put(`/api/admin/employees/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/admin/employees/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/api/admin/employees/${id}/status`, { status }),
  updatePermissions: (id: string, permissions: string[]) =>
    apiClient.patch(`/api/admin/employees/${id}/permissions`, { permissions }),
  updatePayroll: (
    id: string,
    payload: {
      baseSalary?: number;
      bonuses?: number;
      deductions?: number;
      lastPayment?: string;
      paymentStatus?: string;
    }
  ) => apiClient.patch(`/api/admin/employees/${id}/payroll`, payload),
  updateAttendance: (
    id: string,
    payload: {
      present?: number;
      absent?: number;
      late?: number;
      onTime?: number;
      totalDays?: number;
    }
  ) => apiClient.patch(`/api/admin/employees/${id}/attendance`, payload),
};

export const walletsAPI = {
  getAll: (params?: any) => apiClient.get("/api/wallet", params),
  getByCustomerId: (customerId: string) =>
    apiClient.get(`/api/wallet/customer/${customerId}`),
  addBalance: (customerId: string, amount: number, description: string) =>
    apiClient.post("/api/wallet/add", { customerId, amount, description }),
  deductBalance: (customerId: string, amount: number, description: string) =>
    apiClient.post("/api/wallet/deduct", { customerId, amount, description }),
  getTransactions: (walletId: string, params?: any) =>
    apiClient.get(`/api/wallet/${walletId}/transactions`, params),
};

export const transactionsAPI = {
  getAll: (params?: any) => apiClient.get("/api/transactions", params),
  getById: (id: string) => apiClient.get(`/api/transactions/${id}`),
  approve: (id: string) =>
    apiClient.post(`/api/transactions/${id}/approve`, {}),
  reject: (id: string) => apiClient.post(`/api/transactions/${id}/reject`, {}),
};

export const announcementsAPI = {
  getAll: (params?: any) => apiClient.get("/api/announcements", params),
  getById: (id: string) => apiClient.get(`/api/announcements/${id}`),
  create: (data: any) => apiClient.post("/api/announcements", data),
  update: (id: string, data: any) =>
    apiClient.put(`/api/announcements/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/announcements/${id}`),
  toggle: (id: string) =>
    apiClient.patch(`/api/announcements/${id}/toggle`, {}),
  sendEmails: (
    id: string,
    data: { all?: boolean; recipientIds?: string[]; recipients?: string[] }
  ) => apiClient.post(`/api/announcements/${id}/send`, data),
};

export const notificationsAPI = {
  getMy: (params?: any) =>
    apiClient.get("/api/notifications/getMynotification", params),
  markAsRead: (id: string) =>
    apiClient.put(`/api/notifications/${id}/read`, {}),
  unreadCount: () => apiClient.get("/api/notifications/unread-count"),
};

export const adminNotificationsAPI = {
  getAll: (params?: any) =>
    apiClient.get("/api/notifications/admin/all", params),
  create: (data: {
    type: string;
    message: string;
    title?: string;
    customerId?: string;
  }) => apiClient.post("/api/notifications", data),
  delete: (id: string) => apiClient.delete(`/api/notifications/${id}`),
};

export const couponsAPI = {
  getAll: (params?: any) => apiClient.get("/api/coupons", params),
  getById: (id: string) => apiClient.get(`/api/coupons/${id}`),
  create: (data: any) => apiClient.post("/api/coupons", data),
  update: (id: string, data: any) => apiClient.post(`/api/coupons/${id}`, data),
  delete: (id: string) => apiClient.post(`/api/coupons/${id}`, {}),
};

export const shippingCompaniesAPI = {
  getAll: (params?: any) => apiClient.get("/api/shipmentcompany", params),
  getById: (id: string) => apiClient.get(`/api/shipmentcompany/${id}`),
  create: (data: any) => apiClient.post("/api/shipmentcompany", data),
  update: (id: string, data: any) =>
    apiClient.put(`/api/shipmentcompany/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/shipmentcompany/${id}`),
};

export const packagesAPI = {
  getAll: (params?: any) => apiClient.get("/api/package", params),
  getById: (id: string) => apiClient.get(`/api/package/${id}`),
  create: (data: any) => apiClient.post("/api/package", data),
  update: (id: string, data: any) => apiClient.post(`/api/package/${id}`, data),
  delete: (id: string) => apiClient.post(`/api/package/${id}`, {}),
};

export const citiesAPI = {
  search: (query: string) => apiClient.get("/api/cities/search", { q: query }),
  getAll: () => apiClient.get("/api/cities"),
};

export const addressesAPI = {
  getAll: (params?: any) => apiClient.get("/api/addresses", params),
  getById: (id: string) => apiClient.get(`/api/addresses/${id}`),
  create: (data: any) => apiClient.post("/api/addresses", data),
  update: (id: string, data: any) =>
    apiClient.post(`/api/addresses/${id}`, data),
  delete: (id: string) => apiClient.post(`/api/addresses/${id}`, {}),
};

export const platformsAPI = {
  salla: {
    connect: (data: any) => apiClient.post("/api/salla/connect", data),
    disconnect: () => apiClient.post("/api/salla/disconnect", {}),
    getOrders: () => apiClient.get("/api/salla/orders"),
    syncOrders: () => apiClient.post("/api/salla/sync-orders", {}),
  },
  shopify: {
    connect: (data: any) => apiClient.post("/api/shopify/connect", data),
    disconnect: () => apiClient.post("/api/shopify/disconnect", {}),
    getOrders: () => apiClient.get("/api/shopify/orders"),
    syncOrders: () => apiClient.post("/api/shopify/sync-orders", {}),
  },
  zid: {
    connect: (data: any) => apiClient.post("/api/zid/connect", data),
    disconnect: () => apiClient.post("/api/zid/disconnect", {}),
    getOrders: () => apiClient.get("/api/zid/orders"),
    syncOrders: () => apiClient.post("/api/zid/sync-orders", {}),
  },
  woocommerce: {
    connect: (data: any) => apiClient.post("/api/woocommerce/connect", data),
    disconnect: () => apiClient.post("/api/woocommerce/disconnect", {}),
    getOrders: () => apiClient.get("/api/woocommerce/orders"),
    syncOrders: () => apiClient.post("/api/woocommerce/sync-orders", {}),
  },
};
