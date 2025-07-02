import DefaultLayout from "../layouts/DefaultLayout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";

const routes = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/shared", element: <div>Thư mục chia sẻ</div> },
    ],
  },
];

export default routes;
