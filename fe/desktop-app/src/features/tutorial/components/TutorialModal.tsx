import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import i18n from "@/i18n";
import type { Page } from "@/shared/components/Sidebar";
import "./TutorialModal.css";

type Props = {
  open: boolean;
  currentPage: Page;
  isProActive: boolean;
  onNavigate: (page: Page) => void;
  onClose: () => void;
};

type Step = {
  target?: string;
  page?: Page;
  icon: string;
  title: string;
  description: string;
  action?: string;
  placement?: "right" | "left" | "bottom";
};

const COPY = {
  vi: {
    label: "HƯỚNG DẪN TƯƠNG TÁC",
    skip: "Bỏ qua",
    back: "Quay lại",
    next: "Bắt đầu khám phá",
    finish: "Hoàn tất",
    progress: "Bước {{current}} / {{total}}",
    clickHint: "Hãy bấm vào vùng đang sáng để tiếp tục",
    steps: [
      { icon: "touch_app", title: "Cùng thử trực tiếp nhé!", description: "FocusBuddy sẽ chỉ đúng vị trí cần bấm. Bạn hãy thao tác trên giao diện thật để làm quen với toàn bộ ứng dụng." },
      { target: '[data-tutorial="nav-dashboard"]', page: "dashboard", icon: "timer", title: "Mở Phiên tập trung", description: "Đây là màn hình chính để thiết lập công việc và bắt đầu một phiên tập trung.", action: "Bấm Phiên tập trung", placement: "right" },
      { target: '[data-tutorial="goal-option"]', page: "dashboard", icon: "track_changes", title: "Chọn mục tiêu", description: "Chọn một mục tiêu gợi ý. Bạn cũng có thể nhập mục tiêu riêng ở ô phía dưới.", action: "Bấm một mục tiêu", placement: "bottom" },
      { target: '[data-tutorial="duration-option"]', page: "dashboard", icon: "schedule", title: "Chọn thời lượng", description: "Chọn thời gian phù hợp hoặc dùng thanh trượt. Sau đó tiếp tục bấm Bắt đầu để hoàn tất luồng tạo phiên.", action: "Bấm một mốc thời gian", placement: "bottom" },
      { target: '[data-tutorial="start-session"]', page: "dashboard", icon: "rocket_launch", title: "Bắt đầu phiên tập trung", description: "Mọi thứ đã sẵn sàng. Bấm Bắt đầu để vào phiên tập trung và mở widget đồng hành.", action: "Bấm Bắt đầu", placement: "right" },
      { target: '[data-tutorial="camera-permission"]', icon: "photo_camera", title: "Chọn cách sử dụng camera", description: "Cho phép camera để AI hỗ trợ nhận biết tư thế và xao nhãng, hoặc tiếp tục phiên mà không dùng camera.", action: "Chọn một tùy chọn", placement: "right" },
    ] as Step[],
  },
  en: {
    label: "INTERACTIVE TUTORIAL", skip: "Skip", back: "Back", next: "Start exploring", finish: "Finish", progress: "Step {{current}} / {{total}}", clickHint: "Click the highlighted area to continue",
    steps: [
      { icon: "touch_app", title: "Let's try it together!", description: "FocusBuddy will point to the exact controls. Use the real interface to learn the whole app." },
      { target: '[data-tutorial="nav-dashboard"]', page: "dashboard", icon: "timer", title: "Open Focus Session", description: "This is where you set up work and start a focus session.", action: "Click Focus Session", placement: "right" },
      { target: '[data-tutorial="goal-option"]', page: "dashboard", icon: "track_changes", title: "Choose a goal", description: "Select a suggested goal. You can also type a custom one below.", action: "Click a goal", placement: "bottom" },
      { target: '[data-tutorial="duration-option"]', page: "dashboard", icon: "schedule", title: "Choose a duration", description: "Pick a preset or use the slider, then continue with Start to complete the session setup flow.", action: "Click a duration", placement: "bottom" },
      { target: '[data-tutorial="start-session"]', page: "dashboard", icon: "rocket_launch", title: "Start your focus session", description: "Everything is ready. Click Start to enter the focus session and open your companion widget.", action: "Click Start", placement: "right" },
      { target: '[data-tutorial="camera-permission"]', icon: "photo_camera", title: "Choose how to use the camera", description: "Allow camera access so AI can detect posture and distractions, or continue the session without a camera.", action: "Choose an option", placement: "right" },
    ] as Step[],
  },
};

