const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export interface PermissionItem {
  email: string;
  permissions: ("read" | "write" | "delete")[];
}

export async function getPermissions(folderId: number, userId: number): Promise<PermissionItem[]> {
  const res = await fetch(`${API_URL}/user/${userId}/folder/${folderId}/permissions`);
  if (!res.ok) throw new Error("Không thể lấy danh sách phân quyền");
  return await res.json();
}

export async function setPermission(
  folderId: number,
  userId: number,
  permissionData: {
    allow_read: string[];
    allow_write: string[];
    allow_delete: string[];
  }
): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/user/${userId}/folder/${folderId}/change_permission/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(permissionData),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể cập nhật quyền: ${errText}`);
  }
}
