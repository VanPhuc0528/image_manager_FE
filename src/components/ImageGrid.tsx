import React, { useEffect, useState } from "react";
import UploadImages from "./UploadImages";
import type { ImageItem } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

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
  onUpload: (files: FileList) => Promise<void>;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  folderId,
  folders,
  onSyncDrive,
  onUploaded,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState({ year: "", month: "", day: "" });

  const currentFolder = folders.find((f) => f.id === folderId);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user?.id;

  // Fetch ảnh từ API
  useEffect(() => {
    const fetchImages = async () => {
      if (!user_id || !folderId) {
        setError("Thiếu user_id hoặc folder_id");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/user/${user_id}/folder/${folderId}/images/`);
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        console.error("Error fetching images:", err);
        setError("Không thể tải ảnh.");
      }
    };

    fetchImages();
  }, [user_id, folderId]);

  // Lọc ảnh
  const filteredImages = images.filter((img) => {
    const date = new Date(img.created_at);
    const matchYear = filter.year ? date.getFullYear() === +filter.year : true;
    const matchMonth = filter.month ? date.getMonth() + 1 === +filter.month : true;
    const matchDay = filter.day ? date.getDate() === +filter.day : true;
    return matchYear && matchMonth && matchDay;
  });

  return (
    <div>
      {/* Tiêu đề */}
      <h2 className="text-xl font-semibold mb-4">
        {folderId ? `📁 ${currentFolder?.name || "Thư mục"}` : "Chọn thư mục để xem ảnh"}
      </h2>

      {/* Bộ lọc */}
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
          {filteredImages.length === 0 ? (
            <p className="text-gray-500">Không tìm thấy ảnh phù hợp.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="cursor-pointer"
                  onClick={() => setPreviewUrl(img.image)}
                >
                  <img
                    src={img.image}
                    alt={img.image_name}
                    className="w-full h-40 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://via.placeholder.com/200?text=Lỗi+ảnh";
                    }}
                  />
                  <p className="text-sm text-center mt-1 truncate">{img.image_name}</p>
                  <p className="text-xs text-center text-gray-500">
                    {new Date(img.created_at).toLocaleDateString("vi-VN")}
                  </p>
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
            onUploaded={(newImgs) => {
              setImages((prev) => [...prev, ...newImgs]);
              onUploaded(newImgs);
            }}
          />
        </div>
      )}

      {/* Nút đồng bộ */}
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
