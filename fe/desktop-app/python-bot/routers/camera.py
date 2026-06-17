# routers/camera.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import time
import asyncio


from detectors.face_detector import face_detector

router = APIRouter(prefix="/bot/camera", tags=["camera"])

# ── Response models ────────────────────────────────────

class StartResponse(BaseModel):
    ok: bool
    message: str

class StatusResponse(BaseModel):
    face_detected: bool
    pitch: float
    yaw: float
    checks: dict   # face_centered, close_enough, lighting_ok, shoulders_visible
    all_pass: bool

# ── Endpoints ──────────────────────────────────────────

@router.post("/start", response_model=StartResponse)
def start_camera():
    """FE gọi khi user bấm 'Chuẩn bị tập trung'."""
    success = face_detector.start()
    if not success:
        raise HTTPException(
            status_code=503,
            detail="Không thể mở camera. Kiểm tra lại thiết bị."
        )
    return StartResponse(ok=True, message="Camera started")

@router.post("/stop", response_model=StartResponse)
def stop_camera():
    """FE gọi khi user bấm Hủy hoặc kết thúc phiên."""
    face_detector.stop()
    return StartResponse(ok=True, message="Camera stopped")

@router.get("/status", response_model=StatusResponse)
def get_status():
    """
    FE poll mỗi 500ms để cập nhật 4 checklist items + pitch/yaw.
    Lấy data tĩnh cực nhanh từ RAM do luồng chạy nền tính sẵn.
    """
    if not face_detector.is_running():
        raise HTTPException(status_code=400, detail="Camera chưa được bật")
    
    result = face_detector.get_latest_data()
    return StatusResponse(**{k: result[k] for k in StatusResponse.model_fields})

@router.get("/stream")
async def stream():  # <--- Thêm chữ async ở đây
    """
    MJPEG stream — FE dùng <img src="http://localhost:8000/bot/camera/stream" />
    Đã được tối ưu hóa Async để chống sập socket khi re-render.
    """
    if not face_detector.is_running():
        raise HTTPException(status_code=400, detail="Camera chưa được bật")

    async def generate():  # <--- Thêm chữ async ở đây
        try:
            while face_detector.is_running():
                frame = face_detector.get_jpeg_frame()
                if frame:
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n"
                        + frame +
                        b"\r\n"
                    )
                # Thay thế time.sleep bằng await asyncio.sleep 
                # Nhường luồng cho các API khác như /status chạy song song và bắt sự kiện Disconnect
                await asyncio.sleep(0.033)  
        except (asyncio.CancelledError, Exception) as e:
            # Khi thẻ <img> bên React biến mất, code sẽ nhảy vào đây
            print(f"[Stream] Client disconnected or stream cancelled: {e}")
        finally:
            print("[Stream] Stream generator stopped and cleaned up safely.")

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )