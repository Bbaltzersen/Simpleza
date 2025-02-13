import axios from 'axios';
import https from 'https';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const certPath = process.env.CERT_PATH || '@/certs/cert.pem';

const httpsAgent = isProduction
  ? new https.Agent({
      ca: fs.readFileSync(certPath),
    })
  : new https.Agent({ rejectUnauthorized: false });

const apiClient = axios.create({
  baseURL: process.env.AUTH_API || "https://localhost:8000/v1",
  withCredentials: true,
  httpsAgent, // Ensures HTTPS works with self-signed certs
});

export default apiClient;
