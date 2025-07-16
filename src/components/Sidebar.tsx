import React, { useEffect, useState } from "react";
import axios from "axios";

interface Folder {
  id: number;
  name: string;
  parent: number | null;
  owner: number;
}

const Sidebar: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingParentId, setAddingParentId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchFolders = async () => {
      try {
        const res = await axios.get("/api/folder/list/", {
          params: { user_id: userId },
        });
        setFolders(res.data);
      } catch (err) {
        console.error("Lỗi khi load thư mục:", err);
      }
    };
    fetchFolders();
  }, [userId]);

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !userId) return;
    try {
      const res = await axios.post("/api/folder/create/", {
        name: newFolderName,
        parent: addingParentId,
        owner: userId,
      });
      setFolders((prev) => [...prev, res.data]);
      setNewFolderName("");
      setAddingParentId(null);
    } catch (err) {
      console.error("Tạo thư mục thất bại:", err);
    }
  };

  const renderFolders = (parentId: number | null, level = 0) => {
    return folders
      .filter((f) => f.parent === parentId)
      .map((folder) => (
        <li key={folder.id} className={`pl-${level * 4} text-sm`}>
          📁 {folder.name}
          <button
            className="ml-2 text-green-600 text-xs"
            onClick={() => setAddingParentId(folder.id)}
          >
            ➕
          </button>
          {addingParentId === folder.id && (
            <div className="ml-4 mt-1">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="border text-xs p-1"
                placeholder="Tên thư mục"
              />
              <button onClick={handleAddFolder} className="ml-1 text-green-700 text-xs">
                OK
              </button>
            </div>
          )}
          <ul>{renderFolders(folder.id, level + 1)}</ul>
        </li>
      ));
  };

  return (
    <aside className="bg-gray-50 border-r w-64 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2">📁 Thư mục</h3>

      {addingParentId === null && (
        <div className="mb-2">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="border text-sm p-1"
            placeholder="Tên thư mục"
          />
          <button onClick={handleAddFolder} className="ml-2 text-green-600 text-sm">
            + Thêm thư mục gốc
          </button>
        </div>
      )}

      <ul className="space-y-1">{renderFolders(null)}</ul>
    </aside>
  );
};

export default Sidebar;
