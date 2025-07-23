import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { user, token } = await login(email, password);

      if (!user?.id || !token) {
        throw new Error("Đăng nhập thất bại: Thiếu thông tin người dùng hoặc token.");
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      console.log("✅ Đăng nhập thành công:", user);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("❌ Lỗi đăng nhập:", err.message);
        setError(err.message);
      } else {
        console.error("❌ Lỗi đăng nhập:", err);
        setError("Đăng nhập thất bại. Vui lòng kiểm tra lại.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm"
      >
        <h2 className="text-3xl font-semibold text-center mb-6 text-blue-700">
          🔐 Đăng nhập
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <div className="border-t border-gray-300 mb-4"></div>

        <input
          type="email"
          placeholder="Email"
          className="border border-gray-300 rounded-md p-3 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="border border-gray-300 rounded-md p-3 mb-6 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex gap-3 mb-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 w-1/2 rounded-md transition"
          >
            Đăng nhập
          </button>

          <button
            type="button"
            onClick={() => navigate("/login-google")}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 w-1/2 rounded-md transition"
          >
            <span className="text-lg">🔴</span>
            Google
          </button>
        </div>

        <p className="mt-4 text-sm text-center text-gray-600">
          Chưa có tài khoản?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline font-medium"
            onClick={() => navigate("/register")}
          >
            Đăng ký
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
