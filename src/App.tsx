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
          {/* Các route không dùng layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Các route có layout (Navbar, Sidebar, Footer) */}
          <Route element={<DefaultLayout />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
