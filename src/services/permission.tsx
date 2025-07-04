const API_BASE = "http://localhost:8000/api";

export interface PermissionItem {
  email: string;
  permission: "read" | "write";
}

/**
 * Lấy danh sách quyền truy cập thư mục
 */
export async function getPermissions(folderId: number): Promise<PermissionItem[]> {
  const res = await fetch(`${API_BASE}/permissions?folderId=${folderId}`);
  if (!res.ok) {
    throw new Error("Không thể lấy danh sách phân quyền");
  }
  return await res.json();
}

/**
 * Gán quyền cho người dùng vào thư mục
 */
export async function setPermission(
  folderId: number,
  email: string,
  permission: "read" | "write"
): Promise<void> {
  const res = await fetch(`${API_BASE}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ folderId, email, permission }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Không thể gán quyền: ${errText}`);
  }
}
