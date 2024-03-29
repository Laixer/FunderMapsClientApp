
import axios from 'axios';

// Auth service
import { authHeader } from 'service/auth';

// Do not leak config into global axios instance
const Axios = axios.create();

/**
 * Config
 */
Axios.defaults.timeout = process.env.timeout || 30000;
Axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL
Axios.defaults.headers.common = Object.assign(
  Axios.defaults.headers.common,
  {
    'Content-type': 'application/json'
  }
);

Axios.interceptors.request.use(function (config) {

  // Add the authentication header, if available
  config.headers = Object.assign(
    config.headers,
    authHeader()
  );

  return config;
}, function (error) {
  // Do something with request error
  return Promise.reject(error);
});

export default Axios;