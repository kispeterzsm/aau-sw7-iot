package com.example.middleware.dto;

import lombok.Data;

import java.util.List;

@Data
public class WrapData {

    private String warning;
    private List<ResultItem> result;
    private SearchResultBase oldestResult;
}
