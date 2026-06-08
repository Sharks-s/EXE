import cv2
import threading
import numpy as np
import mediapipe as mp
import time

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

        # RAM cache — background thread ghi, FE đọc
        self._latest_frame: bytes | None = None
        self._latest_data: dict = self._empty_result("not_started")

    # ── Camera control ─────────────────────────────────

    def start(self) -> bool:
        with self._lock:
            if self._is_running:
                return True
            cap = cv2.VideoCapture(0)
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
        with self._lock:
            self._is_running = False
        if self._thread:
            self._thread.join(timeout=2)
        with self._lock:
            if self._cap:
                self._cap.release()
                self._cap = None
        self._latest_data = self._empty_result("stopped")
        self._latest_frame = None

    def is_running(self) -> bool:
        return self._is_running

    # ── FE đọc ─────────────────────────────────────────

    def get_latest_data(self) -> dict:
        """Đọc kết quả analyze mới nhất từ RAM — cực nhanh."""
        return self._latest_data

    def get_jpeg_frame(self) -> bytes | None:
        """Đọc frame JPEG mới nhất từ RAM để stream."""
        return self._latest_frame

    # ── Background loop ────────────────────────────────

    def _loop(self):
        """Chạy ngầm liên tục: đọc frame → analyze → lưu RAM."""
        while self._is_running:
            with self._lock:
                if not self._cap:
                    break
                ret, frame = self._cap.read()

            if not ret:
                continue

            # 🔥 FIX 1: Lật ảnh dạng gương soi (Mirror Mode) để user căn chỉnh thuận mắt
            frame = cv2.flip(frame, 1)

            # Lưu JPEG frame để stream
            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            self._latest_frame = buf.tobytes()

            # Analyze và lưu kết quả
            self._latest_data = self._analyze(frame)

            # ~15fps là đủ cho setup check, đỡ tốn CPU
            threading.Event().wait(0.066)

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
        
        # 🔥 FIX 2: Ép user ngồi xa (diện tích > 0.04) nhưng KHÔNG ĐƯỢC dí sát mặt quá (diện tích < 0.10)
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