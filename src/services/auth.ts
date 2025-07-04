import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:8000"; // json-server hoặc backend thật

// Gọi API đăng nhập
export async function login(email: string, password: string) {
  try {
    const res = await axios.get(`${API_URL}/users`, {
      params: { email, password },
    });

    const user = res.data[0]; // lấy user đầu tiên khớp

    if (user) {
      return {
        token: "fake-jwt-token",
        user,
      };
    } else {
      throw new Error("Email hoặc mật khẩu không đúng");
    }
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Lỗi đăng nhập:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || error.message || "Đăng nhập thất bại."
    );
  }
}

// Gọi API đăng ký
export async function register(name: string, email: string, password: string) {
  try {
    // Kiểm tra email đã tồn tại chưa
    const existing = await axios.get(`${API_URL}/users`, {
      params: { email },
    });

    if (existing.data.length > 0) {
      throw new Error("Email đã được sử dụng");
    }

    // Nếu chưa có thì tạo user mới
    const res = await axios.post(`${API_URL}/users`, {
      name,
      email,
      password,
    });

    return {
      message: "Đăng ký thành công",
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
