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
      const data = await login(email, password); // Gọi API đăng nhập

      if (data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user?.username || "Người dùng");

        console.log("✅ Đăng nhập thành công, token:", data.token);
        navigate("/");
      } else {
        setError("Không nhận được token từ server.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("❌ Lỗi đăng nhập:", err.message);
      } else {
        console.error("❌ Lỗi đăng nhập:", err);
      }
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 mb-4 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="border p-2 mb-6 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 w-full rounded hover:bg-blue-700"
        >
          Đăng nhập
        </button>

        <p className="mt-4 text-sm text-center">
          Chưa có tài khoản?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
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
