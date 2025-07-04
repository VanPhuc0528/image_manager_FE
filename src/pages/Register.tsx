import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/auth";
import { AxiosError } from "axios";

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");       // full name
  const [email, setEmail] = useState("");     // email
  const [password, setPassword] = useState(""); // password
  const [error, setError] = useState("");     // error message

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await register(name, email, password); // Gọi API backend
      alert("Đăng ký thành công! Mời bạn đăng nhập.");
      navigate("/login");
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Lỗi đăng ký:", error.response?.data || error.message);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Đăng ký thất bại. Vui lòng thử lại."
      );
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng ký tài khoản</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Tên đầy đủ"
          className="border p-2 mb-4 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          className="bg-green-600 text-white px-4 py-2 w-full rounded hover:bg-green-700"
        >
          Đăng ký
        </button>

        <p className="mt-4 text-sm text-center">
          Đã có tài khoản?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
