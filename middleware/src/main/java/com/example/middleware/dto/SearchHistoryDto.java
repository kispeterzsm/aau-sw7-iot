package com.example.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
public class SearchHistoryDto {
    private Long id;
    private Long userId;
    private Long cacheId;
    private String url;
    private Integer viewCount;
    private OffsetDateTime createdAt;
}