const ANALYTICS_STEPS = {
  vi: {
    free: [
      { target: '[data-tutorial="analytics-header"]', page: "analytics", icon: "insights", title: "Tổng quan Thống kê", description: "Theo dõi hiệu suất theo ngày hoặc tuần. Gói Pro mở thêm các khoảng thời gian phân tích dài hơn.", action: "Bấm khu vực bộ lọc", placement: "bottom" },
      { target: '[data-tutorial="analytics-overview"]', icon: "monitoring", title: "Các chỉ số chính", description: "Xem nhanh thời gian tập trung, số phiên và chuỗi ngày duy trì thói quen.", action: "Bấm vào tổng quan", placement: "bottom" },
      { target: '[data-tutorial="analytics-focus-chart"]', icon: "show_chart", title: "Biểu đồ tập trung", description: "Biểu đồ cho biết thời lượng tập trung thay đổi như thế nào trong khoảng thời gian đã chọn.", action: "Bấm vào biểu đồ", placement: "bottom" },
      { target: '[data-tutorial="analytics-heatmap"]', icon: "workspace_premium", title: "Mở khóa Heatmap với Pro", description: "Nâng cấp Pro để xem nhịp tập trung theo từng ngày trong tháng và nhận ra thói quen dài hạn.", action: "Bấm để xem tiếp", placement: "bottom" },
      { target: '[data-tutorial="analytics-session-review"]', icon: "fact_check", title: "Đánh giá phiên gần đây", description: "Xem chất lượng và mức độ hoàn thành của những phiên tập trung mới nhất.", action: "Bấm vào đánh giá", placement: "bottom" },
      { target: '[data-tutorial="analytics-basic-history"]', icon: "history", title: "Lịch sử cơ bản", description: "Tài khoản thường xem được các phiên gần nhất. Pro mở lịch sử và đánh giá chi tiết hơn.", action: "Bấm vào lịch sử", placement: "bottom" },
      { target: '[data-tutorial="analytics-pro-insights"]', icon: "lock_open", title: "Phân tích chuyên sâu với Pro", description: "Pro mở khóa giờ hiệu quả nhất, ứng dụng gây xao nhãng và phân tích hành vi chi tiết.", action: "Bấm để xem tiếp", placement: "bottom" },
    ] as Step[],
    pro: [
      { target: '[data-tutorial="analytics-header"]', page: "analytics", icon: "insights", title: "Bộ lọc Thống kê Pro", description: "Phân tích dữ liệu theo ngày, tuần, tháng hoặc toàn bộ thời gian.", action: "Bấm khu vực bộ lọc", placement: "bottom" },
      { target: '[data-tutorial="analytics-overview"]', icon: "monitoring", title: "Các chỉ số chính", description: "Tổng hợp thời gian, số phiên, streak và vi phạm trong khoảng đã chọn.", action: "Bấm vào tổng quan", placement: "bottom" },
      { target: '[data-tutorial="analytics-focus-chart"]', icon: "show_chart", title: "Biểu đồ tập trung", description: "So sánh thời lượng tập trung và nhận biết ngày làm việc hiệu quả nhất.", action: "Bấm vào biểu đồ", placement: "bottom" },
      { target: '[data-tutorial="analytics-heatmap"]', icon: "calendar_month", title: "Heatmap tần suất", description: "Quan sát nhịp tập trung từng ngày và chuyển qua các tháng để tìm xu hướng dài hạn.", action: "Bấm vào heatmap", placement: "bottom" },
      { target: '[data-tutorial="analytics-session-review"]', icon: "fact_check", title: "Đánh giá phiên", description: "Theo dõi điểm trung bình và chất lượng các phiên gần đây.", action: "Bấm vào đánh giá", placement: "bottom" },
      { target: '[data-tutorial="analytics-best-hours"]', icon: "schedule", title: "Giờ hiệu quả nhất", description: "Xác định khung giờ bạn tập trung tốt nhất để tối ưu lịch làm việc.", action: "Bấm vào khung giờ", placement: "bottom" },
      { target: '[data-tutorial="analytics-goals"]', icon: "track_changes", title: "Phân tích mục tiêu", description: "So sánh thời gian và số phiên theo từng mục tiêu công việc.", action: "Bấm vào mục tiêu", placement: "bottom" },
      { target: '[data-tutorial="analytics-history"]', icon: "history", title: "Lịch sử chi tiết", description: "Mở từng phiên để xem điểm, nhận xét và các chỉ số chi tiết.", action: "Bấm vào lịch sử", placement: "bottom" },
      { target: '[data-tutorial="analytics-history-detail"]', icon: "fact_check", title: "Đánh giá từng phiên", description: "Chọn một phiên ở danh sách bên trái để xem điểm số, mức độ hoàn thành, thời gian tập trung, số lần bị phạt và nhận xét cải thiện ở phần chi tiết.", action: "Bấm vào phần chi tiết để tiếp tục", placement: "left" },
      { target: '[data-tutorial="analytics-violations"]', icon: "warning", title: "Phân tích xao nhãng", description: "Xem loại vi phạm, thời gian bị trừ và những ứng dụng gây mất tập trung.", action: "Bấm vào chi tiết", placement: "bottom" },
    ] as Step[],
  },
  en: { free: [] as Step[], pro: [] as Step[] },
};

