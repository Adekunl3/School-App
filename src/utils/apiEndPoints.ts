// app/utils/apiEndpoints.ts

import { API_BASE_URL, TOKEN } from "@/lib/api";


// export const getStudentApi = (page: number, size: number) =>
//   `${API_API_BASE_URL}/GetStudents/${TOKEN}?Pagination.Page=${page}&Pagination.ItemsPerPage=${size}`;

// export const getTeacherApi = (page: number, size: number) =>
//   `${API_API_BASE_URL}/GetTeachers/${TOKEN}?Pagination.Page=${page}&Pagination.ItemsPerPage=${size}`;

// export const getParentApi = (page: number, size: number) =>
//   `${API_API_BASE_URL}/GetParents/${TOKEN}?Pagination.Page=${page}&Pagination.ItemsPerPage=${size}`;

// export const getStaffApi = (page: number, size: number) =>
//   `${API_API_BASE_URL}/GetStaff/${TOKEN}?Pagination.Page=${page}&Pagination.ItemsPerPage=${size}`;

// // Example reusable pattern for ANY module:
// export const getPaginatedApi = (module: string, page: number, size: number) =>
//   `${API_API_BASE_URL}/${module}/${TOKEN}?Pagination.Page=${page}&Pagination.ItemsPerPage=${size}`;




export const endpoints = {
  students: `/Teachers`,
  login: `/Auth/login`,
  teachers: `/Teachers`,
  teacher: (id: string) => `/Teachers/${id}`,
//   parents: `/GetPayments/${TOKEN}`,
//   staff: `/GetPayments/${TOKEN}`,
};

// Generic pattern (optional)
export const paginated = (url: string, page = 1, size = 1) =>
  `${url}?Pagination.Page=${page}&Pagination.ItemsPerPage=${size}`;
