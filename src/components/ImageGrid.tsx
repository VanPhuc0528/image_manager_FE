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
  const [filter, setFilter] = useState({ year: "", month: "", day: "", keyword: "" });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentFolder = folders.find((f) => f.id === folderId);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user?.id;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fetch ảnh từ API
  useEffect(() => {
    const fetchImages = async () => {
      if (!user_id || !folderId) {
        setError("Thiếu user_id hoặc folder_id");
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/user/${user_id}/folder/${folderId}/images/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
    const matchesName = !filter.keyword || img.image_name.toLowerCase().includes(filter.keyword.toLowerCase());
    return matchYear && matchMonth && matchDay && matchesName;
  });

  return (
    <div>
      {/* Tiêu đề */}
      <h2 className="text-xl font-semibold mb-4">
        {folderId ? `📁 ${currentFolder?.name || "Thư mục"}` : "Chọn thư mục để xem ảnh"}
      </h2>

      {folderId && (
        <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
          {/* Bộ lọc bên trái */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter.year}
              onChange={(e) => setFilter({ ...filter, year: e.target.value })}
              className="border px-2 py-1 rounded"
            >
              <option value="">Chọn năm</option>
              {Array.from({ length: 16 }, (_, i) => {
                const year = 2015 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            <select
              value={filter.month}
              onChange={(e) => setFilter({ ...filter, month: e.target.value })}
              className="border px-2 py-1 rounded"
            >
              <option value="">Chọn tháng</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <select
              value={filter.day}
              onChange={(e) => setFilter({ ...filter, day: e.target.value })}
              className="border px-2 py-1 rounded"
            >
              <option value="">Chọn ngày</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Tìm ảnh theo tên"
              value={filter.keyword || ""}
              onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
              className="border px-2 py-1 rounded"
            />
          </div>

          {/* Nút chuyển đổi dạng xem bên phải */}
          <div className="flex items-center border rounded-full overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-100' : 'bg-white'}`}
              title="Xem dạng danh sách"
            >
              <i className="fas fa-bars" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-100' : 'bg-white'}`}
              title="Xem dạng lưới"
            >
              <i className="fas fa-th" />
            </button>
          </div>
        </div>
      )}


      {/* Danh sách ảnh */}
      {folderId && filteredImages.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'flex flex-col gap-2'}>
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className={`border rounded-lg overflow-hidden shadow ${viewMode === 'list' ? 'flex items-center' : ''}`}
              onClick={() => setPreviewUrl(img.image)}
            >
              <img
                src={img.image}
                alt={img.image_name}
                className={viewMode === 'list' ? 'w-24 h-24 object-cover mr-4' : 'w-full h-48 object-cover'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://via.placeholder.com/200?text=Lỗi+ảnh";
                }}
              />
              <div className="p-2">
                <div className="font-semibold">{img.image_name}</div>
                <div className="text-sm text-gray-500">{formatDate(img.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Không tìm thấy ảnh */}
      {folderId && filteredImages.length === 0 && (
        <p className="text-gray-500">Không tìm thấy ảnh phù hợp.</p>
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

      {/* Đồng bộ Drive */}
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
