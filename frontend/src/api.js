import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT (if we have one) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, clear it so the app falls back to
// the login page on the next render.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}

export const authApi = {
  register: (payload) =>
    api.post("/api/auth/register", payload).catch((err) => {
      throw new Error(extractErrorMessage(err, "registration failed"));
    }),
  login: (payload) =>
    api.post("/api/auth/login", payload).catch((err) => {
      throw new Error(extractErrorMessage(err, "login failed"));
    }),
  me: () =>
    api.get("/api/auth/me").catch((err) => {
      throw new Error(extractErrorMessage(err, "could not load profile"));
    }),
};

export const salesApi = {
  add: (payload) =>
    api.post("/api/sales", payload).catch((err) => {
      throw new Error(extractErrorMessage(err, "could not save sale"));
    }),
  list: (params) =>
    api.get("/api/sales", { params }).catch((err) => {
      throw new Error(extractErrorMessage(err, "could not load sales"));
    }),
  update: (id, payload) =>
    api.put(`/api/sales/${id}`, payload).catch((err) => {
      throw new Error(extractErrorMessage(err, "could not update sale"));
    }),
  remove: (id) =>
    api.delete(`/api/sales/${id}`).catch((err) => {
      throw new Error(extractErrorMessage(err, "could not delete sale"));
    }),
};

export const reportsApi = {
  summary: () =>
    api.get("/api/reports/summary").catch((err) => {
      throw new Error(extractErrorMessage(err, "could not load summary"));
    }),
  byCategory: () =>
    api.get("/api/reports/by-category").catch((err) => {
      throw new Error(extractErrorMessage(err, "could not load category breakdown"));
    }),
  trend: (months = 6) =>
    api.get("/api/reports/trend", { params: { months } }).catch((err) => {
      throw new Error(extractErrorMessage(err, "could not load trend"));
    }),
  topProducts: (limit = 5) =>
    api.get("/api/reports/top-products", { params: { limit } }).catch((err) => {
      throw new Error(extractErrorMessage(err, "could not load top products"));
    }),
};

export default api;
