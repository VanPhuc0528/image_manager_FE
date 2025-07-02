import React, { useEffect, useRef, useState } from "react";
import FolderTree from "../components/FolderTree";
import ImageGrid from "../components/ImageGrid";

const CLIENT_ID = "1070318039881-53p11ea9cvllv03g594jg28t7br02kgv.apps.googleusercontent.com";
const DEVELOPER_KEY = "AIzaSyAqWGu8sO8GBBHZYjZ9tvdAjBD4JRptrYs";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

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

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const Dashboard: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([
    { id: 1, name: "Ảnh cá nhân", parentId: null },
    { id: 2, name: "Ảnh sự kiện", parentId: 1 },
    { id: 3, name: "Ảnh học tập", parentId: 1 },
    { id: 4, name: "Thư mục chia sẻ", parentId: null },
  ]);

  const [images, setImages] = useState<ImageItem[]>([
    {
      id: 1,
      name: "anh1.jpg",
      url: "https://via.placeholder.com/150",
      folderId: 1,
    },
  ]);

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const loadApis = () => {
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.onload = () => {
        window.gapi.load("picker", () => {});
      };
      document.body.appendChild(gapiScript);

      const gisScript = document.createElement("script");
      gisScript.src = "https://accounts.google.com/gsi/client";
      document.body.appendChild(gisScript);
    };
    loadApis();
  }, []);

  const handleSyncDrive = () => {
    if (!selectedFolderId) return;

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          accessTokenRef.current = tokenResponse.access_token;
          showPicker(tokenResponse.access_token);
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const showPicker = (accessToken: string) => {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS_IMAGES);
    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(DEVELOPER_KEY)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const newImages = data.docs.map((file: any, index: number) => ({
            id: Date.now() + index,
            name: file.name,
            url: file.thumbnailLink || file.webContentLink || "",
            folderId: selectedFolderId,
          }));
          console.log("🔄 Ảnh đồng bộ từ Google Drive:", newImages);
           setImages((prev) => {
          const updated = [...prev, ...newImages];
          console.log("🖼️ Toàn bộ ảnh sau khi thêm:", updated); // 👈 log kết quả render
          return updated;
        });
        }
        
      })
      .build();
      
      
    picker.setVisible(true);
  };

  const handleAddFolder = (parentId: number | null) => {
    const name = prompt("Tên thư mục:");
    if (!name) return;

    setFolders((prev) => [
      ...prev,
      { id: Date.now(), name, parentId },
    ]);
  };

  const handleDeleteFolder = (id: number) => {
    if (!confirm("Xoá thư mục này và toàn bộ thư mục con?")) return;

    const deleteRecursively = (fid: number, list: Folder[]): Folder[] => {
      const children = list.filter((f) => f.parentId === fid);
      let newList = list.filter((f) => f.id !== fid);
      for (const c of children) {
        newList = deleteRecursively(c.id, newList);
      }
      return newList;
    };

    setFolders((prev) => deleteRecursively(id, prev));
    setImages((prev) => prev.filter((img) => img.folderId !== id));
    setSelectedFolderId(null);
  };

  const handleUpload = (files: FileList) => {
    if (!selectedFolderId) return;
    const newImages = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      url: URL.createObjectURL(file),
      folderId: selectedFolderId,
    }));
    setImages((prev) => [...prev, ...newImages]);
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
        <ImageGrid
          folderId={selectedFolderId}
          folders={folders}
          onSelectFolder={setSelectedFolderId}
          images={images}
          onUpload={handleUpload}
          onSyncDrive={handleSyncDrive}
        />
      </div>
    </div>
  );
};

export default Dashboard;