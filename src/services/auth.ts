import axios, { AxiosError } from "axios";

// 👉 Đưa vào .env.production hoặc .env.development
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// =============================
// ✅ Hàm đăng nhập (POST)
// =============================
export async function login(email: string, password: string) {
  try {
    const res = await axios.post(`${API_URL}/auth/login/`, {
      email,
      password,
    });

    // ✅ Trích token và user từ data đúng cấp
    const { token, user } = res.data.data;

    console.log("✅ Token nhận được:", token); // debug

    return {
      token,
      user,
    };
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("❌ Lỗi đăng nhập:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || "Đăng nhập thất bại."
    );
  }
}

// =============================
// ✅ Hàm đăng ký (POST)
// =============================
export async function register(username: string, email: string, password: string) {
  try {
    const res = await axios.post(`${API_URL}/auth/register/`, {
      username, // nếu backend yêu cầu dùng "name" hoặc "first_name" thì đổi lại
      email,
      password,
    });

    // Trường hợp backend chỉ trả thông báo
    return {
      message: "Đăng ký thành công!",
      user: res.data,
    };
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Lỗi đăng ký:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || "Đăng ký thất bại."
    );
  }
}
