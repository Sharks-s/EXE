-- Seed 100 positive user feedbacks for landing page testimonials.
-- Requires at least one row in users. Uses ACTIVE users first, otherwise falls back to all users.

WITH candidate_users AS (
    SELECT id
    FROM users
    WHERE status = 'ACTIVE'

    UNION ALL

    SELECT id
    FROM users
    WHERE NOT EXISTS (
        SELECT 1
        FROM users
        WHERE status = 'ACTIVE'
    )
),
numbered_users AS (
    SELECT
        id,
        row_number() OVER (ORDER BY id) AS rn,
        count(*) OVER () AS total
    FROM candidate_users
),
seed_data AS (
    SELECT
        gs AS idx,
        type_values[((gs - 1) % array_length(type_values, 1)) + 1] AS type,
        title_values[((gs - 1) % array_length(title_values, 1)) + 1] AS title,
        content_values[((gs - 1) % array_length(content_values, 1)) + 1] AS content,
        CASE WHEN gs % 3 = 0 THEN 4 ELSE 5 END AS rating,
        now() - ((101 - gs) * interval '6 hours') AS created_at
    FROM generate_series(1, 100) AS gs
    CROSS JOIN (
        SELECT
            ARRAY[
                'GENERAL', 'UI_UX', 'FEATURE_REQUEST', 'BUG', 'PAYMENT'
            ] AS type_values,
            ARRAY[
                'Ứng dụng giúp mình tập trung hơn mỗi ngày',
                'Giao diện dễ dùng và rất gọn',
                'Nhạc nền hỗ trợ học tập rất tốt',
                'Theo dõi thời gian tập trung rất trực quan',
                'Tính năng thú cưng tạo thêm động lực',
                'Mình thích cách app nhắc khi mất tập trung',
                'Trải nghiệm mượt hơn mong đợi',
                'Báo cáo hằng ngày rất hữu ích',
                'Phù hợp cho sinh viên cần kỷ luật',
                'Thanh toán gói Pro khá nhanh',
                'Checklist và phiên focus dùng ổn định',
                'Ứng dụng nhẹ và không gây rối mắt',
                'Mình đã giảm mở mạng xã hội khi học',
                'Các luật chặn ứng dụng hoạt động tốt',
                'Cảm giác học tập có tiến độ rõ hơn',
                'Phần thống kê làm mình có động lực',
                'Assistant phản hồi tự nhiên và dễ thương',
                'Thiết kế phù hợp để dùng lâu dài',
                'Tạo phiên focus rất nhanh',
                'App giúp mình giữ nhịp làm việc',
                'Mình dùng mỗi ngày để học bài',
                'Tính năng cảnh báo khá đúng lúc',
                'Phần điểm thưởng tạo cảm giác tiến bộ',
                'Rất ổn cho làm việc sâu',
                'Trải nghiệm tổng thể đáng tin cậy'
            ] AS title_values,
            ARRAY[
                'Sau một tuần dùng thử, mình thấy thời gian học tập trung tăng rõ rệt. App dễ hiểu và không làm mình bị phân tâm thêm.',
                'Màn hình chính gọn, các nút thao tác rõ ràng. Mình có thể bắt đầu một phiên tập trung chỉ trong vài giây.',
                'Kho nhạc nền vừa đủ, không quá ồn và giúp mình giữ nhịp khi học buổi tối.',
                'Biểu đồ theo ngày giúp mình nhìn ra lúc nào mình làm việc hiệu quả nhất. Đây là phần mình mở lại khá thường xuyên.',
                'Thú cưng và điểm thưởng làm trải nghiệm bớt khô khan. Mình có thêm lý do để hoàn thành phiên focus.',
                'Khi mình mở app giải trí, cảnh báo xuất hiện đúng lúc và giúp mình quay lại việc đang làm.',
                'Ứng dụng chạy ổn định trên máy của mình. Các phiên dài không bị gián đoạn.',
                'Báo cáo cuối ngày giúp mình tự đánh giá thói quen học. Nội dung đủ rõ để điều chỉnh ngày hôm sau.',
                'Mình là sinh viên nên rất cần một công cụ đơn giản để giữ kỷ luật. App đáp ứng đúng nhu cầu đó.',
                'Quy trình nâng cấp Pro nhanh, kết quả thanh toán được cập nhật rõ ràng trong tài khoản.',
                'Tạo luật whitelist và blacklist dễ hiểu. Sau khi cấu hình, mình ít bị cuốn vào những trang không cần thiết hơn.',
                'Màu sắc và bố cục dễ nhìn. Dùng lâu không bị mỏi mắt như một số app năng suất khác.',
                'Trước đây mình hay mở mạng xã hội giữa giờ học. Từ khi dùng app, số lần bị phân tâm giảm nhiều.',
                'Luật chặn hoạt động đúng với các app mình hay dùng. Đây là tính năng quan trọng nhất với mình.',
                'Mình thích cảm giác thấy tổng phút tập trung tăng dần. Nó làm quá trình học có mục tiêu hơn.',
                'Thống kê tuần giúp mình biết ngày nào bị sa sút. Nhờ đó mình điều chỉnh lịch học hợp lý hơn.',
                'Assistant nhắc nhở vừa đủ, không quá khó chịu. Giọng văn thân thiện và tạo cảm giác có người đồng hành.',
                'Thiết kế không phô trương nhưng rất thực dụng. Những chức năng cần dùng đều dễ tìm.',
                'Mình có thể tạo phiên mới rất nhanh trước khi bắt đầu học. Không mất thời gian cấu hình rườm rà.',
                'App giúp mình duy trì nhịp làm việc đều hơn, đặc biệt trong các buổi làm project dài.',
                'Mình dùng app gần như mỗi ngày. Trải nghiệm ổn định khiến mình yên tâm để bật trong lúc học.',
                'Cảnh báo phân tâm xuất hiện vừa đủ nhanh. Nó không làm mình khó chịu nhưng vẫn nhắc mình quay lại.',
                'Điểm thưởng và achievement làm mình muốn hoàn thành thêm phiên tiếp theo.',
                'Rất phù hợp cho các buổi deep work. Mình có thể tập trung lâu hơn mà ít phải tự nhắc bản thân.',
                'Tổng thể app đáng tin cậy, dễ dùng và có giá trị thực tế với thói quen học tập của mình.'
            ] AS content_values
    ) AS values_source
)
INSERT INTO user_feedbacks (
    user_id,
    type,
    title,
    content,
    rating,
    status,
    admin_reply,
    created_at,
    updated_at
)
SELECT
    numbered_users.id,
    seed_data.type,
    seed_data.title,
    seed_data.content,
    seed_data.rating,
    CASE
        WHEN seed_data.idx % 10 = 0 THEN 'REVIEWING'
        ELSE 'RESOLVED'
    END AS status,
    CASE
        WHEN seed_data.idx % 4 = 0 THEN 'Cảm ơn bạn đã chia sẻ trải nghiệm. Đội ngũ sẽ tiếp tục cải thiện sản phẩm.'
        ELSE NULL
    END AS admin_reply,
    seed_data.created_at,
    seed_data.created_at + interval '30 minutes'
FROM seed_data
JOIN numbered_users
    ON numbered_users.rn = ((seed_data.idx - 1) % numbered_users.total) + 1;
