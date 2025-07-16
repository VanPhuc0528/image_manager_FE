import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// =============================
// ✅ Hàm đăng nhập (KHÔNG cần token)
// =============================
export async function login(email: string, password: string) {
  try {
    const res = await axios.post(`${API_URL}/auth/login/`, {
      email,
      password,
    });
    console.log("🔎 login response:", res.data);

    // 👇 Lấy user từ trường `data` (theo đúng format backend trả về)
    const user = res.data?.data || res.data?.user || res.data;
    console.log("🔎 parsed user:", user);

    if (!user?.id) {
      throw new Error("Không tìm thấy thông tin người dùng.");
    }

    return { user };
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Lỗi đăng nhập:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || "Đăng nhập thất bại."
    );
  }
}


// =============================
// ✅ Hàm đăng ký (giữ nguyên)
// =============================
export async function register(username: string, email: string, password: string) {
  try {
    const res = await axios.post(`${API_URL}/auth/register/`, {
      username,
      email,
      password,
    });

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
