import { api, extractData } from './api';
import type { RecruiterCandidate, RecruiterShortlist } from '@/types/student.types';

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
    return extractData<{ items: RecruiterCandidate[]; total: number; page: number; totalPages: number }>(response);
  },

  downloadCv: async (studentId: string): Promise<Blob> => {
    const response = await api.get(`/recruiter/candidates/${studentId}/cv`, { responseType: 'blob' });
    return response.data as Blob;
  },

  getDownloadCount: async (): Promise<{ used: number; limit: number }> => {
    const response = await api.get('/recruiter/download-count');
    return extractData<{ used: number; limit: number }>(response);
  },

  shortlistCandidate: async (studentId: string) => {
    const response = await api.post(`/recruiter/candidates/${studentId}/shortlist`);
    return extractData<{ message: string }>(response);
  },

  removeShortlist: async (studentId: string) => {
    const response = await api.delete(`/recruiter/candidates/${studentId}/shortlist`);
    return extractData<{ message: string }>(response);
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
