package com.example.middleware.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "link_cache",
        indexes = {
                @Index(name = "idx_link_cache_cache_key", columnList = "cacheKey", unique = true),
                @Index(name = "idx_link_cache_url", columnList = "url")
        })
@Getter
@Setter
public class LinkCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cache_key", columnDefinition = "text", unique = true, nullable = true)
    private String cacheKey;

    @Column(name = "url", columnDefinition = "text")
    private String url;

    private Integer searchDepth;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String response;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
