import { useAuthStore } from "../../auth/stores/authStore";

// Placeholder — sẽ build sau khi auth xong
export default function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div style={{ padding: 32 }}>
      <h1>Xin chào, {user?.displayName} 👋</h1>
      <p>Dashboard đang được xây dựng...</p>
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}