const POST_ANALYTICS_STEPS = {
  vi: [
    { target: '[data-tutorial="nav-settings"]', icon: "tune", title: "Cá nhân hóa Cài đặt", description: "Điều chỉnh toàn bộ trải nghiệm FocusBuddy tại đây.", action: "Bấm Cài đặt", placement: "right" },
    { target: '[data-tutorial="settings-subscription"]', icon: "workspace_premium", title: "Gói tài khoản", description: "Kiểm tra gói hiện tại, quyền lợi sử dụng và trạng thái thuê bao của bạn.", action: "Bấm vào gói tài khoản", placement: "bottom" },
    { target: '[data-tutorial="settings-ai"]', icon: "smart_toy", title: "Cách AI đồng hành", description: "Tùy chỉnh cách xưng hô và phong cách phản hồi của trợ lý AI.", action: "Bấm vào cài đặt AI", placement: "bottom" },
    { target: '[data-tutorial="settings-language"]', icon: "language", title: "Ngôn ngữ và camera", description: "Chọn ngôn ngữ giao diện và thiết lập camera dùng trong phiên tập trung.", action: "Bấm vào khu vực này", placement: "bottom" },
    { target: '[data-tutorial="settings-notifications"]', icon: "notifications", title: "Thông báo", description: "Chọn loại thông báo, âm thanh và khoảng thời gian yên lặng phù hợp.", action: "Bấm vào thông báo", placement: "bottom" },
    { target: '[data-tutorial="settings-security"]', icon: "security", title: "Bảo mật tài khoản", description: "Quản lý mật khẩu, thiết bị đăng nhập và các thao tác bảo mật tài khoản.", action: "Bấm vào bảo mật", placement: "bottom" },
    { target: '[data-tutorial="nav-pet"]', icon: "pets", title: "Khám phá Bạn đồng hành", description: "Trang bị, đổi tên và nâng cấp pet. Hoàn thành phiên và thành tích để nhận Focus Points.", action: "Bấm Bạn đồng hành", placement: "right" },
    { target: '[data-tutorial="pet-stats"]', icon: "monitoring", title: "Chỉ số Bạn đồng hành", description: "Theo dõi cấp độ, kinh nghiệm, trạng thái và tiến trình phát triển của pet.", action: "Bấm vào chỉ số", placement: "bottom" },
    { target: '[data-tutorial="pet-toolbar"]', icon: "tune", title: "Quản lý Pet", description: "Đổi tên, chọn pet đang đồng hành và thực hiện các thao tác quản lý nhanh.", action: "Bấm vào thanh công cụ", placement: "bottom" },
    { target: '[data-tutorial="pet-shop"]', icon: "storefront", title: "Cửa hàng Pet", description: "Dùng Focus Points để mở khóa thêm bạn đồng hành và xem trước hoạt ảnh của chúng.", action: "Bấm vào cửa hàng", placement: "bottom" },
    { target: '[data-tutorial="pet-preview-button"]', icon: "visibility", title: "Xem trước Pet", description: "Bạn có thể xem các chuyển động và biểu cảm của pet trước khi quyết định mua.", action: "Bấm Xem trước", placement: "bottom" },
    { target: '[data-tutorial="pet-preview-close"]', icon: "animation", title: "Hoạt ảnh của Pet", description: "Xem pet khi làm việc, ngủ, tức giận, nhắc nhở và đặt câu hỏi. Khi xem xong, hãy đóng cửa sổ để tiếp tục.", action: "Bấm Đóng để tiếp tục", placement: "left" },
    { target: '[data-tutorial="nav-songs"]', icon: "music_note", title: "Chuẩn bị Âm nhạc", description: "Nghe thử nhạc hệ thống, thêm nhạc từ máy và chọn playlist phát trong lúc tập trung.", action: "Bấm Âm nhạc", placement: "right" },
    { target: '[data-tutorial="music-player"]', icon: "play_circle", title: "Trình phát nhạc", description: "Phát, tạm dừng, chuyển bài và điều chỉnh âm lượng ngay trên trang.", action: "Bấm vào trình phát", placement: "bottom" },
    { target: '[data-tutorial="music-library"]', icon: "library_music", title: "Thư viện nhạc", description: "Duyệt nhạc hệ thống hoặc thêm các tệp âm thanh từ máy của bạn.", action: "Bấm vào thư viện", placement: "bottom" },
    { target: '[data-tutorial="music-playlist"]', icon: "queue_music", title: "Playlist tập trung", description: "Sắp xếp danh sách bài sẽ phát tự động trong phiên tập trung.", action: "Bấm vào playlist", placement: "bottom" },
    { target: '[data-tutorial="nav-feedback"]', icon: "feedback", title: "Gửi Góp ý", description: "Báo lỗi, gửi ý tưởng và theo dõi phản hồi từ đội ngũ FocusBuddy tại đây.", action: "Bấm Góp ý", placement: "right" },
    { target: '[data-tutorial="feedback-summary"]', icon: "support_agent", title: "Trung tâm Góp ý", description: "Xem tổng quan trạng thái các yêu cầu hỗ trợ và phản hồi của bạn.", action: "Bấm vào tổng quan", placement: "bottom" },
    { target: '[data-tutorial="feedback-compose"]', icon: "edit_note", title: "Tạo góp ý mới", description: "Chọn loại vấn đề, nhập nội dung chi tiết và gửi cho đội ngũ hỗ trợ.", action: "Bấm vào biểu mẫu", placement: "bottom" },
    { target: '[data-tutorial="feedback-history"]', icon: "history", title: "Lịch sử góp ý", description: "Theo dõi trạng thái xử lý và xem lại phản hồi cho từng yêu cầu.", action: "Bấm vào lịch sử", placement: "bottom" },
    { target: '[data-tutorial="nav-profile"]', icon: "account_circle", title: "Quản lý Hồ sơ", description: "Xem thông tin cá nhân, thành tích và cập nhật hồ sơ tài khoản của bạn.", action: "Bấm Hồ sơ", placement: "right" },
    { target: '[data-tutorial="profile-hero"]', icon: "badge", title: "Tổng quan Hồ sơ", description: "Xem cấp độ, gói tài khoản, điểm và các chỉ số cá nhân nổi bật.", action: "Bấm vào tổng quan", placement: "bottom" },
    { target: '[data-tutorial="profile-info"]', icon: "person", title: "Thông tin cá nhân", description: "Kiểm tra và cập nhật thông tin cơ bản của tài khoản.", action: "Bấm vào thông tin", placement: "bottom" },
    { target: '[data-tutorial="profile-achievements"]', icon: "emoji_events", title: "Thành tích", description: "Theo dõi huy hiệu đã mở khóa và tiến trình chinh phục các thành tích tiếp theo.", action: "Bấm vào thành tích", placement: "bottom" },
    { target: '[data-tutorial="open-tutorial"]', icon: "school", title: "Bạn đã sẵn sàng!", description: "Bạn luôn có thể mở lại hướng dẫn này từ thanh bên khi cần xem lại các chức năng.", action: "Bấm Hướng dẫn để hoàn tất", placement: "right" },
  ] as Step[],
  en: [
    { target: '[data-tutorial="nav-settings"]', icon: "tune", title: "Personalize Settings", description: "Adjust AI behavior, language, camera, distraction alerts and notifications.", action: "Click Settings", placement: "right" },
    { target: '[data-tutorial="nav-pet"]', icon: "pets", title: "Meet your Companion", description: "Equip, rename and upgrade pets. Earn Focus Points from sessions and achievements.", action: "Click Companion", placement: "right" },
    { target: '[data-tutorial="nav-songs"]', icon: "music_note", title: "Prepare Music", description: "Preview system music, add local tracks and choose a focus playlist.", action: "Click Music", placement: "right" },
    { target: '[data-tutorial="nav-feedback"]', icon: "feedback", title: "Send Feedback", description: "Report issues, share ideas and follow replies from the FocusBuddy team.", action: "Click Feedback", placement: "right" },
    { target: '[data-tutorial="nav-profile"]', icon: "account_circle", title: "Manage your Profile", description: "Review personal information, achievements and update your account profile.", action: "Click Profile", placement: "right" },
    { target: '[data-tutorial="open-tutorial"]', icon: "school", title: "You're ready!", description: "You can reopen this tutorial from the sidebar whenever you need it.", action: "Click Tutorial to finish", placement: "right" },
  ] as Step[],
};

