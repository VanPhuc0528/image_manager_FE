import React, { useRef } from "react";
import type { ImageItem } from "../types";

interface Props {
  folderId: number | null;
  disabled: boolean;
  onUploaded: (newImgs: ImageItem[]) => void;
}

const UploadImages: React.FC<Props> = ({ folderId, disabled, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !folderId) return;

    const now = new Date();

    const uploadPromises = Array.from(files).map(async (file, idx) => {
      if (!file.type.startsWith("image/")) throw new Error("Không phải ảnh hợp lệ");
      if (file.size > 10 * 1024 * 1024) throw new Error("Ảnh quá lớn");

      // 🛠 Với json-server, không dùng formData, mà dùng JSON
      const mockData: ImageItem = {
        id: Date.now() + idx,
        name: file.name,
        url: URL.createObjectURL(file),
        folderId,
        createdAt: now.toISOString(),
      };

      try {
        const res = await fetch("http://localhost:8000/images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mockData),
        });

        const result = await res.json();
        return result;
      } catch {
        // Nếu fetch lỗi (json-server chưa bật) → dùng mock tạm
        return mockData;
      }
    });

    const newImages = await Promise.all(uploadPromises);
    onUploaded(newImages);
  };

  return (
    <div
      className={`w-full h-40 border-2 border-dashed flex flex-col justify-center items-center text-center bg-gray-200 rounded cursor-pointer ${
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-gray-300"
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <img src="/placeholder-upload.png" alt="upload icon" className="w-12 h-12 mb-2" />
      <p className="font-medium">Upload ảnh lên đây:</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadImages;
