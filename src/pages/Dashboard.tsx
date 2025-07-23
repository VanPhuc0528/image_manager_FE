import React, { useEffect, useRef, useState } from "react";
import FolderTree from "../components/FolderTree";
import ImageGrid from "../components/ImageGrid";
import FolderConfig from "../components/FolderConfig";
import { useNavigate, useParams } from "react-router-dom";
import type { ImageItem } from "../types";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DEVELOPER_KEY = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;
const SCOPE = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email";
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

  const getCurrentUserId = (): number => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.id || 1;
    } catch {
      return 1;
    }
  };

  const selectedFolderId = id ? parseInt(id) : folders.length > 0 ? folders[0].id : null;
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const userId = getCurrentUserId();
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/user/${userId}/home/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Lỗi tải thư mục");
        const data = await response.json();

        const normalized: Folder[] = data.folders.map((f: any) => ({
          id: f.id,
          name: f.name,
          parentId: f.parentId ?? null,
          allowUpload: true,
          allowSync: true,
        }));

        setFolders(normalized);
      } catch (err) {
        setError("Không thể tải thư mục.");
      }
    };

    fetchFolders();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      if (!selectedFolderId) {
        setImages([]);
        return;
      }
      try {
        const userId = getCurrentUserId();
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/user/${userId}/folder/${selectedFolderId}/images/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Lỗi khi tải ảnh từ server");
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        setError("Không thể tải ảnh từ server.");
      }
    };

    fetchImages();
  }, [selectedFolderId, folders]);

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
        setError("Không thể tải Google APIs.");
      }
    };

    loadApis();
  }, []);

  const handleUpload = async (files: FileList) => {
    if (!selectedFolder?.allowUpload || !selectedFolderId || files.length === 0) return;
    setLoading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/")) throw new Error(`File ${file.name} không hợp lệ`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`File ${file.name} quá lớn`);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("folderId", selectedFolderId.toString());
        formData.append("createdAt", new Date().toISOString());

        console.log("formData:", formData);

        const userId = getCurrentUserId();
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/user/${userId}/upload/img/`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Upload thất bại");
        const result = await res.json();

        return {
          id: result.id,
          image_name: result.name,
          image: result.url,
          folder_id: selectedFolderId,
          created_at: result.created_at,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...newImages]);
    } catch (err: any) {
      setError(err.message || "Lỗi khi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDrive = () => {
    if (!selectedFolderId || !selectedFolder?.allowSync || !window.google?.accounts?.oauth2) return;

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: async (tokenResponse: { access_token: string }) => {
        const accessToken = tokenResponse.access_token;
        accessTokenRef.current = accessToken;
        console.log("Access Token:", accessToken)

        try {
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const userInfo = await userInfoRes.json();
          const driveEmail = userInfo.email;

          const userId = getCurrentUserId();
          const token = localStorage.getItem("token");
          await fetch(`${API_URL}/user/${userId}/sync/save_drive_token/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenResponse.access_token}, ${token}`,
            },
            body: JSON.stringify({ 
              access_token: tokenResponse.access_token,
              user_id: userId,
              drive_email: driveEmail,
             }),
          }). catch((err) => console.error("❌ Lỗi gửi token:", err));

          showPicker(accessToken, driveEmail);
        } catch (err) {
          setError("Không thể lấy thông tin người dùng Google.");
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const showPicker = (accessToken: string, driveEmail: string) => {
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
          const newImages: ImageItem[] = [];

          for (const file of data.docs) {
            const newImg: ImageItem = {
              id: file.id,
              image_name: file.name,
              image: `https://drive.google.com/uc?export=view&id=${file.id}`,
              folder_id: selectedFolderId,
              created_at: new Date().toISOString(),
            };

            const body = JSON.stringify({
              user_id: getCurrentUserId,
              drive_email: driveEmail,
              img_name: file.name,
              img_id: file.id,
              img_folder_id: selectedFolderId,
            })
            console.log("Body", body)

            try {
              const userId = getCurrentUserId();
              const token = localStorage.getItem("token");
              await fetch(`${API_URL}/user/${userId}/sync/img/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}, ${token}`,
                },
                body: JSON.stringify({
                  user_id: userId,
                  drive_email: driveEmail,
                  img_name: file.name,
                  img_id: file.id,
                  img_folder_id: selectedFolderId,
                }),
              });

              newImages.push(newImg);
            } catch (err) {
              console.error("Lỗi khi lưu ảnh:", err);
              setError("Không thể lưu ảnh từ Google Drive.");
            }
          }

          setImages((prev) => [...prev, ...newImages]);
        }
      })
      .build();

    picker.setVisible(true);
  };

  const handleAddFolder = async (parentId: number | null) => {
    const name = prompt("Tên thư mục:");
    if (!name) return;

    const userId = getCurrentUserId();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/user/${userId}/folder/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), parentId: parentId ?? null, owner: userId }),
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
      alert("Không thể tạo thư mục.");
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
    setImages((prev) => prev.filter((img) => img.folder_id !== id));
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
          onUploaded={(newImgs) => setImages((prev) => [...prev, ...newImgs])}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
};

export default Dashboard;
