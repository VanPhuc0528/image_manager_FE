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
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
}

const GoogleLogin: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Load Google SDK
    const initializeGoogleId = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });
      window.google.accounts.id.prompt();
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleId;
    document.body.appendChild(script);

    // Load tokens và user từ localStorage khi app start
    const savedIdToken = localStorage.getItem('idToken');
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (savedIdToken && savedUser) {
      setIdToken(savedIdToken);
      setUser(JSON.parse(savedUser));
    }

    if (savedAccessToken) {
      setAccessToken(savedAccessToken);
    }
  }, []);

  const parseJwt = (token: string) => {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join(''),
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const handleCredentialResponse = (response: any) => {
    if (!response.credential) {
      console.warn('No credential received from Google');
      return;
    }
    const decoded = parseJwt(response.credential);
    if (decoded) {
      const profile: GoogleUser = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        email_verified: decoded.email_verified,
      };
      setUser(profile);
      setIdToken(response.credential);

      // Lưu token và user vào localStorage
      localStorage.setItem('idToken', response.credential);
      localStorage.setItem('user', JSON.stringify(profile));

      if (accessToken) {
        sendToBackend({
          access_token: accessToken,
          id_token: response.credential,
          user_info: profile,
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  const sendToBackend = async (payload: any) => {
    try {
      if (!payload.id_token) {
        delete payload.id_token;
      }
      const res = await fetch(`${API_URL}/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('Backend response:', data);
    } catch (err) {
      console.error('Error sending to backend:', err);
    }
  };

  const handleGoogleLoginClick = () => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'openid email profile',
      callback: (tokenResponse: any) => {
        if (!tokenResponse.access_token) {
          console.error('No access token received');
          return;
        }
        setAccessToken(tokenResponse.access_token);
        localStorage.setItem('accessToken', tokenResponse.access_token);

        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        })
          .then((res) => res.json())
          .then((profile) => {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));

            sendToBackend({
              access_token: tokenResponse.access_token,
              id_token: idToken ?? undefined,
              user_info: profile,
              timestamp: new Date().toISOString(),
            });
          })
          .catch(console.error);
      },
    });
    tokenClient.requestAccessToken();
  };

  const logout = () => {
    setUser(null);
    setIdToken(null);
    setAccessToken(null);

    // Xóa localStorage khi logout
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
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
          <img src={user.picture} alt="avatar" className="w-20 h-20 rounded-full mx-auto" />
          <div className="font-semibold text-lg">{user.name}</div>
          <div className="text-gray-500 text-sm">{user.email}</div>
          <button onClick={logout} className="mt-4 bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600">
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleLogin;
