package com.example.middleware.repository;

import com.example.middleware.model.SearchHistory;
import com.example.middleware.model.User;
import com.example.middleware.model.LinkCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    List<SearchHistory> findByUser(User user);

    Optional<SearchHistory> findByUserAndCache(User user, LinkCache cache);
}
