package com.example.middleware.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ResultItem {

    private String sentence;
    private String searchTerm;
    private List<NewsResult> newsResults = new ArrayList<>();
    private List<WebsiteResult> websiteResults = new ArrayList<>();
}
