package com.example.middleware.service;

import com.example.middleware.dto.WrapData;
import com.example.middleware.model.LinkCache;
import com.example.middleware.repository.LinkCacheRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CacheService {

    private final LinkCacheRepository repo;
    private final ObjectMapper objectMapper;

    private static final Pattern CACHE_KEY_RE =
            Pattern.compile("^(?<url>.+?)::d(?<depth>\\d+)$");

    private static class UrlDepth {
        String url;
        Integer depth;
    }

    private UrlDepth splitCacheKey(String cacheKey) {
        Matcher m = CACHE_KEY_RE.matcher(cacheKey);
        UrlDepth ud = new UrlDepth();
        if (m.matches()) {
            ud.url = m.group("url");
            ud.depth = Integer.parseInt(m.group("depth"));
        } else {
            ud.url = cacheKey;
            ud.depth = null;
        }
        return ud;
    }

    public Optional<WrapData> fetchCached(String cacheKey) {
        // 1) by cache_key
        Optional<LinkCache> byKey = repo.findByCacheKey(cacheKey);
        if (byKey.isPresent()) {
            return parseData(byKey.get().getResponse());
        }

        // 2) fallback by base URL (like Python _split_cache_key logic)
        UrlDepth ud = splitCacheKey(cacheKey);
        if (!ud.url.equals(cacheKey)) {
            Optional<LinkCache> byUrl = repo.findByUrl(ud.url);
            if (byUrl.isPresent()) {
                return parseData(byUrl.get().getResponse());
            }
        }
        return Optional.empty();
    }

    private Optional<WrapData> parseData(String json) {
        try {
            WrapData data = objectMapper.readValue(json, WrapData.class);
            return Optional.of(data);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void save(String cacheKey, WrapData data) {
        UrlDepth ud = splitCacheKey(cacheKey);
        try {
            String json = objectMapper.writeValueAsString(data);

            LinkCache entity = repo.findByCacheKey(cacheKey)
                    .orElseGet(LinkCache::new);
            entity.setCacheKey(cacheKey);
            entity.setUrl(ud.url);
            entity.setSearchDepth(ud.depth);
            entity.setResponse(json);
            repo.saveAndFlush(entity);
        } catch (Exception e) {
            System.out.println("[db] save_response failed: " + e);
        }
    }

    public Optional<LinkCache> findCacheEntityByKey(String cacheKey) {
        return repo.findByCacheKey(cacheKey);
    }
}
