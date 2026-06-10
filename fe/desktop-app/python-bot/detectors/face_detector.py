import cv2
import threading
import time
import numpy as np
import mediapipe as mp

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
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        self._latest_frame: bytes | None = None
        self._latest_data: dict = self._empty_result("not_started")

    # ── Camera control ─────────────────────────────────

    def start(self) -> bool:
        with self._lock:
            if self._is_running:
                return True

            # Mỗi lần start -> Ép buộc mở kết nối phần cứng mới toanh
            if self._cap is None:
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
        """Dừng hoàn toàn vòng lặp xử lý và giải phóng cứng camera ngay lập tức."""
        thread_to_join = None
        
        # 1. Hạ cờ running và lấy ra camera cần đóng ngay trong lock (nhanh chớp nhoáng)
        with self._lock:
            self._is_running = False
            thread_to_join = self._thread
            self._thread = None
            
            cap_to_close = self._cap
            self._cap = None  # Xóa trắng ngay lập tức để chặn các đầu đọc khác

        # 2. Ra ngoài lock: Cưỡng chế giải phóng phần cứng camera
        # Việc release này sẽ bẻ gãy hàm cap.read() đang bị kẹt ở luồng ngầm ngay tức khắc!
        if cap_to_close is not None:
            try:
                cap_to_close.release()
    
            except Exception as e:
                print(f"[Python] Lỗi khi release camera: {e}")

        # 3. Đợi luồng ngầm kết thúc an toàn
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
            # Check cờ chạy không cần lock để tăng tốc
            if not self._is_running:
                break

            # Lấy handle camera an toàn
            with self._lock:
                cap = self._cap
                if cap is None:
                    break

            # 🛑 ĐƯA LỆNH READ RA NGOÀI LOCK - CHÌA KHÓA CHỐNG DEADLOCK
            ret, frame = cap.read()

            if not ret or frame is None:
                break

            # Xử lý ảnh ảnh lật gương
            frame = cv2.flip(frame, 1)

            # Mã hóa JPEG
            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            self._latest_frame = buf.tobytes()

            # Phân tích hình ảnh bằng MediaPipe
            self._latest_data = self._analyze(frame)

            # Nghỉ một nhịp ~30fps
            time.sleep(0.033)
            
        
        # Dự phòng tự dọn dẹp nếu luồng tự thoát do lỗi phần cứng
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

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        lighting_ok = 60 < brightness < 220

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
        pitch, yaw = self._calc_head_pose(lm, w, h)
        face_centered = abs(yaw) < 15 and abs(pitch) < 20

        xs = [l.x for l in lm]
        ys = [l.y for l in lm]
        face_area = (max(xs) - min(xs)) * (max(ys) - min(ys))
        close_enough = 0.04 <= face_area <= 0.10

        face_center_y = (min(ys) + max(ys)) / 2
        shoulders_visible = face_center_y < 0.45

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
        model_points = np.array([
            (0.0,    0.0,    0.0),
            (-165.0, 170.0, -135.0),
            (165.0,  170.0, -135.0),
            (-150.0, -150.0, -125.0),
            (150.0,  -150.0, -125.0),
            (0.0,    -330.0, -65.0),
        ], dtype=np.float64)

        image_points = np.array([
            (landmarks[i].x * w, landmarks[i].y * h)
            for i in POSE_POINTS
        ], dtype=np.float64)

        focal = w
        cam_matrix = np.array([
            [focal, 0,     w / 2],
            [0,     focal, h / 2],
            [0,     0,     1    ],
        ], dtype=np.float64)

        dist = np.zeros((4, 1))
        _, rvec, _ = cv2.solvePnP(
            model_points, image_points, cam_matrix, dist,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        rmat, _ = cv2.Rodrigues(rvec)
        sy = np.sqrt(rmat[0, 0] ** 2 + rmat[1, 0] ** 2)
        pitch = float(np.degrees(np.arctan2(-rmat[2, 0], sy)))
        yaw   = float(np.degrees(np.arctan2(rmat[1, 0], rmat[0, 0])))
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