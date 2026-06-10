// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Position, PhysicalPosition};

#[tauri::command]
fn toggle_windows_to_session(app_handle: tauri::AppHandle) -> Result<(), String> {
    // 1. Lấy handle của 2 cửa sổ dựa trên label định nghĩa trong tauri.conf.json
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Không tìm thấy cửa sổ chính 'main'".to_string())?;
        
    let widget_window = app_handle.get_webview_window("widget")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget' trong tauri.conf.json".to_string())?;

    // 2. TÍNH TOÁN VỊ TRÍ GĂM WIDGET NẰM TRÊN TASKBAR GÓC PHẢI
    if let Some(monitor) = widget_window.current_monitor().map_err(|e| e.to_string())? {
        let scale_factor = monitor.scale_factor(); // Tỉ lệ scale màn hình (100%, 125%, 150%...)
        
        // Lấy vùng làm việc thực tế (Đã tự động trừ đi độ dày của thanh Taskbar Windows)
        let work_area = monitor.work_area(); 

        // 🔥 ĐÃ CẬP NHẬT: Đổi kích thước thành 160x160 cho khớp với tauri.conf.json
        let widget_width = (160.0 * scale_factor) as u32;
        let widget_height = (160.0 * scale_factor) as u32;
        
        // Khoảng cách đệm từ viền vào cho đẹp (10px)
        let margin = (10.0 * scale_factor) as u32; 

        // 1. Tính toán tọa độ đặt Widget theo công thức chuẩn trước
        let base_x = work_area.position.x + (work_area.size.width as i32) - (widget_width as i32) - (margin as i32);
        let base_y = work_area.position.y + (work_area.size.height as i32) - (widget_height as i32) - (margin as i32);

        // 2. 🔥 BÙ SAI LỆCH: Cộng thêm tọa độ để ép sát xuống dưới và sát sang phải
        // Tăng X => Cửa sổ dịch sang PHẢI. Tăng Y => Cửa sổ dịch xuống DƯỚI.
        let x = base_x + (20.0 * scale_factor) as i32;
        let y = base_y + (20.0 * scale_factor) as i32;

        // Ép vị trí vật lý chuẩn xác cho Widget trước khi hiển thị
        widget_window
            .set_position(Position::Physical(PhysicalPosition { x, y }))
            .map_err(|e| e.to_string())?;
    }

    // 3. Tiến hành ẩn Dashboard và hiện + focus vào Widget
    main_window.hide().map_err(|e| e.to_string())?;
    widget_window.show().map_err(|e| e.to_string())?;
    widget_window.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![toggle_windows_to_session])
        .setup(|app| {
            if let Some(main_window) = app.get_webview_window("main") {
                main_window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}