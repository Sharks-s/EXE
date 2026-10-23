const CAMERA_INDEX_STORAGE_KEY = "focusbuddy_camera_index";

export const getPreferredCameraIndex = () => {
  const storedValue = Number.parseInt(
    localStorage.getItem(CAMERA_INDEX_STORAGE_KEY) ?? "",
    10,
  );

  return Number.isNaN(storedValue) ? null : storedValue;
};

export const savePreferredCameraIndex = (index: number) => {
  localStorage.setItem(CAMERA_INDEX_STORAGE_KEY, String(index));
};
