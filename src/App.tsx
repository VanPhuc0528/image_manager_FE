import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import DefaultLayout from "./layouts/DefaultLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Public routes (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected / Main routes with layout */}
          <Route element={<DefaultLayout />}>
            <Route index element={<Dashboard />} />
            {/* Có thể thêm các route khác trong layout ở đây */}
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
