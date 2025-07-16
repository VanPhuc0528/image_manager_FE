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
  const selectedFolderId = id ? parseInt(id) : null;

  const [folders, setFolders] = useState<Folder[]>([
    { id: 1, name: "Ảnh cá nhân", parentId: null, allowUpload: true, allowSync: true },
    { id: 2, name: "Ảnh sự kiện", parentId: 1, allowUpload: true, allowSync: false },
    { id: 3, name: "Ảnh học tập", parentId: 1, allowUpload: false, allowSync: true },
    { id: 4, name: "Thư mục chia sẻ", parentId: null, allowUpload: true, allowSync: true },
  ]);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const getCurrentUserId = (): number => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.id || 1;
    } catch {
      return 1;
    }
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // Load Google APIs for picker
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

  // Fetch images whenever selectedFolderId changes
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const userId = getCurrentUserId();
        const folderId = selectedFolderId || 1;

        const url = `${API_URL}/${userId}/${folderId}/images`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server trả về lỗi: ${res.status}`);
        const data = await res.json();
        setImages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi khi tải ảnh:", err);
        setError("Không thể tải ảnh từ server.");
      }
    };

    fetchImages();
  }, [selectedFolderId]);

  // Handle upload local files
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
      setImages(prev => (Array.isArray(prev) ? [...prev, ...newImages] : newImages));
    } catch (err: any) {
      setError(err.message || "Lỗi khi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  // Handle sync Google Drive images via picker
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

  // Show Google picker dialog
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

            setImages(prev => (Array.isArray(prev) ? [...prev, ...newImages] : newImages));
          } catch {
            setError("Không thể lưu ảnh từ Google Drive.");
          }
        }
      })
      .build();

    picker.setVisible(true);
  };

  // Folder CRUD handlers
  const handleAddFolder = (parentId: number | null) => {
    const name = prompt("Tên thư mục:");
    if (!name) return;
    setFolders(prev => [
      ...prev,
      {
        id: Date.now(),
        name: name.trim(),
        parentId,
        allowUpload: true,
        allowSync: true,
      },
    ]);
  };

  const handleUpdateFolder = (updated: Folder) => {
    setFolders(prev => prev.map(f => (f.id === updated.id ? updated : f)));
  };

  const handleDeleteFolder = (id: number) => {
    if (!confirm("Xoá thư mục và toàn bộ ảnh?")) return;

    const deleteRecursively = (fid: number, list: Folder[]): Folder[] => {
      const children = list.filter(f => f.parentId === fid);
      let newList = list.filter(f => f.id !== fid);
      for (const c of children) {
        newList = deleteRecursively(c.id, newList);
      }
      return newList;
    };

    setFolders(prev => deleteRecursively(id, prev));
    setImages(prev => (Array.isArray(prev) ? prev.filter(img => img.folderId !== id) : []));
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
          onUploaded={(newImgs) => setImages(prev => (Array.isArray(prev) ? [...prev, ...newImgs] : newImgs))}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
};

export default Dashboard;
