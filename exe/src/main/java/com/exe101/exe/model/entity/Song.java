package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "songs",
        indexes = {
                @Index(name = "idx_songs_user_order", columnList = "user_id, order_index"),
                @Index(name = "idx_songs_user_enabled", columnList = "user_id, is_enabled")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_songs_user"))
    private User user;

    // Đường dẫn tuyệt đối tới file nhạc trên máy user
    @Column(name = "file_path", nullable = false, length = 1024)
    private String filePath;

    // Tên hiển thị (tên file lúc quét folder)
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    // Thứ tự phát "từ trên xuống"
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    // Checkbox include/exclude khỏi hàng đợi phát
    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;

    // Bài hệ thống (seed sẵn lúc tạo user) — không cho user xóa
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}