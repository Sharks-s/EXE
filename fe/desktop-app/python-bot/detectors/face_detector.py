import cv2
import threading
import time
import numpy as np
import mediapipe as mp

# Định vị các điểm mốc trên khuôn mặt theo MediaPipe FaceMesh chuẩn để tính Head Pose
# 1: Mũi, 33: Khóe mắt trái, 263: Khóe mắt phải, 61: Khóe miệng trái, 291: Khóe miệng phải, 199: Cằm
POSE_POINTS = [1, 33, 263, 61, 291, 199]

class FaceDetector:
    def __init__(self):
        self._cap: cv2.VideoCapture | None = None
        self._lock = threading.Lock()
        self._is_running = False
        self._thread: threading.Thread | None = None

        self._face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,  # Tăng nhẹ để tránh bắt nhầm nhiễu nền
            min_tracking_confidence=0.6,
        )

        self._latest_frame = None
        self._latest_data: dict = self._empty_result("not_started")

    # ── Camera control ─────────────────────────────────

    def start(self) -> bool:
        with self._lock:
            if self._is_running:
                return True

            if self._cap is None:
                # Dùng CAP_DSHOW trên Windows giúp khởi động camera nhanh hơn
                cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                if not cap.isOpened():
                    return False
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self._cap = cap

            self._is_running = True
            self._thread = threading.Thread(target=self._loop, daemon=True)
            self._thread.start()
        return True

    def stop(self):
        """Dừng hoàn toàn vòng lặp xử lý và giải phóng phần cứng camera ngay lập tức."""
        thread_to_join = None
        
        with self._lock:
            self._is_running = False
            thread_to_join = self._thread
            self._thread = None
            
            cap_to_close = self._cap
            self._cap = None  # Xóa trắng ngay lập tức để chặn các đầu đọc khác

        if cap_to_close is not None:
            try:
                cap_to_close.release()
            except Exception as e:
                print(f"[Python] Lỗi khi release camera: {e}")

        if thread_to_join is not None and thread_to_join.is_alive():
            try:
                thread_to_join.join(timeout=1.0)
            except RuntimeError:
                pass

        self._latest_data = self._empty_result("stopped")
        self._latest_frame = None

    def release(self):
        """Giải phóng hoàn toàn khi đóng app."""
        self.stop()

    def is_running(self) -> bool:
        return self._is_running

    # ── FE đọc ─────────────────────────────────────────

    def get_latest_data(self) -> dict:
        return self._latest_data

    def get_jpeg_frame(self) -> bytes | None:
        return self._latest_frame

    # ── Background loop ────────────────────────────────

    def _loop(self):
        while True:
            if not self._is_running:
                break

            with self._lock:
                cap = self._cap
                if cap is None:
                    break

            ret, frame = cap.read()
            if not ret or frame is None:
                break

            # Lật gương hình ảnh để hiển thị tự nhiên với người dùng
            frame = cv2.flip(frame, 1)

            # Phân tích hình ảnh bằng MediaPipe và tính toán checklist trước khi mã hóa hình ảnh công khai
            self._latest_data = self._analyze(frame)

            # Mã hóa JPEG cho luồng MJPEG Stream
            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            self._latest_frame = buf.tobytes()

            # Nghỉ một nhịp ~30fps để giảm tải CPU
            time.sleep(0.033)
            
        with self._lock:
            self._is_running = False
            if self._cap is not None:
                try:
                    self._cap.release()
                except:
                    pass
                self._cap = None

    # ── Core logic ─────────────────────────────────────

    def _analyze(self, frame) -> dict:
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self._face_mesh.process(rgb)

        # Tính toán độ sáng môi trường làm việc
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        lighting_ok = 45 < brightness < 230  # Mở rộng dải sáng một chút để tránh nhận diện quá khắt khe vào ban đêm

        if not results.multi_face_landmarks:
            return {
                "face_detected": False,
                "pitch": 0.0,
                "yaw": 0.0,
                "checks": {
                    "face_centered": False,
                    "close_enough": False,
                    "lighting_ok": lighting_ok,
                    "shoulders_visible": False,
                },
                "all_pass": False,
            }

        lm = results.multi_face_landmarks[0].landmark
        
        # 1. Tính góc quay của đầu (Head Pose)
        pitch, yaw = self._calc_head_pose(lm, w, h)
        # Giới hạn góc nhìn thẳng chuẩn xác: Yaw góc nghiêng trái/phải, Pitch góc ngẩng/cúi
        face_centered = abs(yaw) < 12 and -10 < pitch < 18

        # 2. Tính khoảng cách (Dựa trên tỉ lệ bao phủ khuôn mặt trong khung hình)
        xs = [l.x for l in lm]
        ys = [l.y for l in lm]
        face_area = (max(xs) - min(xs)) * (max(ys) - min(ys))
        # Ngưỡng vàng cho khoảng cách ngồi trước màn hình máy tính (60cm - 80cm)
        close_enough = 0.05 <= face_area <= 0.14

        # 3. Tính toán tư thế ngồi (Kiểm tra xem cằm có bị sát đáy hay khuất không)
        # Điểm số 152 trên FaceMesh là điểm dưới cùng của cằm. 
        # Nếu ngồi thẳng và vai xuất hiện, cằm không được phép vượt quá 82% chiều cao màn hình từ trên xuống.
        chin_landmark = lm[152]
        shoulders_visible = chin_landmark.y < 0.82

        checks = {
            "face_centered": face_centered,
            "close_enough": close_enough,
            "lighting_ok": lighting_ok,
            "shoulders_visible": shoulders_visible,
        }

        return {
            "face_detected": True,
            "pitch": round(pitch, 1),
            "yaw": round(yaw, 1),
            "checks": checks,
            "all_pass": all(checks.values()),
        }

    def _calc_head_pose(self, landmarks, w: int, h: int):
        # Mô hình tọa độ 3D vật lý chuẩn của các điểm mốc trên khuôn mặt người
        model_points = np.array([
            (0.0,    0.0,    0.0),      # Mũi
            (-165.0, 170.0, -135.0),    # Mắt trái
            (165.0,  170.0, -135.0),    # Mắt phải
            (-150.0, -150.0, -125.0),   # Miệng trái
            (150.0,  -150.0, -125.0),   # Miệng phải
            (0.0,    -330.0, -65.0),    # Cằm
        ], dtype=np.float64)

        image_points = np.array([
            (landmarks[i].x * w, landmarks[i].y * h)
            for i in POSE_POINTS
        ], dtype=np.float64)

        focal_length = w
        center = (w / 2, h / 2)
        cam_matrix = np.array([
            [focal_length, 0,            center[0]],
            [0,            focal_length, center[1]],
            [0,            0,            1        ],
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1)) # Giả định camera không bị méo thấu kính hình học
        
        _, rvec, _ = cv2.solvePnP(
            model_points, image_points, cam_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        rmat, _ = cv2.Rodrigues(rvec)
        
        # Trích xuất góc Euler góc quay
        sy = np.sqrt(rmat[0, 0] ** 2 + rmat[1, 0] ** 2)
        pitch = float(np.degrees(np.arctan2(-rmat[2, 0], sy)))
        yaw   = float(np.degrees(np.arctan2(rmat[1, 0], rmat[0, 0])))
        
        # SỬA LỖI LẬT GƯƠNG: Vì ảnh đã lật bằng cv2.flip, trục X bị đảo ngược, ta cần đảo ngược dấu Yaw
        yaw = -yaw
        
        return pitch, yaw

    def _empty_result(self, reason: str) -> dict:
        return {
            "face_detected": False,
            "pitch": 0.0,
            "yaw": 0.0,
            "checks": {
                "face_centered": False,
                "close_enough": False,
                "lighting_ok": False,
                "shoulders_visible": False,
            },
            "all_pass": False,
            "error": reason,
        }

face_detector = FaceDetector()