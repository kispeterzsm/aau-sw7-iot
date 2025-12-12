package com.example.middleware.repository;

import com.example.middleware.model.SearchHistory;
import com.example.middleware.model.User;
import com.example.middleware.model.LinkCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    List<SearchHistory> findByUser(User user);

    Optional<SearchHistory> findByUserAndCache(User user, LinkCache cache);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO search_history (user_id, cache_id, view_count, created_at)
        SELECT :userId, lc.id, 1, NOW()
        FROM link_cache lc
        WHERE lc.cache_key = :cacheKey
        ON CONFLICT (user_id, cache_id) 
        DO UPDATE SET 
            view_count = search_history.view_count + 1,
            created_at = NOW()
        """, nativeQuery = true)
    int upsertHistoryByCacheKey(
        @Param("userId") Long userId, 
        @Param("cacheKey") String cacheKey
    );
}
