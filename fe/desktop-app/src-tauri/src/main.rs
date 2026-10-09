// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager, Position, PhysicalPosition};
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

    main_window.set_skip_taskbar(false).map_err(|e| e.to_string())?;
    widget_window.set_skip_taskbar(false).map_err(|e| e.to_string())?;
    bubble_window.set_skip_taskbar(true).map_err(|e| e.to_string())?;
    if let Some(widget_taskbar_state) = app_handle.try_state::<WidgetTaskbarState>() {
        if let Ok(mut last_widget_show) = widget_taskbar_state.0.lock() {
            *last_widget_show = Instant::now();
        }
    }
    main_window.hide().map_err(|e| e.to_string())?;
    widget_window.show().map_err(|e| e.to_string())?;
    widget_window.set_always_on_top(true).map_err(|e| e.to_string())?;
    bubble_window.set_always_on_top(true).map_err(|e| e.to_string())?;

    Ok(())
}

// Chỉ khi Frontend gọi, Rust mới kiểm tra ứng dụng đang mở
#[tauri::command]
fn restore_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    let main_window = app_handle.get_webview_window("main")
        .ok_or_else(|| "Khong tim thay cua so chinh 'main'".to_string())?;

    main_window.set_skip_taskbar(false).map_err(|e| e.to_string())?;
    main_window.show().map_err(|e| e.to_string())?;
    let _ = main_window.set_focus();

    if let Some(widget_window) = app_handle.get_webview_window("widget") {
        widget_window.hide().map_err(|e| e.to_string())?;
        widget_window.set_skip_taskbar(true).map_err(|e| e.to_string())?;
    }

    if let Some(bubble_window) = app_handle.get_webview_window("widget-bubble") {
        bubble_window.hide().map_err(|e| e.to_string())?;
        bubble_window.set_skip_taskbar(true).map_err(|e| e.to_string())?;
    }

    let _ = app_handle.emit("widget-active-state", serde_json::json!({ "active": false }));

    Ok(())
}

fn is_cursor_over_window(window: &tauri::WebviewWindow) -> bool {
    let cursor = match window.cursor_position() {
        Ok(position) => position,
        Err(_) => return false,
    };
    let position = match window.outer_position() {
        Ok(position) => position,
        Err(_) => return false,
    };
    let size = match window.outer_size() {
        Ok(size) => size,
        Err(_) => return false,
    };

    let left = position.x as f64;
    let top = position.y as f64;
    let right = left + size.width as f64;
    let bottom = top + size.height as f64;

    cursor.x >= left && cursor.x <= right && cursor.y >= top && cursor.y <= bottom
}

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
struct WidgetTaskbarState(Mutex<Instant>);

static SIDECAR_CLEANED: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Chạy taskkill ẩn (không bật cửa sổ console trong bản release).
#[cfg(windows)]
fn run_taskkill(args: &[&str]) -> std::io::Result<std::process::Output> {
    use std::os::windows::process::CommandExt;
    std::process::Command::new("taskkill")
        .args(args)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
}

#[cfg(windows)]
fn kill_windows_process_tree(pid: u32) {
    let pid_str = pid.to_string();
    match run_taskkill(&["/PID", &pid_str, "/T", "/F"]) {
        Ok(output) if output.status.success() => {
            println!("[Sidecar] Killed sidecar process tree with taskkill. PID = {}", pid);
        }
        Ok(output) => {
            eprintln!(
                "[Sidecar] taskkill failed for PID {}: {}",
                pid,
                String::from_utf8_lossy(&output.stderr)
            );
        }
        Err(err) => {
            eprintln!("[Sidecar] Failed to run taskkill for PID {}: {}", pid, err);
        }
    }
}

#[cfg(windows)]
fn kill_lingering_sidecars() {
    for image_name in [
        "focusbuddy-bot.exe",
        "focusbuddy-bot-x86_64-pc-windows-msvc.exe",
        "focus-bot.exe",
    ] {
        let _ = run_taskkill(&["/IM", image_name, "/T", "/F"]);
    }
}

/// Gắn sidecar vào một Job Object có cờ KILL_ON_JOB_CLOSE.
/// Handle của job được giữ mở đến khi process FocusBuddy kết thúc; lúc đó Windows
/// tự kill toàn bộ process trong job (kể cả process con do PyInstaller tạo ra),
/// kể cả khi app bị crash hoặc bị End task trong Task Manager.
#[cfg(windows)]
fn bind_sidecar_to_app_lifetime(pid: u32) {
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_SET_QUOTA, PROCESS_TERMINATE,
    };

    unsafe {
        let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
        if job.is_null() {
            eprintln!("[Sidecar] CreateJobObjectW failed");
            return;
        }

        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        let ok = SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            &info as *const _ as *const std::ffi::c_void,
            std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
        );
        if ok == 0 {
            eprintln!("[Sidecar] SetInformationJobObject failed");
            CloseHandle(job);
            return;
        }

        let process = OpenProcess(PROCESS_SET_QUOTA | PROCESS_TERMINATE, 0, pid);
        if process.is_null() {
            eprintln!("[Sidecar] OpenProcess failed for PID {}", pid);
            CloseHandle(job);
            return;
        }

        if AssignProcessToJobObject(job, process) == 0 {
            eprintln!("[Sidecar] AssignProcessToJobObject failed for PID {}", pid);
            CloseHandle(job);
        } else {
            println!("[Sidecar] Bound sidecar PID {} to app lifetime (job object)", pid);
            // Cố ý KHÔNG đóng `job`: handle phải sống đến khi app thoát.
        }
        CloseHandle(process);
    }
}

