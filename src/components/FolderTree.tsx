import React, { useState } from "react";
import PermissionShare from "./PermissionShare";

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
}

interface Props {
  folders: Folder[];
  selectedId: number | null;
  onSelectFolder: (id: number) => void;
  onAddFolder: (parentId: number | null) => void;
  onDeleteFolder: (id: number) => void;
}

const FolderTree: React.FC<Props> = ({
  folders,
  selectedId,
  onSelectFolder,
  onAddFolder,
  onDeleteFolder,
}) => {
  const [permissionFolderId, setPermissionFolderId] = useState<number | null>(null);
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}").id;
  const renderTree = (parentId: number | null, level = 0) => {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((folder) => (
        <div key={folder.id} className={`ml-${level * 2}`}>
          <div
            className={`cursor-pointer px-2 py-1 rounded hover:bg-blue-100 ${
              selectedId === folder.id ? "bg-blue-200 font-medium" : ""
            }`}
            onClick={() => onSelectFolder(folder.id)}
          >
            📁 {folder.name}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder(folder.id);
              }}
              className="ml-2 text-green-500 hover:text-green-700 cursor-pointer text-sm"
            >
              ➕
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
              className="ml-2 text-red-500 hover:text-red-700 cursor-pointer text-sm"
            >
              ❌
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setPermissionFolderId(folder.id);
              }}
              className="ml-2 text-blue-500 hover:text-blue-700 cursor-pointer text-sm"
            >
              👥
            </span>
          </div>
          <div className="ml-4">{renderTree(folder.id, level + 1)}</div>
        </div>
      ));
  };

  return (
    <>
      <aside className="w-64 bg-gray-100 p-4 border-r overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">📁 Thư mục</h2>
          <button
            className="text-green-600 text-sm hover:underline"
            onClick={() => onAddFolder(null)}
          >
            + Thêm
          </button>
        </div>
        <div className="text-sm space-y-1">{renderTree(null)}</div>
      </aside>

      {permissionFolderId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[400px] relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setPermissionFolderId(null)}
            >
              ✖
            </button>
            <PermissionShare folderId={permissionFolderId} userId={currentUserId} />
          </div>
        </div>
      )}
    </>
  );
};

export default FolderTree;
