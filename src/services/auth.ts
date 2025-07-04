import axios, { AxiosError } from "axios";

// 👉 Đặt URL backend thật của bạn ở đây (có thể đưa vào biến môi trường .env sau)
const API_URL = "http://localhost:8000/api";

// =============================
// ✅ Hàm đăng nhập
// =============================
export async function login(email: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });

    return response.data; // { token, user }
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Lỗi đăng nhập:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || "Đăng nhập thất bại."
    );
  }
}

// =============================
// ✅ Hàm đăng ký
// =============================
export async function register(name: string, email: string, password: string) {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      email,
      password,
      first_name: name, // 👉 Tùy backend, có thể cần đổi thành 'name' hoặc 'username'
    });

    return {
      message: "Đăng ký thành công",
      user: response.data.user,
    };
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Lỗi đăng ký:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || "Đăng ký thất bại."
    );
  }
}
