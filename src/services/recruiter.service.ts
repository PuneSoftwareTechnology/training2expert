import { api, extractData } from './api';
import type { RecruiterShortlist } from '@/types/admin.types';
import type { RecruiterCandidate } from '@/types/student.types';

interface CandidateFilters {
  course?: string;
  city?: string;
  minExperience?: number;
  maxExperience?: number;
  minTechnicalRating?: number;
  minCommunicationRating?: number;
  page?: number;
  limit?: number;
}

export const recruiterService = {
  getCandidates: async (filters: CandidateFilters = {}) => {
    const response = await api.get('/recruiter/candidates', { params: filters });
    return extractData<{ items: RecruiterCandidate[]; courses: string[]; cities: string[]; experienceYears: number[] }>(response);
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

  getShortlist: async () => {
    const response = await api.get('/recruiter/shortlist');
    return extractData<RecruiterShortlist[]>(response);
  },

  sendEmail: async (studentId: string, subject: string, body: string) => {
    const response = await api.post(`/recruiter/candidates/${studentId}/send-email`, { subject, body });
    return extractData<{ message: string }>(response);
  },
};
