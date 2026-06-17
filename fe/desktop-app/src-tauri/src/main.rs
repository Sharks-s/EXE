// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Position, PhysicalPosition};
use active_win_pos_rs::get_active_window; 

// Struct định nghĩa dữ liệu trả về cho Frontend dễ đọc
#[derive(serde::Serialize)]
struct ActiveWindowInfo {
    title: String,
    app_name: String,
}

#[tauri::command]
fn toggle_windows_to_session(app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Không tìm thấy cửa sổ chính 'main'".to_string())?;
        
    let widget_window = app_handle.get_webview_window("widget")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget'".to_string())?;

    if let Some(monitor) = widget_window.current_monitor().map_err(|e| e.to_string())? {
        let scale_factor = monitor.scale_factor();
        let work_area = monitor.work_area(); 

        let widget_width = (200.0 * scale_factor) as u32;
        let widget_height = (260.0 * scale_factor) as u32;

        let x = work_area.position.x + (work_area.size.width as i32) - (widget_width as i32);
        let y = work_area.position.y + (work_area.size.height as i32) - (widget_height as i32);

        widget_window
            .set_position(Position::Physical(PhysicalPosition { x, y }))
            .map_err(|e| e.to_string())?;
    }

    main_window.hide().map_err(|e| e.to_string())?;
    widget_window.show().map_err(|e| e.to_string())?;
    widget_window.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

// 🎯 LỆNH MỚI: Chỉ khi Frontend gọi, Rust mới kiểm tra ứng dụng đang mở
#[tauri::command]
fn get_active_window_info() -> Result<ActiveWindowInfo, String> {
    if let Ok(active_window) = get_active_window() {
        Ok(ActiveWindowInfo {
            title: active_window.title,
            app_name: active_window.app_name,
        })
    } else {
        Err("Không thể lấy thông tin cửa sổ hiện tại".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        // 🔴 Đăng ký hàm mới vào invoke_handler
        .invoke_handler(tauri::generate_handler![toggle_windows_to_session, get_active_window_info])
        .setup(|_app| {
            // ĐÃ XÓA LUỒNG QUÉT NGẦM CŨ Ở ĐÂY SẠCH SẼ!
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}