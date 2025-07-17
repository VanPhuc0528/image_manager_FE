import React, { useEffect, useRef, useState } from "react";
import FolderTree from "../components/FolderTree";
import ImageGrid from "../components/ImageGrid";
import FolderConfig from "../components/FolderConfig";
import { useNavigate, useParams } from "react-router-dom";
import type { ImageItem } from "../types";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DEVELOPER_KEY = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  allowUpload?: boolean;
  allowSync?: boolean;
}

interface GooglePickerFile {
  id: string;
  name: string;
}

interface GooglePickerData {
  action: string;
  docs: GooglePickerFile[];
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  // Lấy userId từ localStorage
  const getCurrentUserId = (): number => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.id;
    } catch {
      return 1;
    }
  };

  // Chọn folderId ưu tiên:
  // Nếu url có id thì lấy id đó,
  // nếu chưa có thì lấy folder đầu tiên trong list,
  // nếu folder trống thì null
  const selectedFolderId = id
    ? parseInt(id)
    : folders.length > 0
    ? folders[0].id
    : null;

  // Lấy folder đang chọn để dùng trong UI
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Load danh sách folder từ server khi mount
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const userId = getCurrentUserId();
        const response = await fetch(`${API_URL}/home/${userId}`);
        if (!response.ok) throw new Error("Lỗi tải thư mục");

        const data = await response.json();
        console.log("data", data);

        const normalizedFolders: Folder[] = data.folders.map((f: any) => ({
          id: f.id,
          name: f.name,
          parentId: f.parentId ?? null,
          allowUpload: true,   
          allowSync: true,
        }));

        setFolders(normalizedFolders);
      } catch (err) {
        console.log("Lỗi khi tải thư mục:", err);
        setError("Không thể tải thư mục");
      }
    };

    fetchFolders();
  }, []);

  // Load Google APIs cho picker
  useEffect(() => {
    const loadApis = async () => {
      try {
        const gapiScript = document.createElement("script");
        gapiScript.src = "https://apis.google.com/js/api.js";
        document.head.appendChild(gapiScript);
        await new Promise((res, rej) => {
          gapiScript.onload = res;
          gapiScript.onerror = rej;
        });

        const gisScript = document.createElement("script");
        gisScript.src = "https://accounts.google.com/gsi/client";
        document.head.appendChild(gisScript);
        await new Promise((res, rej) => {
          gisScript.onload = res;
          gisScript.onerror = rej;
        });

        window.gapi.load("picker", {
          callback: () => {},
          onerror: () => setError("Không thể tải Google Picker API."),
        });
      } catch {
        setError("Không thể tải Google APIs");
      }
    };

    loadApis();
  }, []);

  // Fetch ảnh mỗi khi selectedFolderId hoặc folders thay đổi
  useEffect(() => {
    const fetchImages = async () => {
      if (!selectedFolderId) {
        setImages([]);
        return;
      }
      try {
        const userId = getCurrentUserId();
        const url = `${API_URL}/${userId}/${selectedFolderId}/images`;
        console.log("Fetching images from URL:", url);

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server trả về lỗi: ${res.status}`);

        const data = await res.json();
        console.log("Response data:", data);
        setImages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi khi tải ảnh:", err);
        setError("Không thể tải ảnh từ server.");
      }
    };

    fetchImages();
  }, [selectedFolderId, folders]);

  // Phần còn lại giữ nguyên

  const handleUpload = async (files: FileList) => {
    if (!selectedFolder?.allowUpload || !selectedFolderId || files.length === 0) return;

    setLoading(true);
    try {
      const userId = getCurrentUserId();
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/")) throw new Error(`File ${file.name} không hợp lệ`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`File ${file.name} quá lớn`);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("folderId", selectedFolderId.toString());
        formData.append("createdAt", new Date().toISOString());

        const res = await fetch(`${API_URL}/${userId}/${selectedFolderId}/images/`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload thất bại");

        const result = await res.json();

        return {
          id: result.id,
          name: result.name,
          url: result.url,
          folderId: selectedFolderId,
          createdAt: result.created_at,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setImages((prev) => (Array.isArray(prev) ? [...prev, ...newImages] : newImages));
    } catch (err: any) {
      setError(err.message || "Lỗi khi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDrive = () => {
    if (!selectedFolderId || !selectedFolder?.allowSync || !window.google?.accounts?.oauth2) return;

    if (accessTokenRef.current) {
      showPicker(accessTokenRef.current);
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (tokenResponse: { access_token: string }) => {
        accessTokenRef.current = tokenResponse.access_token;

        const userId = getCurrentUserId();
        fetch(`${API_URL}/${userId}/save-token/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        }).catch((err) => console.error("❌ Lỗi gửi token:", err));

        showPicker(tokenResponse.access_token);
      },
    });

    tokenClient.requestAccessToken();
  };

  const showPicker = (accessToken: string) => {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS_IMAGES);
    view.setMimeTypes("image/png,image/jpeg,image/jpg,image/gif");

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(CLIENT_ID.split("-")[0])
      .setOAuthToken(accessToken)
      .addView(view)
      .addView(new window.google.picker.DocsUploadView())
      .setDeveloperKey(DEVELOPER_KEY)
      .setCallback(async (data: GooglePickerData) => {
        if (data.action === window.google.picker.Action.PICKED && selectedFolderId !== null) {
          const newImages: ImageItem[] = data.docs.map((file) => ({
            id: file.id,
            name: file.name,
            url: `https://drive.google.com/uc?export=view&id=${file.id}`,
            folderId: selectedFolderId,
            createdAt: new Date().toISOString(),
          }));

          try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const email = user?.email || "";
            const userId = user?.id || getCurrentUserId();

            console.log(`${API_URL}/${userId}/${selectedFolderId}/images`);

            await fetch(`${API_URL}/${userId}/${selectedFolderId}/images`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                images: newImages,
                token: accessToken,
                email,
                user_id: userId,
              }),
            });

            setImages((prev) => (Array.isArray(prev) ? [...prev, ...newImages] : newImages));
          } catch {
            setError("Không thể lưu ảnh từ Google Drive.");
          }
        }
      })
      .build();

    picker.setVisible(true);
  };

  // Folder CRUD handlers giữ nguyên

    const handleAddFolder = async (parentId: number | null) => {
    const name = prompt("Tên thư mục:");
    if (!name) return;

    const userId = getCurrentUserId();

    try {
      const response = await fetch(`${API_URL}/folder/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          parentId: parentId ?? null,
          owner: userId,
        }),
      });

      if (!response.ok) throw new Error("Lỗi khi tạo thư mục");

      const newFolder = await response.json();

      setFolders((prev) => [
        ...prev,
        {
          id: newFolder.id,
          name: newFolder.name,
          parentId: newFolder.parentId ?? null,
          allowUpload: true,
          allowSync: true,
        },
      ]);
    } catch (err) {
      console.error("❌ Lỗi khi tạo thư mục:", err);
      alert("Không thể tạo thư mục. Vui lòng thử lại.");
    }
  };


  const handleUpdateFolder = (updated: Folder) => {
    setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDeleteFolder = (id: number) => {
    if (!confirm("Xoá thư mục và toàn bộ ảnh?")) return;

    const deleteRecursively = (fid: number, list: Folder[]): Folder[] => {
      const children = list.filter((f) => f.parentId === fid);
      let newList = list.filter((f) => f.id !== fid);
      for (const c of children) {
        newList = deleteRecursively(c.id, newList);
      }
      return newList;
    };

    setFolders((prev) => deleteRecursively(id, prev));
    setImages((prev) => (Array.isArray(prev) ? prev.filter((img) => img.folderId !== id) : []));
  };

  return (
    <div className="flex h-full">
      <FolderTree
        folders={folders}
        selectedId={selectedFolderId}
        onSelectFolder={(id) => navigate(`/folder/${id}`)}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
      />
      <div className="flex-1 p-6 overflow-auto bg-white">
        {loading && <div className="text-blue-500 mb-4">Đang tải...</div>}
        {error && (
          <div className="text-red-600 mb-4">
            {error}
            <button className="ml-2 text-sm underline" onClick={() => setError(null)}>
              Đóng
            </button>
          </div>
        )}
        {selectedFolder && (
          <div className="mb-4">
            <FolderConfig folder={selectedFolder} onUpdate={handleUpdateFolder} />
          </div>
        )}

        <ImageGrid
          folderId={selectedFolderId}
          folders={folders}
          images={images}
          onSyncDrive={handleSyncDrive}
          onSelectFolder={(id) => navigate(`/folder/${id}`)}
          onUploaded={(newImgs) => setImages((prev) => (Array.isArray(prev) ? [...prev, ...newImgs] : newImgs))}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
};

export default Dashboard;
