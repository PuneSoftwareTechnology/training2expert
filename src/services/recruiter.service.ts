import { api, extractData } from './api';
import type { RecruiterShortlist } from '@/types/admin.types';
import type { RecruiterCandidate, StudentProfileFull } from '@/types/student.types';

interface CandidateFilters {
  course?: string;
  city?: string;
  area?: string;
  minExperience?: number;
  maxExperience?: number;
  minTechnicalScore?: number;
  minCommunicationScore?: number;
  shortlistedOnly?: boolean;
  page?: number;
  limit?: number;
}

export const recruiterService = {
  getCandidates: async (filters: CandidateFilters = {}) => {
    const params: Record<string, string | number | undefined> = { ...filters, shortlistedOnly: undefined };
    if (filters.shortlistedOnly) params.shortlistedOnly = 'true';
    const response = await api.get('/recruiter/candidates', { params });
    return extractData<{ items: RecruiterCandidate[]; total: number; page: number; totalPages: number; courses: string[]; cities: string[]; areas: string[]; experienceYears: number[] }>(response);
  },

  downloadCv: async (studentId: string) => {
    const response = await api.get(`/recruiter/candidates/${studentId}/cv`);
    return extractData<{ signedUrl: string; used: number; limit: number; remaining: number }>(response);
  },

  getDownloadCount: async (): Promise<{ used: number; limit: number }> => {
    const response = await api.get('/recruiter/download-count');
    return extractData<{ used: number; limit: number }>(response);
  },

  shortlistCandidate: async ({ studentId, course }: { studentId: string; course: string }) => {
    const response = await api.post(`/recruiter/candidates/${studentId}/shortlist`, { course });
    return extractData<{ message: string }>(response);
  },

  bulkShortlist: async (items: { studentId: string; course: string }[]) => {
    const response = await api.post('/recruiter/candidates/bulk-shortlist', { items });
    return extractData<{ shortlisted: number; skipped: number }>(response);
  },

  removeShortlist: async (studentId: string) => {
    const response = await api.delete(`/recruiter/candidates/${studentId}/shortlist`);
    return extractData<{ message: string }>(response);
  },

  bulkRemoveShortlist: async (studentIds: string[]) => {
    const response = await api.post('/recruiter/candidates/bulk-remove-shortlist', { studentIds });
    return extractData<{ removed: number }>(response);
  },

  getShortlist: async (filters: { page?: number; limit?: number } = {}) => {
    const response = await api.get('/recruiter/shortlist', { params: filters });
    const result = extractData<
      | RecruiterShortlist[]
      | { items: RecruiterShortlist[]; total: number; page: number; totalPages: number }
    >(response);
    if (Array.isArray(result)) {
      return { items: result, total: result.length, page: 1, totalPages: 1 };
    }
    return result;
  },

  sendEmail: async (studentId: string, subject: string, body: string) => {
    const response = await api.post(`/recruiter/candidates/${studentId}/send-email`, { subject, body });
    return extractData<{ message: string }>(response);
  },

  bulkSendEmail: async (studentIds: string[], subject: string, body: string) => {
    const response = await api.post('/recruiter/candidates/bulk-send-email', { studentIds, subject, body });
    return extractData<{ sent: number; failed: number; total: number }>(response);
  },

  getStudentProfile: async (studentId: string) => {
    const response = await api.get(`/recruiter/students/${studentId}/profile`);
    return extractData<StudentProfileFull>(response);
  },
};
