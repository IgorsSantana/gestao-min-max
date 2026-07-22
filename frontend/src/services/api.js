import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8900`,
});

// O interceptor pode ser configurado no futuro para tratar tokens JWT (Item 6)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Erro na requisição da API:", error);
    return Promise.reject(error);
  }
);

export default api;