type Position = { top: number; left: number; width: number; height: number; tooltipTop: number; tooltipLeft: number };

export default function TutorialModal({ open, currentPage, isProActive, onNavigate, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);
  const tooltipRef = useRef<HTMLElement>(null);
  const language = i18n.resolvedLanguage?.startsWith("en") ? "en" : "vi";
  const content = COPY[language];
  const analyticsSteps = language === "vi" ? ANALYTICS_STEPS.vi[isProActive ? "pro" : "free"] : ANALYTICS_STEPS.vi[isProActive ? "pro" : "free"];
  const steps = [...content.steps, ...analyticsSteps, ...POST_ANALYTICS_STEPS[language]];
  const step = steps[index];
  const isIntro = index === 0;
  const isLast = index === steps.length - 1;

  const next = () => isLast ? onClose() : setIndex((value) => value + 1);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open || !step.page || currentPage === step.page) return;
    onNavigate(step.page);
  }, [currentPage, onNavigate, open, step.page]);

  useLayoutEffect(() => {
    if (!open || !step.target) { setPosition(null); return; }
    let target: HTMLElement | null = null;
    const update = () => {
      target = document.querySelector<HTMLElement>(step.target!);
      if (!target) { setPosition(null); return; }
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
      const rect = target.getBoundingClientRect();
      const tooltipWidth = Math.min(340, window.innerWidth - 32);
      const tooltipHeight = tooltipRef.current?.getBoundingClientRect().height ?? 270;
      const gap = 18;
      const centeredTop = rect.top + rect.height / 2 - tooltipHeight / 2;
      const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      const candidates = {
        right: { left: rect.right + gap, top: centeredTop },
        left: { left: rect.left - tooltipWidth - gap, top: centeredTop },
        bottom: { left: centeredLeft, top: rect.bottom + gap },
        top: { left: centeredLeft, top: rect.top - tooltipHeight - gap },
      };
      const order = step.placement === "bottom"
        ? [candidates.bottom, candidates.right, candidates.left, candidates.top]
        : step.placement === "left"
          ? [candidates.left, candidates.right, candidates.bottom, candidates.top]
          : [candidates.right, candidates.left, candidates.bottom, candidates.top];
      const fittingPosition = order.find(({ left, top }) =>
        left >= 16 && top >= 16 && left + tooltipWidth <= window.innerWidth - 16 && top + tooltipHeight <= window.innerHeight - 16
      ) ?? order[0];
      let tooltipLeft = fittingPosition.left;
      let tooltipTop = fittingPosition.top;
      tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
      tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16));
      setPosition({ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, tooltipTop, tooltipLeft });
    };
    const timer = window.setTimeout(update, 80);
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const handleClick = (event: MouseEvent) => {
      const element = document.querySelector<HTMLElement>(step.target!);
      if (!element || (event.target !== element && !element.contains(event.target as Node))) return;
      if (step.target === '[data-tutorial="camera-permission"]') {
        document.querySelector<HTMLElement>('[data-tutorial="camera-back"]')?.click();
      }
      window.setTimeout(() => {
        // Giữ modal mở ở bước lịch sử để giới thiệu phần đánh giá bên trong.
        // Chỉ đóng modal sau khi người dùng hoàn tất bước chi tiết, rồi mới
        // chuyển spotlight về thẻ phân tích xao nhãng trên trang Analytics.
        if (step.target === '[data-tutorial="analytics-history-detail"]') {
          document.querySelector<HTMLElement>(".analytics-history-close")?.click();
        }
        next();
      }, 80);
    };
    document.addEventListener("click", handleClick, true);
    return () => { window.clearTimeout(timer); observer.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); document.removeEventListener("click", handleClick, true); };
  }, [open, index, step.target, step.placement]);

  useEffect(() => {
    if (!open) return;
    const keydown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [open, onClose]);

  if (!open) return null;
  if (isIntro) return (
    <div className="tour-intro-overlay" role="dialog" aria-modal="true">
      <section className="tour-intro-card">
        <div className="tour-intro-icon"><span className="material-symbols-outlined">{step.icon}</span></div>
        <span className="tour-label">{content.label}</span><h1>{step.title}</h1><p>{step.description}</p>
        <div className="tour-intro-actions"><button onClick={onClose}>{content.skip}</button><button className="primary" onClick={next}>{content.next}<span className="material-symbols-outlined">arrow_forward</span></button></div>
      </section>
    </div>
  );

  return (
    <div className="guided-tour" role="dialog" aria-modal="true">
      {position && <div className="tour-spotlight" style={{ top: position.top, left: position.left, width: position.width, height: position.height }} />}
      <section ref={tooltipRef} className="tour-tooltip" style={position ? {
        "--tour-tooltip-top": `${position.tooltipTop}px`,
        "--tour-tooltip-left": `${position.tooltipLeft}px`,
      } as CSSProperties : undefined}>
        <header><span className="material-symbols-outlined">{step.icon}</span></header>
        <h2>{step.title}</h2><p>{step.description}</p>
        {step.action && <div className="tour-click-hint"><span className="material-symbols-outlined">touch_app</span><strong>{step.action}</strong><small>{content.clickHint}</small></div>}
        <div className="tour-progress"><i style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
        <footer><button onClick={() => setIndex((value) => Math.max(0, value - 1))}>{content.back}</button><button className="tour-skip" onClick={onClose}>{content.skip}</button>{isLast && <button className="tour-finish" onClick={onClose}>{content.finish}</button>}</footer>
      </section>
    </div>
  );
}