/// Tắt focusbuddy-bot. Gọi trước khi app thoát ở mọi đường thoát.
fn cleanup_sidecar(app_handle: &tauri::AppHandle, reason: &str) {
    if SIDECAR_CLEANED.swap(true, std::sync::atomic::Ordering::SeqCst) {
        return;
    }

    if let Some(sidecar_state) = app_handle.try_state::<SidecarState>() {
        if let Ok(mut guard) = sidecar_state.0.lock() {
            if let Some(child) = guard.take() {
                let pid = child.pid();

                #[cfg(windows)]
                kill_windows_process_tree(pid);

                let _ = child.kill();

                println!("[Sidecar] Cleaned up sidecar on {}. PID = {}", reason, pid);
            }
        }
    }

    // Fallback: dọn mọi process bot còn sót (VD: process con của PyInstaller onefile)
    #[cfg(windows)]
    kill_lingering_sidecars();
}

/// Thoát hẳn app: tắt bot trước, sau đó mới exit.
fn shutdown_app(app_handle: &tauri::AppHandle, reason: &str) {
    cleanup_sidecar(app_handle, reason);
    app_handle.exit(0);
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
.plugin(tauri_plugin_oauth::init())
        .invoke_handler(tauri::generate_handler![
            toggle_windows_to_session,
            restore_main_window,
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
            app.manage(WidgetTaskbarState(Mutex::new(Instant::now())));

            // Tự động chạy Python bot local khi app khởi động
            println!("[Sidecar] Đang khởi chạy focusbuddy-bot...");
            #[cfg(windows)]
            kill_lingering_sidecars();

            match app_handle.shell().sidecar("focusbuddy-bot") {
                Ok(sidecar) => match sidecar.spawn() {
                    Ok((mut rx, child)) => {
                        let pid = child.pid();
                        println!("[Sidecar] Spawn focusbuddy-bot thành công! PID = {}", pid);

                        #[cfg(windows)]
                        bind_sidecar_to_app_lifetime(pid);

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
            let devtools_item = MenuItemBuilder::with_id("open_devtools", "Open DevTools").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Exit").build(app)?;
            let tray_menu = MenuBuilder::new(app).items(&[&devtools_item, &quit_item]).build()?;

            if let Some(tray) = app.tray_by_id("main") {
                let _ = tray.set_menu(Some(tray_menu));
                let _ = tray.set_show_menu_on_left_click(true);
                tray.on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "open_devtools" => {
                            if let Some(main_window) = app.get_webview_window("main") {
                                main_window.open_devtools();
                            }
                        }
                        "quit" => {
                            shutdown_app(app, "tray exit");
                        }
                        _ => {}
                    }
                });
            }

            if let Some(widget_window) = app_handle.get_webview_window("widget") {
                let last_move = Arc::new(Mutex::new(Instant::now()));

                widget_window.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::Moved(position) => {
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
                        tauri::WindowEvent::Focused(true) => {
                            let outside_widget = app_handle
                                .get_webview_window("widget")
                                .map(|window| !is_cursor_over_window(&window))
                                .unwrap_or(true);

                            let should_restore = outside_widget && app_handle
                                .try_state::<WidgetTaskbarState>()
                                .and_then(|state| state.0.lock().ok().map(|last| last.elapsed()))
                                .map(|elapsed| elapsed >= Duration::from_millis(700))
                                .unwrap_or(true);

                            if should_restore {
                                let app_handle = app_handle.clone();
                                let restore_app_handle = app_handle.clone();
                                let _ = app_handle.run_on_main_thread(move || {
                                    let _ = restore_main_window(restore_app_handle);
                                });
                            }
                        }
                        _ => {}
                    }
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match &event {
        // Cửa sổ main bị đóng hẳn (sau khi FE xử lý close guard xong) -> thoát toàn bộ app.
        // Nếu không, các cửa sổ ẩn (widget, warning, bubble) giữ app và bot tiếp tục chạy.
        tauri::RunEvent::WindowEvent {
            label,
            event: tauri::WindowEvent::Destroyed,
            ..
        } if label == "main" => {
            shutdown_app(app_handle, "main window closed");
        }
        tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
            cleanup_sidecar(app_handle, "app exit");
        }
        _ => {}
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



