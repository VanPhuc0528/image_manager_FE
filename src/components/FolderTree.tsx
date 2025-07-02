import React from "react";

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
          </div>
          <div className="ml-4">{renderTree(folder.id, level + 1)}</div>
        </div>
      ));
  };

  return (
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
  );
};

export default FolderTree;
