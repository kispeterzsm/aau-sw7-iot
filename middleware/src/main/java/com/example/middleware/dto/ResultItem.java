package com.example.middleware.dto;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class ResultItem {

    private String sentence;
    private String searchTerm;
    private List<NewsResult> newsResults = new ArrayList<>();
    private List<WebsiteResult> websiteResults = new ArrayList<>();

    @JsonProperty("entities")
    private List<Map<String, String>> entities = new ArrayList<>();
}
