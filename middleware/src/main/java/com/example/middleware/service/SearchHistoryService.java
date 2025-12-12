package com.example.middleware.service;

import com.example.middleware.model.LinkCache;
import com.example.middleware.model.SearchHistory;
import com.example.middleware.model.User;
import com.example.middleware.repository.SearchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SearchHistoryService {

    private final SearchHistoryRepository repo;

    public SearchHistory increment(User user, LinkCache cache) {
        SearchHistory h = repo.findByUserAndCache(user, cache)
                .orElseGet(() -> {
                    SearchHistory sh = new SearchHistory();
                    sh.setUser(user);
                    sh.setCache(cache);
                    sh.setViewCount(0);
                    return sh;
                });

        h.setViewCount(h.getViewCount() + 1);
        return repo.save(h);
    }

    public void recordHistorySafe(Long userId, String cacheKey) {
        if (userId == null || cacheKey == null) {
            return;
        }
        int rowsAffected = repo.upsertHistoryByCacheKey(userId, cacheKey);
    }

}
