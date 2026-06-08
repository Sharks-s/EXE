// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager; // 1. Import Manager để dùng được hàm get_webview_window

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // 2. Lấy cửa sổ chính có nhãn là "main" ra
            // Nếu trong tauri.conf.json bạn đặt tên khác thì sửa chữ "main" này lại nhé
            if let Some(main_window) = app.get_webview_window("main") {
                // 3. Ép bung DevTools ngay từ giây đầu tiên mở app
                main_window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}