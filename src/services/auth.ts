import axios from "axios";

// Địa chỉ API backend của bạn (có thể sửa thành .env sau)
const API_URL = "http://localhost:8000/api"; // FastAPI hoặc Django

// Gọi API đăng nhập
export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/login`, {
    email,
    password,
  });
  return res.data; // thường chứa token + user info
}

// Gọi API đăng ký
export async function register(name: string, email: string, password: string) {
  const res = await axios.post(`${API_URL}/register`, {
    name,
    email,
    password,
  });
  return res.data;
}
