// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Position, PhysicalPosition};
use active_win_pos_rs::get_active_window; 
use std::fs;
use std::path::Path;

// Struct định nghĩa dữ liệu trả về cho Frontend dễ đọc
#[derive(serde::Serialize)]
struct ActiveWindowInfo {
    title: String,
    app_name: String,
}

// Struct trả về cho Frontend: 1 bài hát tìm được trong folder
#[derive(serde::Serialize)]
struct ScannedSong {
    file_path: String,
    file_name: String,
}

const AUDIO_EXTENSIONS: [&str; 5] = ["mp3", "wav", "m4a", "flac", "mp4"];

#[tauri::command]
fn toggle_windows_to_session(app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Không tìm thấy cửa sổ chính 'main'".to_string())?;

    let widget_window = app_handle.get_webview_window("widget")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget'".to_string())?;

    let bubble_window = app_handle.get_webview_window("widget-bubble")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget-bubble'".to_string())?;

    if let Some(monitor) = widget_window.current_monitor().map_err(|e| e.to_string())? {
        let scale_factor = monitor.scale_factor();
        let work_area = monitor.work_area();

        // Canvas window
        let widget_width = (130.0 * scale_factor) as u32;
        let widget_height = (130.0 * scale_factor) as u32;

        let widget_x = work_area.position.x + (work_area.size.width as i32) - (widget_width as i32);
        let widget_y = work_area.position.y + (work_area.size.height as i32) - (widget_height as i32);

        widget_window
            .set_position(Position::Physical(PhysicalPosition { x: widget_x, y: widget_y }))
            .map_err(|e| e.to_string())?;

        // Bubble window — đặt ngay phía trên canvas
        let bubble_width = (180.0 * scale_factor) as u32;
        let bubble_height = (160.0 * scale_factor) as u32;

        let bubble_x = widget_x + (widget_width as i32) - (bubble_width as i32);
        let bubble_y = widget_y - (bubble_height as i32);

        bubble_window
            .set_position(Position::Physical(PhysicalPosition { x: bubble_x, y: bubble_y }))
            .map_err(|e| e.to_string())?;
    }

    main_window.hide().map_err(|e| e.to_string())?;

    widget_window.show().map_err(|e| e.to_string())?;
    widget_window.set_always_on_top(true).map_err(|e| e.to_string())?;

    bubble_window.set_always_on_top(true).map_err(|e| e.to_string())?;
    // Lưu ý: KHÔNG show() bubble ở đây — bubble chỉ show khi có message

    Ok(())
}

// Chỉ khi Frontend gọi, Rust mới kiểm tra ứng dụng đang mở
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

// #[tauri::command]
// fn back_to_widget(app_handle: tauri::AppHandle) -> Result<(), String> {
//     let main_window = app_handle.get_webview_window("main").unwrap();
//     let widget_window = app_handle.get_webview_window("widget").unwrap();

//     main_window.hide().map_err(|e| e.to_string())?;
//     widget_window.show().map_err(|e| e.to_string())?;
//     widget_window.set_always_on_top(true).map_err(|e| e.to_string())?;

//     Ok(())
// }

#[tauri::command]
fn back_to_widget(app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'main'".to_string())?;
    let widget_window = app_handle.get_webview_window("widget")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget'".to_string())?;
    let bubble_window = app_handle.get_webview_window("widget-bubble")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget-bubble'".to_string())?;

    if let Some(monitor) = widget_window.current_monitor().map_err(|e| e.to_string())? {
        let scale_factor = monitor.scale_factor();
        let work_area = monitor.work_area();

        // Canvas window (giữ nguyên logic cũ)
        let widget_width = (130.0 * scale_factor) as u32;
        let widget_height = (130.0 * scale_factor) as u32;

        let widget_x = work_area.position.x + (work_area.size.width as i32) - (widget_width as i32);
        let widget_y = work_area.position.y + (work_area.size.height as i32) - (widget_height as i32);

        widget_window
            .set_position(Position::Physical(PhysicalPosition { x: widget_x, y: widget_y }))
            .map_err(|e| e.to_string())?;

        // Bubble window — đặt ngay phía trên canvas
        let bubble_width = (180.0 * scale_factor) as u32;
        let bubble_height = (160.0 * scale_factor) as u32;

        // Căn lề phải của bubble trùng với lề phải của canvas window
        let bubble_x = widget_x + (widget_width as i32) - (bubble_width as i32);
        // Đặt sát phía trên canvas (không khoảng cách, có thể chỉnh offset sau)
        let bubble_y = widget_y - (bubble_height as i32);

        bubble_window
            .set_position(Position::Physical(PhysicalPosition { x: bubble_x, y: bubble_y }))
            .map_err(|e| e.to_string())?;
    }

    main_window.hide().map_err(|e| e.to_string())?;

    widget_window.show().map_err(|e| e.to_string())?;
    widget_window.set_always_on_top(true).map_err(|e| e.to_string())?;

    bubble_window.set_always_on_top(true).map_err(|e| e.to_string())?;
    // Lưu ý: KHÔNG show() bubble ở đây — bubble chỉ show khi có message (xử lý ở bước sau)

    Ok(())
}

// Mở Folder Picker, quét file audio trong đó (KHÔNG đi vào thư mục con), trả về danh sách cho FE
#[tauri::command]
async fn scan_music_folder(app_handle: tauri::AppHandle) -> Result<Vec<ScannedSong>, String> {
    use tauri_plugin_dialog::DialogExt;

    // Mở dialog chọn thư mục, chờ user chọn xong (blocking trong async command)
    let folder_path = app_handle
        .dialog()
        .file()
        .blocking_pick_folder();

    let folder_path = match folder_path {
        Some(path) => path,
        None => return Ok(vec![]), // User bấm Hủy -> trả về danh sách rỗng, không phải lỗi
    };

    let folder_path_buf = folder_path
        .into_path()
        .map_err(|e| e.to_string())?;

    scan_folder_for_audio(&folder_path_buf)
}

// Hàm thuần đọc thư mục, tách riêng để dễ test/tái sử dụng
fn scan_folder_for_audio(folder_path: &Path) -> Result<Vec<ScannedSong>, String> {
    let entries = fs::read_dir(folder_path).map_err(|e| e.to_string())?;

    let mut songs = Vec::new();

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue, // Bỏ qua file lỗi, không làm chết cả quá trình quét
        };

        let path = entry.path();

        // Chỉ lấy file, bỏ qua thư mục con (non-recursive)
        if !path.is_file() {
            continue;
        }

        let extension = path
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.to_lowercase());

        let is_audio = match &extension {
            Some(ext) => AUDIO_EXTENSIONS.contains(&ext.as_str()),
            None => false,
        };

        if !is_audio {
            continue;
        }

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();

        songs.push(ScannedSong {
            file_path: path.to_string_lossy().to_string(),
            file_name,
        });
    }

    Ok(songs)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())  
        .invoke_handler(tauri::generate_handler![
            toggle_windows_to_session,
            get_active_window_info,
            back_to_widget,
            scan_music_folder  
        ])
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

