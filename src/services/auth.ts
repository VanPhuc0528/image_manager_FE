import { AxiosError } from "axios";
import axiosInstance from "./axiosInstance"; // ✅ Sử dụng axiosInstance

// =============================
// ✅ Hàm đăng nhập
// =============================
export async function login(email: string, password: string) {
  try {
    const res = await axiosInstance.post("/auth/login/", { email, password });

    const user = res.data?.user;
    const token = res.data?.token;

    if (!user?.id || !token) {
      throw new Error("Không tìm thấy thông tin người dùng hoặc token.");
    }

    // ✅ Lưu token vào localStorage để dùng cho các request sau
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);

    return { user, token };
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    throw new Error(
      error.response?.data?.message || error.message || "Đăng nhập thất bại."
    );
  }
}

// =============================
// ✅ Hàm đăng nhập với Google (cần token)
// =============================
export async function loginWithGoogle(accessToken: string) {
  try {
    const res = await axiosInstance.post("/auth/gg_login/", {
      access_token: accessToken,
    });

    const user = res.data?.user;
    const token = res.data?.token;

    if (!user?.id || !token) {
      throw new Error("Không tìm thấy thông tin người dùng hoặc token.");
    }

    // ✅ Lưu lại token
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);

    return { user, token };
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    throw new Error(
      error.response?.data?.message || error.message || "Đăng nhập với Google thất bại."
    );
  }
}

// =============================
// ✅ Hàm đăng ký (không cần token)
// =============================
export async function register(username: string, email: string, password: string) {
  try {
    const res = await axiosInstance.post("/auth/register/", {
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
