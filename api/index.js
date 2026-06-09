import axios from 'axios';

const BASE_URL = 'https://sweet-patience-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
export { BASE_URL };
