import React from "react";

const Sidebar: React.FC = () => {
  return (
    <aside className="bg-gray-50 border-r w-64 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2">📁 Thư mục</h3>
      <ul className="space-y-2 text-sm">
        <li className="hover:text-blue-500 cursor-pointer">Ảnh cá nhân</li>
        <li className="hover:text-blue-500 cursor-pointer ml-4">- Ảnh sự kiện</li>
        <li className="hover:text-blue-500 cursor-pointer ml-4">- Ảnh học tập</li>
        <li className="hover:text-blue-500 cursor-pointer">Thư mục chia sẻ</li>
      </ul>
    </aside>
  );
};

export default Sidebar;
