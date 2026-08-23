import { api, extractData } from "./api";
import type {
  Trainer,
  TrainerWithStats,
  TrainerDetailResult,
  TrainerPayoutListResult,
  TrainerPayoutUpdate,
} from "@/types/trainer.types";

export interface TrainerPayoutFilters {
  page?: number;
  limit?: number;
  trainerId?: string;
  institute?: string;
  course?: string;
  batch?: string;
  completionStatus?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

/**
 * Trainer reads live on /admin (any admin can populate the dropdown); writes
 * live on /super-admin. Same split master courses already use — see
 * constants/access.ts and the backend's docs/trainer-payouts.md.
 */
export const trainerService = {
  /** Trainer list for dropdowns. Reachable by admins as well as super admins. */
  getTrainers: async (
    filters: { isActive?: boolean; search?: string; course?: string } = {},
  ) => {
    const response = await api.get("/admin/trainers", { params: filters });
    return extractData<Trainer[]>(response);
  },

  /** Management list — carries enrollment counts, so super admin only. */
  getTrainersWithStats: async (
    filters: { isActive?: boolean; search?: string } = {},
  ) => {
    const response = await api.get("/super-admin/trainers", {
      params: filters,
    });
    return extractData<TrainerWithStats[]>(response);
  },

  createTrainer: async (data: {
    name: string;
    courses?: string[];
    note?: string | null;
    isActive?: boolean;
    /** Set once the user confirms a same-name trainer is a different person. */
    confirmDuplicate?: boolean;
  }) => {
    const response = await api.post("/super-admin/trainers", data);
    return extractData<Trainer>(response);
  },

  updateTrainer: async (
    id: string,
    data: {
      name?: string;
      courses?: string[];
      note?: string | null;
      isActive?: boolean;
    },
  ) => {
    const response = await api.patch(`/super-admin/trainers/${id}`, data);
    return extractData<Trainer>(response);
  },

  deleteTrainer: async (id: string) => {
    const response = await api.delete(`/super-admin/trainers/${id}`);
    return extractData<{ id: string }>(response);
  },

  /** Folds the losers into the survivor. Repoints enrollments and payouts. */
  mergeTrainers: async (survivorId: string, loserIds: string[]) => {
    const response = await api.post("/super-admin/trainers/merge", {
      survivorId,
      loserIds,
    });
    return extractData<{
      survivor: Trainer;
      enrollmentsMoved: number;
      payoutsMoved: number;
      deleted: number;
    }>(response);
  },

  getTrainerPayouts: async (filters: TrainerPayoutFilters = {}) => {
    const response = await api.get("/admin/trainer-payouts", {
      params: filters,
    });
    return extractData<TrainerPayoutListResult>(response);
  },

  /** Keyed on the enrollment — the payout row is created on first edit. */
  updateTrainerPayout: async (
    enrollmentId: string,
    data: TrainerPayoutUpdate,
  ) => {
    const response = await api.patch(
      `/admin/trainer-payouts/${enrollmentId}`,
      data,
    );
    return extractData<unknown>(response);
  },

  /**
   * Clears the recorded payment for one row. The enrollment is untouched, so the
   * row reappears with nothing recorded against it.
   */
  clearTrainerPayout: async (enrollmentId: string) => {
    const response = await api.delete(
      `/admin/trainer-payouts/${enrollmentId}`,
    );
    return extractData<{ cleared: boolean; enrollmentId: string }>(response);
  },

  getTrainerDetail: async (
    trainerId: string,
    filters: { page?: number; limit?: number } = {},
  ) => {
    const response = await api.get(`/admin/trainers/${trainerId}/payouts`, {
      params: filters,
    });
    return extractData<TrainerDetailResult>(response);
  },
};
