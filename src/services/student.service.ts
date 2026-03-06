import { api, extractData } from './api';
import type { Test } from '@/types/common.types';
import type { StudentProfile, Evaluation, PaymentSummary, CvTemplate, TestAttempt } from '@/types/student.types';
import type { ChangePasswordPayload } from '@/types/user.types';

export const studentService = {
  getProfile: async (): Promise<StudentProfile> => {
    const response = await api.get('/student/profile');
    return extractData<StudentProfile>(response);
  },

  updateProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    const response = await api.put('/student/profile', data);
    return extractData<StudentProfile>(response);
  },

  uploadProfilePhoto: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post('/student/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData<{ url: string }>(response);
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await api.post('/student/change-password', payload);
    return extractData<{ message: string }>(response);
  },

  getPaymentSummary: async (): Promise<PaymentSummary> => {
    const response = await api.get('/student/payments');
    return extractData<PaymentSummary>(response);
  },

  getEvaluations: async (): Promise<Evaluation[]> => {
    const response = await api.get('/student/evaluations');
    return extractData<Evaluation[]>(response);
  },

  getCvTemplates: async (): Promise<CvTemplate[]> => {
    const response = await api.get('/student/cv-templates');
    return extractData<CvTemplate[]>(response);
  },

  uploadCv: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('cv', file);
    const response = await api.post('/student/cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData<{ url: string }>(response);
  },

  getMyCv: async (): Promise<{ url: string } | null> => {
    const response = await api.get('/student/cv');
    return extractData<{ url: string } | null>(response);
  },

  uploadCertificate: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/student/certificate-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData<{ url: string }>(response);
  },

  getAvailableTests: async (): Promise<Test[]> => {
    const response = await api.get('/student/tests');
    return extractData<Test[]>(response);
  },

  getTestById: async (testId: string): Promise<Test> => {
    const response = await api.get(`/student/tests/${testId}`);
    return extractData<Test>(response);
  },

  submitTest: async (attempt: TestAttempt): Promise<{ score: number }> => {
    const response = await api.post(`/student/tests/${attempt.testId}/submit`, attempt);
    return extractData<{ score: number }>(response);
  },

  getTestAttempts: async (): Promise<TestAttempt[]> => {
    const response = await api.get('/student/test-attempts');
    return extractData<TestAttempt[]>(response);
  },
};
