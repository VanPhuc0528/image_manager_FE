import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Mỗi lần đường dẫn thay đổi (login/logout...) thì lấy lại username từ localStorage
    const storedName = localStorage.getItem("username");
    setUsername(storedName);
  }, [location.pathname]); // chạy mỗi khi đường dẫn thay đổi

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUsername(null);
    navigate("/login");
  };

  return (
    <nav className="bg-sky-900 text-white px-6 py-3 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">📸 Image Manager</Link>
      <div className="space-x-4 flex items-center">
        <Link to="/" className="hover:text-blue-400">Trang chủ</Link>
        <Link to="/login-google" className="hover:text-blue-400">Đăng nhập Google</Link>

        {username ? (
          <>
            <span className="text-sm">Xin chào, <b>{username}</b></span>
            <button onClick={handleLogout} className="hover:text-red-400">Đăng xuất</button>
          </>
        ) : (
          <button onClick={() => navigate("/login")} className="hover:text-blue-400">Đăng nhập</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
