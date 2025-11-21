package com.example.middleware.repository;

import com.example.middleware.model.LinkCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LinkCacheRepository extends JpaRepository<LinkCache, Long> {

    Optional<LinkCache> findByCacheKey(String cacheKey);

    Optional<LinkCache> findByUrl(String url);
}
