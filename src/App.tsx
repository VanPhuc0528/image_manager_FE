// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import DefaultLayout from "./layouts/DefaultLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GoogleLogin from "./pages/GoogleLogin";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main layout routes */}
        <Route element={<DefaultLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="folder/:id" element={<Dashboard />} />
          <Route path="login-google" element={<GoogleLogin />} />
          {/* Nếu muốn thêm route khác dùng chung layout, thêm tại đây */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
