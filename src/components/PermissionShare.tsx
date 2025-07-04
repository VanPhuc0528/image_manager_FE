import React, { useEffect, useState, useCallback } from "react";
import { getPermissions, setPermission } from "../services/permission";

interface PermissionShareProps {
  folderId: number;
}

interface UserPermission {
  email: string;
  permission: "read" | "write";
}

const PermissionShare: React.FC<PermissionShareProps> = ({ folderId }) => {
  const [email, setEmail] = useState("");
  const [permission, setPerm] = useState<"read" | "write">("read");
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getPermissions(folderId);
      setUsers(list);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không thể lấy quyền thư mục.");
      }
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleAdd = async () => {
    if (!email.trim()) return;
    try {
      setLoading(true);
      await setPermission(folderId, email.trim(), permission);
      setEmail("");
      fetchPermissions();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Lỗi khi thêm quyền.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded">
      <h3 className="font-semibold mb-2">🔐 Chia sẻ thư mục</h3>

      <div className="flex gap-2 mb-3">
        <input
          className="border px-2 py-1 flex-1 rounded"
          placeholder="Nhập email người nhận"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          value={permission}
          onChange={(e) => setPerm(e.target.value as "read" | "write")}
          className="border px-2 py-1 rounded"
        >
          <option value="read">Chỉ xem</option>
          <option value="write">Toàn quyền</option>
        </select>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Thêm
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-2">
          {error} <button onClick={() => setError(null)}>✖</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-blue-600">Đang tải quyền...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có người được chia sẻ.</p>
      ) : (
        <ul className="text-sm text-gray-700 space-y-1">
          {users.map((u, i) => (
            <li key={i}>
              👤 {u.email} — quyền:{" "}
              <span className="font-semibold">{u.permission === "read" ? "Xem" : "Toàn quyền"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PermissionShare;
