package com.example.middleware.dto;

import lombok.Data;

@Data
public class SearchResultBase {
    private String title;
    private String url;
    private String snippet;
    private String date;   // ISO string
}
