import axios from 'axios';
import { getToken } from './storage';

// EDIT ME before running on a physical device: axios needs a host your
// phone can actually reach, "localhost" only works from a simulator/emulator
// running on the same machine as the backend.
//   - iOS Simulator            -> http://localhost:5000/api
//   - Android Emulator (AVD)   -> http://10.0.2.2:5000/api
//   - Physical phone + Expo Go -> http://<your-computer's-LAN-IP>:5000/api
//                                 e.g. http://192.168.1.42:5000/api
export const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
