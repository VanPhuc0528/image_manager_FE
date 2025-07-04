import React, { useEffect, useRef, useState } from "react";
import FolderTree from "../components/FolderTree";
import ImageGrid from "../components/ImageGrid";
import FolderConfig from "../components/FolderConfig";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1070318039881-53p11ea9cvllv03g594jg28t7br02kgv.apps.googleusercontent.com";
const DEVELOPER_KEY = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY || "AIzaSyAqWGu8sO8GBBHZYjZ9tvdAjBD4JRptrYs";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  allowUpload?: boolean;
  allowSync?: boolean;
}

interface ImageItem {
  id: number;
  name: string;
  url: string;
  folderId: number;
}

interface GooglePickerFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webContentLink?: string;
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
  const [folders, setFolders] = useState<Folder[]>([
    { id: 1, name: "Ảnh cá nhân", parentId: null, allowUpload: true, allowSync: true },
    { id: 2, name: "Ảnh sự kiện", parentId: 1, allowUpload: true, allowSync: false },
    { id: 3, name: "Ảnh học tập", parentId: 1, allowUpload: false, allowSync: true },
    { id: 4, name: "Thư mục chia sẻ", parentId: null, allowUpload: true, allowSync: true },
  ]);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

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

  const handleSyncDrive = () => {
    if (!selectedFolderId || !selectedFolder?.allowSync || !window.google?.accounts?.oauth2) return;

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (tokenResponse: { access_token: string }) => {
        accessTokenRef.current = tokenResponse.access_token;
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
      .setCallback((data: GooglePickerData) => {
        if (data.action === window.google.picker.Action.PICKED && selectedFolderId !== null) {
          const newImages: ImageItem[] = data.docs.map((file, idx) => ({
            id: Date.now() + idx,
            name: file.name,
            url: file.thumbnailLink || file.webContentLink || "",
            folderId: selectedFolderId,
          }));
          setImages(prev => [...prev, ...newImages]);
        }
      })
      .build();

    picker.setVisible(true);
  };

  const handleUpload = async (files: FileList) => {
    if (!selectedFolder?.allowUpload || !selectedFolderId || files.length === 0) return;

    setLoading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        if (!file.type.startsWith("image/")) throw new Error(`File ${file.name} không hợp lệ`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`File ${file.name} quá lớn`);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("folderId", selectedFolderId.toString());

        const res = await fetch("http://localhost:8000/api/images/upload", {
          method: "POST",
          body: formData,
        });

        const contentType = res.headers.get("content-type") || "";

        let result: any = {};
        if (res.ok && contentType.includes("application/json")) {
          result = await res.json();
        } else {
          const text = await res.text();
          console.warn("⚠️ Backend không trả JSON:", text);
          result = {
            name: file.name,
            url: URL.createObjectURL(file),
          };
        }

        return {
          id: Date.now() + idx,
          name: result.name || file.name,
          url: result.url || URL.createObjectURL(file),
          folderId: selectedFolderId,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...newImages]);
    } catch (err: any) {
      setError(err.message || "Lỗi khi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFolder = (parentId: number | null) => {
    const name = prompt("Tên thư mục:");
    if (!name) return;
    setFolders(prev => [
      ...prev,
      { id: Date.now(), name: name.trim(), parentId, allowUpload: true, allowSync: true },
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
      for (const c of children) newList = deleteRecursively(c.id, newList);
      return newList;
    };

    setFolders(prev => deleteRecursively(id, prev));
    setImages(prev => prev.filter(img => img.folderId !== id));
    if (selectedFolderId === id) setSelectedFolderId(null);
  };

  return (
    <div className="flex h-full">
      <FolderTree
        folders={folders}
        selectedId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
      />
      <div className="flex-1 p-6 overflow-auto bg-white">
        {loading && <div className="text-blue-500 mb-4">Đang tải...</div>}
        {error && (
          <div className="text-red-600 mb-4">
            {error}{" "}
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
          onUpload={handleUpload}
          onSyncDrive={handleSyncDrive}
          onSelectFolder={setSelectedFolderId}
        />
      </div>
    </div>
  );
};

export default Dashboard;
