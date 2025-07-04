import React, { useState } from "react";

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
}

interface ImageItem {
  id: number;
  name: string;
  url: string;
  folderId: number;
}

interface ImageGridProps {
  folderId: number | null;
  folders: Folder[];
  images: ImageItem[];
  onUpload: (files: FileList) => void;
  onSyncDrive: () => void;
  onSelectFolder: (id: number | null) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  folderId,
  folders,
  images,
  onUpload,
  onSyncDrive,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentImages = folderId
    ? images.filter((img) => img.folderId === folderId)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {folderId
            ? `📁 ${
                folders.find((f) => f.id === folderId)?.name || "Thư mục"
              }`
            : "Chọn thư mục để xem ảnh"}
        </h2>

        {folderId && (
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && onUpload(e.target.files)}
            />
            <button
              onClick={onSyncDrive}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Đồng bộ Drive
            </button>
          </div>
        )}
      </div>

      {folderId && (
        <>
          {currentImages.length === 0 ? (
            <p className="text-gray-500">Chưa có ảnh trong thư mục này.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentImages.map((img) => (
                <div
                  key={img.id}
                  className="cursor-pointer"
                  onClick={() => setPreviewUrl(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-40 object-cover rounded border"
                  />
                  <p className="text-sm text-center mt-1 truncate">{img.name}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            className="max-w-4xl max-h-[90vh] border-4 border-white rounded-lg"
            alt="preview"
          />
        </div>
      )}
    </div>
  );
};

export default ImageGrid;
