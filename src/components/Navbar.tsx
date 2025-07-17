import React, { useEffect, useState } from "react";
import { Link, useNavigate} from "react-router-dom";

const Navbar: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();


    useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setUsername(user.username); // ✅ lấy đúng username
      } catch (e) {
        console.error("Không thể parse user từ localStorage", e);
      }
    } else {
      setUsername(null);
    }
  }, []);
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
