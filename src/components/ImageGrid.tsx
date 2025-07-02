import React from "react";

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
}

interface ImageItem {
  id: number;
  name: string;
  url?: string;
  folderId: number;
}

interface Props {
  folderId: number | null;
  folders: Folder[];
  onSelectFolder: (id: number) => void;
  images: ImageItem[];
  onUpload: (files: FileList) => void;
  onSyncDrive: () => void;
}

const ImageGrid: React.FC<Props> = ({
  folderId,
  folders,
  onSelectFolder,
  images,
  onUpload,
  onSyncDrive,
}) => {
  const currentImages = images.filter((img) => img.folderId === folderId);
  const childFolders = folders.filter((f) => f.parentId === folderId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">📂 Nội dung thư mục</h2>
        <div className="flex gap-2">
          <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
            Upload ảnh
            <input
              type="file"
              multiple
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files && onUpload(e.target.files)}
              disabled={!folderId}
            />
          </label>
          <button
            onClick={onSyncDrive}
            disabled={!folderId}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Đồng bộ từ Google Drive
          </button>
        </div>
      </div>

      {childFolders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">📁 Thư mục con</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {childFolders.map((folder) => (
              <div
                key={folder.id}
                className="border rounded shadow-sm p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => onSelectFolder(folder.id)}
              >
                <div className="text-5xl text-yellow-500 text-center">📁</div>
                <p className="text-center mt-2 text-sm">{folder.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentImages.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mt-4 mb-2">🖼️ Hình ảnh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentImages.map((img) => (
              <div key={img.id} className="border rounded overflow-hidden shadow-sm">
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    Không có ảnh
                  </div>
                )}
                <p className="text-sm p-2 truncate">{img.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {childFolders.length === 0 && currentImages.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Thư mục này trống. Bạn có thể upload ảnh hoặc thêm thư mục con.
        </p>
      )}
    </div>
  );
};

export default ImageGrid;
