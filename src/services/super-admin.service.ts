import { api, extractData } from "./api";
import type { AdminAccount, QrCode } from "@/types/super-admin.types";

export const superAdminService = {
  // Admin Management
  getAdmins: async (filters: { page?: number; limit?: number } = {}) => {
    const response = await api.get("/super-admin/admins", { params: filters });
    const result = extractData<
      | AdminAccount[]
      | { items: AdminAccount[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
  },

  createAdmin: async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/super-admin/admins", data);
    return extractData<AdminAccount>(response);
  },

  updateAdmin: async (
    id: string,
    data: { name?: string; email?: string },
  ) => {
    const response = await api.put(`/super-admin/admins/${id}`, data);
    return extractData<AdminAccount>(response);
  },

  deleteAdmin: async (id: string) => {
    const response = await api.delete(`/super-admin/admins/${id}`);
    return extractData<{ message: string }>(response);
  },

  // QR Code Management
  getAllQrCodes: async () => {
    const response = await api.get("/super-admin/qr");
    return extractData<QrCode[]>(response);
  },

  createQrCode: async (
    file: File,
    data: {
      bank_name: string;
      branch?: string;
      upi_id: string;
      account_number: string;
      ifsc_code: string;
      is_active?: boolean;
    },
  ) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("bank_name", data.bank_name);
    if (data.branch) formData.append("branch", data.branch);
    formData.append("upi_id", data.upi_id);
    formData.append("account_number", data.account_number);
    formData.append("ifsc_code", data.ifsc_code);
    if (data.is_active !== undefined)
      formData.append("is_active", String(data.is_active));
    const response = await api.post("/super-admin/qr", formData, {
      headers: { "Content-Type": undefined },
    });
    return extractData<QrCode>(response);
  },

  deleteQrCode: async (qrId: string) => {
    const response = await api.delete(`/super-admin/qr/${qrId}`);
    return extractData<{ message: string }>(response);
  },

  activateQrCode: async (qrId: string) => {
    const response = await api.patch(`/super-admin/qr/${qrId}/activate`);
    return extractData<QrCode>(response);
  },
};
