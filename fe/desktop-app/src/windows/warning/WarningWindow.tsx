import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export default function WarningWindow() {
  // Hàm xử lý khi người dùng chỉ cần lướt chuột qua chiếc hộp cảnh báo
  const handleMouseEnterDismiss = async () => {
    try {
      // Gọi trực tiếp chính thực thể cửa sổ hiện tại để ẩn đi
      const currentWin = getCurrentWebviewWindow();
      await currentWin.hide();
    } catch (error) {
      console.error("Lỗi khi ẩn cửa sổ cảnh báo:", error);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent", // Giữ vùng không gian xung quanh trong suốt hoàn toàn, không chặn chuột
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ⚠️ HỘP CẢNH BÁO PHONG CÁCH WIDGET LƠ LỬNG */}
      <div
        onMouseEnter={handleMouseEnterDismiss} // 🔥 Điểm ăn tiền: Quẹt chuột trúng hộp đỏ là TỰ TẮT lập tức!
        style={{
          background: "#FF4757", // Màu đỏ rực cảnh báo
          border: "4px solid #1E293B",
          borderRadius: "24px",
          padding: "32px 24px",
          textAlign: "center",
          width: "380px",
          // Đổ bóng đậm chất nghệ thuật giống Widget con khỉ
          boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.2), 8px 8px 0px #1E293B",
          cursor: "pointer",
          userSelect: "none",
          // Kích hoạt hiệu ứng nhấp nhô hoạt họa mượt mà
          animation: "warningBounce 0.8s infinite alternate ease-in-out",
          boxSizing: "border-box",
        }}
      >
        {/* ICON VÀ TIÊU ĐỀ CHÍNH */}
        <h1
          style={{
            margin: "0 0 12px 0",
            color: "#FFFFFF",
            fontSize: "28px",
            fontWeight: "900",
            letterSpacing: "1px",
            textShadow: "2px 2px 0px #1E293B",
          }}
        >
          Quay lại làm việc nào! 🚨
        </h1>

        {/* NỘI DUNG NHẮC NHỞ */}
        <p
          style={{
            margin: "0 0 24px 0",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: "bold",
            lineHeight: "1.5",
          }}
        >
          Hình như bạn đang bị xao nhãng ?
        </p>

        {/* CHỦ ĐỀ HƯỚNG DẪN TƯƠNG TÁC NHANH */}
        <div
          style={{
            display: "inline-block",
            background: "#1E293B",
            color: "#FFFFFF",
            fontSize: "13px",
            padding: "8px 16px",
            borderRadius: "12px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          👋 Quẹt chuột vào đây để quay lại
        </div>
      </div>

      {/* ⚡ CÁC STYLE ANIMATION NHẤP NHÔ GIỐNG WIDGET KHỈ */}
      <style>{`
        @keyframes warningBounce {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
