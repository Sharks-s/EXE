// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Position, PhysicalPosition};
use tauri_plugin_store::StoreExt;
use active_win_pos_rs::get_active_window;
use std::fs;
use std::path::Path;
use tauri::path::BaseDirectory;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri_plugin_shell::ShellExt;


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
const WIDGET_SIZE: f64 = 130.0;
const BUBBLE_WIDTH: f64 = 180.0;
const BUBBLE_HEIGHT: f64 = 160.0;
const STORE_FILE: &str = "widget-position.json";


#[tauri::command]
fn toggle_windows_to_session(app_handle: tauri::AppHandle) -> Result<(), String> {
    position_widget_and_bubble(&app_handle)?;

    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Không tìm thấy cửa sổ chính 'main'".to_string())?;
    let widget_window = app_handle.get_webview_window("widget")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget'".to_string())?;
    let bubble_window = app_handle.get_webview_window("widget-bubble")
        .ok_or_else(|| "Không tìm thấy cấu hình cửa sổ 'widget-bubble'".to_string())?;

    main_window.hide().map_err(|e| e.to_string())?;
    widget_window.show().map_err(|e| e.to_string())?;
    widget_window.set_always_on_top(true).map_err(|e| e.to_string())?;
    bubble_window.set_always_on_top(true).map_err(|e| e.to_string())?;

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
#[tauri::command]
fn back_to_widget(app_handle: tauri::AppHandle) -> Result<(), String> {
    toggle_windows_to_session(app_handle)
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

#[tauri::command]
fn scan_system_sounds_folder(app_handle: tauri::AppHandle) -> Result<Vec<ScannedSong>, String> {
    let resource_path = app_handle
        .path()
        .resolve("resources/system-sounds", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    scan_folder_for_audio(&resource_path)
}

use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri::menu::{MenuBuilder, MenuItemBuilder};

struct SidecarState(Mutex<Option<CommandChild>>);

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
.plugin(tauri_plugin_oauth::init())
        .invoke_handler(tauri::generate_handler![
            toggle_windows_to_session,
            get_active_window_info,
            back_to_widget,
            scan_music_folder,
            scan_system_sounds_folder,
            save_widget_position,
            reposition_bubble,
            reset_widget_position
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Tự động chạy Python bot local khi app khởi động
            println!("[Sidecar] Đang khởi chạy focusbuddy-bot...");
            match app_handle.shell().sidecar("focusbuddy-bot") {
                Ok(sidecar) => match sidecar.spawn() {
                    Ok((mut rx, child)) => {
                        let pid = child.pid();
                        println!("[Sidecar] Spawn focusbuddy-bot thành công! PID = {}", pid);

                        // Giữ child sống suốt vòng đời app trong App State
                        app.manage(SidecarState(Mutex::new(Some(child))));

                        // Lắng nghe stdout/stderr/terminated từ bot để in ra terminal dev
                        tauri::async_runtime::spawn(async move {
                            while let Some(event) = rx.recv().await {
                                match event {
                                    CommandEvent::Stdout(bytes) => {
                                        print!("[Sidecar stdout] {}", String::from_utf8_lossy(&bytes));
                                    }
                                    CommandEvent::Stderr(bytes) => {
                                        eprint!("[Sidecar stderr] {}", String::from_utf8_lossy(&bytes));
                                    }
                                    CommandEvent::Error(err) => {
                                        eprintln!("[Sidecar error] {}", err);
                                    }
                                    CommandEvent::Terminated(payload) => {
                                        eprintln!(
                                            "[Sidecar terminated] Process kết thúc với exit code: {:?}",
                                            payload.code
                                        );
                                    }
                                    _ => {}
                                }
                            }
                        });
                    }
                    Err(e) => {
                        eprintln!("[Sidecar Error] Lỗi khi spawn focusbuddy-bot: {}", e);
                    }
                },
                Err(e) => {
                    eprintln!("[Sidecar Error] Lỗi cấu hình sidecar focusbuddy-bot: {}", e);
                }
            }

            // Cấu hình menu cho System Tray
            let quit_item = MenuItemBuilder::with_id("quit", "Exit").build(app)?;
            let tray_menu = MenuBuilder::new(app).items(&[&quit_item]).build()?;

            if let Some(tray) = app.tray_by_id("main") {
                let _ = tray.set_menu(Some(tray_menu));
                let _ = tray.set_show_menu_on_left_click(true);
                tray.on_menu_event(|app, event| {
                    if event.id().as_ref() == "quit" {
                        if let Some(sidecar_state) = app.try_state::<SidecarState>() {
                            if let Ok(mut guard) = sidecar_state.0.lock() {
                                if let Some(child) = guard.take() {
                                    let _ = child.kill();
                                    println!("[Sidecar] Đã dọn dẹp (kill) process sidecar khi bấm Exit ở tray.");
                                }
                            }
                        }
                        app.exit(0);
                    }
                });
            }

            if let Some(widget_window) = app_handle.get_webview_window("widget") {
                let last_move = Arc::new(Mutex::new(Instant::now()));

                widget_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Moved(position) = event {
                        *last_move.lock().unwrap() = Instant::now();
                        let (x, y) = (position.x, position.y);
                        let app_handle = app_handle.clone();
                        let last_move_ref = last_move.clone();

                        std::thread::spawn(move || {
                            std::thread::sleep(Duration::from_millis(300));
                            if last_move_ref.lock().unwrap().elapsed() >= Duration::from_millis(300) {
                                let _ = save_widget_position(app_handle.clone(), x, y);
                                // Đặt lại bubble theo vị trí widget mới, chạy trên main thread
                                let _ = app_handle.run_on_main_thread({
                                    let app_handle = app_handle.clone();
                                    move || {
                                        let _ = reposition_bubble(app_handle);
                                    }
                                });
                            }
                        });
                    }
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = &event {
            if let Some(sidecar_state) = app_handle.try_state::<SidecarState>() {
                if let Ok(mut guard) = sidecar_state.0.lock() {
                    if let Some(child) = guard.take() {
                        let _ = child.kill();
                        println!("[Sidecar] Đã dọn dẹp (kill) process sidecar khi thoát app.");
                    }
                }
            }
        }
    });
}


// ── Đọc vị trí đã lưu (nếu có) ──
fn get_saved_widget_position(app_handle: &tauri::AppHandle) -> Option<(i32, i32)> {
    let store = app_handle.store(STORE_FILE).ok()?;
    let x = store.get("x")?.as_i64()? as i32;
    let y = store.get("y")?.as_i64()? as i32;
    Some((x, y))
}

#[tauri::command]
fn save_widget_position(app_handle: tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    let store = app_handle.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.set("x", serde_json::json!(x));
    store.set("y", serde_json::json!(y));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

fn is_position_visible(app_handle: &tauri::AppHandle, x: i32, y: i32, w: i32, h: i32) -> bool {
    // Widget được coi là "còn nhìn thấy" nếu tâm của nó nằm trong work_area của ít nhất 1 monitor
    let center_x = x + w / 2;
    let center_y = y + h / 2;

    if let Ok(monitors) = app_handle.available_monitors() {
        for monitor in monitors {
            let area = monitor.work_area();
            let within_x = center_x >= area.position.x
                && center_x <= area.position.x + area.size.width as i32;
            let within_y = center_y >= area.position.y
                && center_y <= area.position.y + area.size.height as i32;
            if within_x && within_y {
                return true;
            }
        }
    }
    false
}

fn position_widget_and_bubble(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let widget_window = app_handle.get_webview_window("widget")
        .ok_or_else(|| "Không tìm thấy widget".to_string())?;
    let bubble_window = app_handle.get_webview_window("widget-bubble")
        .ok_or_else(|| "Không tìm thấy bubble".to_string())?;

    let monitor = widget_window.current_monitor().map_err(|e| e.to_string())?
        .ok_or_else(|| "Không tìm thấy monitor".to_string())?;
    let scale_factor = monitor.scale_factor();
    let work_area = monitor.work_area();

    let widget_w = (WIDGET_SIZE * scale_factor) as i32;
    let widget_h = (WIDGET_SIZE * scale_factor) as i32;

    let saved = get_saved_widget_position(app_handle);

    let (widget_x, widget_y) = match saved {
        Some((x, y)) if is_position_visible(app_handle, x, y, widget_w, widget_h) => (x, y),
        Some(_) => {
            // Vị trí cũ không còn hợp lệ (VD: tháo màn hình phụ) -> dọn store, dùng mặc định
            if let Ok(store) = app_handle.store(STORE_FILE) {
                store.delete("x");
                store.delete("y");
                let _ = store.save();
            }
            let x = work_area.position.x + work_area.size.width as i32 - widget_w;
            let y = work_area.position.y + work_area.size.height as i32 - widget_h;
            (x, y)
        }
        None => {
            let x = work_area.position.x + work_area.size.width as i32 - widget_w;
            let y = work_area.position.y + work_area.size.height as i32 - widget_h;
            (x, y)
        }
    };

    widget_window
        .set_position(Position::Physical(PhysicalPosition { x: widget_x, y: widget_y }))
        .map_err(|e| e.to_string())?;

    reposition_bubble_only(&bubble_window, widget_x, widget_y, widget_w, scale_factor)?;

    Ok(())
}

fn reposition_bubble_only(
    bubble_window: &tauri::WebviewWindow,
    widget_x: i32,
    widget_y: i32,
    widget_w: i32,
    scale_factor: f64,
) -> Result<(), String> {
    let bubble_w = (BUBBLE_WIDTH * scale_factor) as i32;
    let bubble_h = (BUBBLE_HEIGHT * scale_factor) as i32;

    let bubble_x = widget_x + widget_w - bubble_w;
    let bubble_y = widget_y - bubble_h;

    bubble_window
        .set_position(Position::Physical(PhysicalPosition { x: bubble_x, y: bubble_y }))
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Rust tự reposition bubble khi widget bị kéo (gọi từ frontend sau khi drag xong, hoặc từ on_window_event) ──
#[tauri::command]
fn reposition_bubble(app_handle: tauri::AppHandle) -> Result<(), String> {
    let widget_window = app_handle.get_webview_window("widget")
        .ok_or_else(|| "Không tìm thấy widget".to_string())?;
    let bubble_window = app_handle.get_webview_window("widget-bubble")
        .ok_or_else(|| "Không tìm thấy bubble".to_string())?;

    let pos = widget_window.outer_position().map_err(|e| e.to_string())?;
    let monitor = widget_window.current_monitor().map_err(|e| e.to_string())?
        .ok_or_else(|| "Không tìm thấy monitor".to_string())?;
    let scale_factor = monitor.scale_factor();
    let widget_w = (WIDGET_SIZE * scale_factor) as i32;

    reposition_bubble_only(&bubble_window, pos.x, pos.y, widget_w, scale_factor)
}

#[tauri::command]
fn reset_widget_position(app_handle: tauri::AppHandle) -> Result<(), String> {
    let store = app_handle.store(STORE_FILE).map_err(|e| e.to_string())?;
    store.delete("x");
    store.delete("y");
    store.save().map_err(|e| e.to_string())?;

    // Nếu widget đang hiển thị, dời nó về mặc định ngay để user thấy hiệu ứng tức thì
    position_widget_and_bubble(&app_handle)?;

    Ok(())
}



