import React, { useState } from "react";
import UploadImages from "./UploadImages";
import type { ImageItem } from "../types";

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  allowUpload?: boolean;
  allowSync?: boolean;
}

interface ImageGridProps {
  folderId: number | null;
  folders: Folder[];
  images: ImageItem[];
  onSyncDrive: () => void;
  onSelectFolder: (id: number | null) => void;
  onUploaded: (newImgs: ImageItem[]) => void;
  onUpload?: (files: FileList) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  folderId,
  folders,
  images,
  onSyncDrive,
  onUploaded,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    year: "",
    month: "",
    day: "",
  });

  const currentFolder = folders.find((f) => f.id === folderId);

  // Lọc ảnh theo folderId
  let currentImages = folderId
    ? images.filter((img) => img.folderId === folderId)
    : [];

  // Áp dụng lọc theo ngày/tháng/năm
  if (filter.year || filter.month || filter.day) {
    currentImages = currentImages.filter((img) => {
      if (!img.createdAt) return false;
      const date = new Date(img.createdAt);
      const matchYear = filter.year ? date.getFullYear() === parseInt(filter.year) : true;
      const matchMonth = filter.month ? date.getMonth() + 1 === parseInt(filter.month) : true;
      const matchDay = filter.day ? date.getDate() === parseInt(filter.day) : true;
      return matchYear && matchMonth && matchDay;
    });
  }

  return (
    <div>
      {/* Tiêu đề thư mục */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {folderId
            ? `📁 ${currentFolder?.name || "Thư mục"}`
            : "Chọn thư mục để xem ảnh"}
        </h2>
      </div>

      {/* Bộ lọc ảnh */}
      {folderId && (
        <div className="mb-4 flex gap-4">
          <input
            type="number"
            placeholder="Năm (VD: 2025)"
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
            className="border px-2 py-1 rounded"
          />
          <input
            type="number"
            placeholder="Tháng (1-12)"
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
            className="border px-2 py-1 rounded"
          />
          <input
            type="number"
            placeholder="Ngày (1-31)"
            value={filter.day}
            onChange={(e) => setFilter({ ...filter, day: e.target.value })}
            className="border px-2 py-1 rounded"
          />
        </div>
      )}

      {/* Danh sách ảnh */}
      {folderId && (
        <>
          {currentImages.length === 0 ? (
            <p className="text-gray-500">Không tìm thấy ảnh phù hợp.</p>
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
                  {img.createdAt && (
                    <p className="text-xs text-center text-gray-500">
                      {new Date(img.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload ảnh */}
      {folderId && currentFolder?.allowUpload && (
        <div className="mt-8">
          <UploadImages
            folderId={folderId}
            disabled={!currentFolder.allowUpload}
            onUploaded={onUploaded}
          />
        </div>
      )}

      {/* Nút đồng bộ Drive */}
      {folderId && currentFolder?.allowSync && (
        <div className="mt-4">
          <button
            onClick={onSyncDrive}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Đồng bộ Drive
          </button>
        </div>
      )}

      {/* Xem trước ảnh */}
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
