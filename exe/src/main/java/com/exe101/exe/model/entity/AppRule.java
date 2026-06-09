package com.exe101.exe.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(
        name = "app_rules",
        indexes = {
                @Index(name = "idx_app_rules_type", columnList = "rule_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AppRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_app_rules_user"))
    private User user;

    @Size(max = 150)
    @Column(name = "app_name", length = 150)
    private String appName;

    @Size(max = 255)
    @Column(name = "window_title_keyword", length = 255)
    private String windowTitleKeyword;

    @Column(name = "rule_type", length = 20, nullable = false)
    private String ruleType; // WHITELIST, BLACKLIST
}