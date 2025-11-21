package com.example.middleware.controller;

import com.example.middleware.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping("/top")
    public Map<String, Object> top(@RequestParam(defaultValue = "10") int limit) throws Exception {
        return newsService.topNews(limit);
    }
}
