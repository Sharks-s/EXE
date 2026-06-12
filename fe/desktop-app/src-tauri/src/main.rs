// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Position, PhysicalPosition};
use std::thread;
use std::time::Duration;
use active_win_pos_rs::get_active_window; // 🔥 Thêm thư viện lấy active window

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

        let widget_width = (200.0 * scale_factor) as u32;
        let widget_height = (260.0 * scale_factor) as u32;

        // 1. Tính toán tọa độ đặt Widget theo công thức chuẩn trước
        let base_x = work_area.position.x + (work_area.size.width as i32) - (widget_width as i32);
        let base_y = work_area.position.y + (work_area.size.height as i32) - (widget_height as i32);
        // 2. 🔥 BÙ SAI LỆCH: Cộng thêm tọa độ để ép sát xuống dưới và sát sang phảia
        let x = base_x ;
        let y = base_y ;

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

// 🔥 LUỒNG QUÉT NGẦM KIỂM TRA WINDOWS & TAB TRÌNH DUYỆT
fn start_monitoring_thread(app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        // Biến Cache để lưu tiêu đề cũ, tránh việc giây nào cũng lôi warning lên gây giật lag
        let mut last_detected_title = String::new();

        println!("[FocusBuddy Backend] 🚀 Luồng quét ngầm theo dõi xao nhãng đã bật!");

        loop {
            // Định kỳ quét hệ thống mỗi 2 giây
            thread::sleep(Duration::from_secs(2));

            // Hỏi Windows xem ứng dụng nào đang đập vào mắt người dùng (Active)
            if let Ok(active_window) = get_active_window() {
                let window_title = active_window.title; // Tiêu đề tab/cửa sổ (VD: "YouTube")
                let app_name = active_window.app_name;   // Tên file .exe của phần mềm (VD: "chrome.exe")

                // Chuẩn hóa chữ thường để lọc không sợ sót viết hoa viết thường
                let title_lower = window_title.to_lowercase();
                let app_lower = app_name.to_lowercase();

                // 🎯 BỘ LỌC THÔ: Tìm dấu vết xao nhãng (Trình duyệt + App độc lập)
                let is_suspicious = title_lower.contains("youtube") 
                    || title_lower.contains("facebook") 
                    || title_lower.contains("tiktok")
                    || app_lower.contains("discord")
                    || app_lower.contains("steam")
                    || app_lower.contains("league of legends"); // Thêm game gủng thoải mái ở đây

                if is_suspicious {
                    // 🎯 BỘ KIỂM TRA TRÙNG (CACHE): Chỉ xử lý khi họ chuyển sang tab/video mới hẳn
                    if window_title != last_detected_title {
                        println!("[FocusBuddy] 🚨 Phát hiện dấu hiệu xao nhãng mới!");
                        println!(" -> App: {}", app_name);
                        println!(" -> Title: {}", window_title);

                        // Lưu lại tiêu đề vừa bắt được vào bộ nhớ tạm
                        last_detected_title = window_title.clone();

                        // [CHỖ CHỪA CHO SESSION SAU]: Nơi để nhét hàm bốc `window_title` gửi lên Gemini Flash phân tích học/chơi
                        
                        // HIỆN TẠI: Cứ dính lọc thô là gọi kích hoạt cửa sổ warning lơ lửng của bạn lên luôn để test
                        let handle = app_handle.clone();
                        if let Some(warning_window) = handle.get_webview_window("warning") {
                            let _ = warning_window.show();
                            let _ = warning_window.set_focus();
                        }
                    }
                } else {
                    // Nếu người dùng đã tắt tab chơi game/mạng xã hội và quay lại làm việc
                    if !last_detected_title.is_empty() {
                        last_detected_title = String::new(); // Reset cache sạch sẽ
                        println!("[FocusBuddy] ✨ Người dùng đã thoát xao nhãng, reset bộ đệm cache.");
                    }
                }
            }
        }
    });
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![toggle_windows_to_session])
        .setup(|app| {
            if let Some(main_window) = app.get_webview_window("main") {
                main_window.open_devtools();
            }

            // 🔥 KÍCH HOẠT LUỒNG QUÉT NGẦM NGAY KHI APP KHỞI ĐỘNG CHUNG VỚI HỆ THỐNG
            let app_handle = app.handle().clone();
            start_monitoring_thread(app_handle);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}