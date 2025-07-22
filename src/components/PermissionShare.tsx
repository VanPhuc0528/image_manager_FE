import React, { useState } from "react";
import {
  Input,
  Button,
  Select,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

interface SharedUser {
  email: string;
  permission: "reader" | "writer" | "deleter";
}

const PermissionShare: React.FC<{
  folderId: number;
  userId: number;
  onSubmit?: () => void;
}> = ({ folderId, userId, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"reader" | "writer" | "deleter">("reader");
  const [sharedList, setSharedList] = useState<SharedUser[]>([]);

  const handleAddUser = () => {
    if (!email) return;

    const newUser: SharedUser = { email, permission };
    setSharedList([...sharedList, newUser]);
    setEmail("");
    setPermission("reader");
  };

  const handleSubmit = async () => {
    const grouped = {
      allow_read: sharedList.filter(u => u.permission === "reader").map(u => u.email),
      allow_write: sharedList.filter(u => u.permission === "writer").map(u => u.email),
      allow_delete: sharedList.filter(u => u.permission === "deleter").map(u => u.email),
    };

    console.log("Danh sách phân quyền gửi lên backend:", grouped);

    await fetch(`${API_URL}/user/${userId}/folder/${folderId}/change_permission/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grouped),
    });

    if (onSubmit) onSubmit();
  };

  return (
    <Card sx={{ p: 2, maxWidth: 500 }}>
      <CardContent>
        <h3>Phân quyền thư mục</h3>

        <Input
          value={email}
          placeholder="Nhập email người dùng"
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />

        <Select
          value={permission}
          onChange={(e) => setPermission(e.target.value as SharedUser["permission"])}
          fullWidth
          sx={{ mt: 2, mb: 2 }}
        >
          <MenuItem value="reader">Người xem</MenuItem>
          <MenuItem value="writer">Người chỉnh sửa</MenuItem>
          <MenuItem value="deleter">Người xoá</MenuItem>
        </Select>

        <Button onClick={handleAddUser} variant="contained" fullWidth>
          Thêm người dùng
        </Button>

        <div style={{ marginTop: 20 }}>
          <strong>Danh sách phân quyền:</strong>
          <ul>
            {sharedList.map((user, idx) => (
              <li key={idx}>
                {user.email} —{" "}
                {user.permission === "reader"
                  ? "Người xem"
                  : user.permission === "writer"
                  ? "Người chỉnh sửa"
                  : "Người xoá"}
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={handleSubmit} variant="contained" color="success" fullWidth sx={{ mt: 2 }}>
          Lưu phân quyền
        </Button>
      </CardContent>
    </Card>
  );
};

export default PermissionShare;
