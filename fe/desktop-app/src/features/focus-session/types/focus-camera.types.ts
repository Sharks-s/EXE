export interface CameraChecks {
  face_centered: boolean;
  close_enough: boolean;
  lighting_ok: boolean;
  shoulders_visible: boolean;
}

export interface CameraStatusResponse {
  face_detected: boolean;
  pitch: number;
  yaw: number;
  checks: CameraChecks;
  all_pass: boolean;
}

export interface CameraStartResponse {
  ok: boolean;
  message: string;
}
