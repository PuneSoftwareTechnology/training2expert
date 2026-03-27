import { api, extractData } from './api';
import type { Test } from '@/types/common.types';
import type { StudentProfile, StudentProfileFull, StartTestResponse, SubmitTestResponse } from '@/types/student.types';
import type { ChangePasswordPayload } from '@/types/user.types';

export const studentService = {
  getProfile: async (): Promise<StudentProfileFull> => {
    const response = await api.get('/student/profile');
    return extractData<StudentProfileFull>(response);
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

  uploadCv: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('cv', file);
    const response = await api.post('/student/cv-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData<{ url: string }>(response);
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

  startTest: async (testId: string): Promise<StartTestResponse> => {
    const response = await api.post(`/student/tests/${testId}/start`);
    return extractData<StartTestResponse>(response);
  },

  submitTest: async (attemptId: string, testId: string, answers: Record<string, number>): Promise<SubmitTestResponse> => {
    const response = await api.post(`/student/tests/${testId}/submit`, { attemptId, answers });
    return extractData<SubmitTestResponse>(response);
  },
};
