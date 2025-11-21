package com.example.middleware.controller;

import com.example.middleware.dto.SearchHistoryDto;
import com.example.middleware.model.SearchHistory;
import com.example.middleware.model.User;
import com.example.middleware.repository.SearchHistoryRepository;
import com.example.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class SearchHistoryController {

    private final UserRepository userRepository;
    private final SearchHistoryRepository searchHistoryRepository;

    @GetMapping("/user/{userId}")
    public List<SearchHistoryDto> getHistoryByUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND, "User not found"
                ));

        List<SearchHistory> histories = searchHistoryRepository.findByUser(user);

        return histories.stream()
                .map(h -> new SearchHistoryDto(
                        h.getId(),
                        h.getUser().getId(),
                        h.getCache().getId(),
                        h.getCache().getUrl(),
                        h.getViewCount(),
                        h.getCreatedAt()
                ))
                .toList();
    }
}
