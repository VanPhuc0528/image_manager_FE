import React, { useEffect, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL;

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
  picture?: string;
}

const GoogleLogin: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    const initializeGoogleId = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleId;
    document.body.appendChild(script);

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleCredentialResponse = (response: any) => {
    // Không xử lý trực tiếp ở đây, vì bạn dùng access_token trong tokenClient bên dưới
    console.log("Credential received:", response);
  };

  const loginWithGoogle = async (accessToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/gg_login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });

      const data = await res.json();
      console.log('✅ Backend login response:', data);

      const user = data?.user;
      const token = data?.token;

      if (!user?.id || !token) {
        throw new Error('Thiếu thông tin người dùng hoặc token từ backend');
      }

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      setUser(user);
    } catch (err) {
      console.error('❌ Lỗi đăng nhập với Google:', err);
      alert('Đăng nhập thất bại!');
    }
  };

  const handleGoogleLoginClick = () => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'openid email profile',
      callback: (tokenResponse: any) => {
        if (!tokenResponse.access_token) {
          console.error('Không nhận được access_token từ Google');
          return;
        }

        localStorage.setItem('accessToken', tokenResponse.access_token);
        loginWithGoogle(tokenResponse.access_token);
      },
    });

    tokenClient.requestAccessToken();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto">
      {!user ? (
        <button
          onClick={handleGoogleLoginClick}
          className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition"
        >
          Đăng nhập với Google
        </button>
      ) : (
        <div className="text-center space-y-3">
          {user.picture && (
            <img src={user.picture} alt="avatar" className="w-20 h-20 rounded-full mx-auto" />
          )}
          <div className="font-semibold text-lg">{user.username}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
          <button
            onClick={logout}
            className="mt-4 bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleLogin;
