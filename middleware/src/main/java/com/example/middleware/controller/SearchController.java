package com.example.middleware.controller;

import com.example.middleware.config.DownstreamProperties;
import com.example.middleware.dto.WrapData;
import com.example.middleware.dto.WrapRequest;
import com.example.middleware.dto.WrapResponse;
import com.example.middleware.model.LinkCache;
import com.example.middleware.model.User;
import com.example.middleware.repository.UserRepository;
import com.example.middleware.service.CacheService;
import com.example.middleware.service.DownstreamService;
import com.example.middleware.service.SearchHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final DownstreamService downstreamService;
    private final CacheService cacheService;
    private final DownstreamProperties props;
    private final UserRepository userRepository;
    private final SearchHistoryService searchHistoryService;

    @PostMapping("/link")
    public WrapResponse wrapLink(@RequestBody WrapRequest req) {
        return handleWrap(req, props.getLinkUrl());
    }

    @PostMapping("/text")
    public WrapResponse wrapText(@RequestBody WrapRequest req) {
        return handleWrap(req, props.getTextUrl());
    }

    private WrapResponse handleWrap(WrapRequest req, String downstreamUrl) {
        String normUrl = downstreamService.normalizeUrl(req.getInput());
        String cacheKey = downstreamService.cacheKey(req.getInput(), req.getSearchDepth());

        Optional<WrapData> cachedOpt = cacheService.fetchCached(cacheKey);
        if (cachedOpt.isPresent()) {
            WrapResponse resp = new WrapResponse();
            resp.setStatus("ok");
            resp.setCached(true);
            resp.setSourceUrl(normUrl);
            resp.setDownstreamMs(0);
            resp.setData(cachedOpt.get());

            recordHistory(req.getUserId(), cacheKey);
            return resp;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("input", req.getInput());
        payload.put("search_depth", req.getSearchDepth());
        DownstreamService.DownstreamResult result;
        try {
            result = downstreamService.callDownstream(downstreamUrl, payload);
        } catch (RuntimeException e) {
            Optional<WrapData> stale = cacheService.fetchCached(cacheKey);
            if (stale.isPresent()) {
                WrapResponse resp = new WrapResponse();
                resp.setStatus("ok");
                resp.setCached(true);
                resp.setSourceUrl(normUrl);
                resp.setDownstreamMs(0);
                resp.setData(stale.get());

                recordHistory(req.getUserId(), cacheKey);
                return resp;
            }
            throw e;
        }

        int status = result.statusCode();
        if (status < 200 || status >= 300) {
            Optional<WrapData> stale = cacheService.fetchCached(cacheKey);
            if (stale.isPresent()) {
                WrapResponse resp = new WrapResponse();
                resp.setStatus("ok");
                resp.setCached(true);
                resp.setSourceUrl(normUrl);
                resp.setDownstreamMs(0);
                resp.setData(stale.get());

                recordHistory(req.getUserId(), cacheKey);
                return resp;
            }
            throw new RuntimeException("Downstream non-2xx: " + status + " body=" + result.body());
        }

        WrapData dataModel;
        try {
            dataModel = downstreamService.extractWrapData(result.body());
        } catch (RuntimeException e) {
            Optional<WrapData> stale = cacheService.fetchCached(cacheKey);
            if (stale.isPresent()) {
                WrapResponse resp = new WrapResponse();
                resp.setStatus("ok");
                resp.setCached(true);
                resp.setSourceUrl(normUrl);
                resp.setDownstreamMs(0);
                resp.setData(stale.get());

                recordHistory(req.getUserId(), cacheKey);
                return resp;
            }
            throw e;
        }

        cacheService.save(cacheKey, dataModel);
        recordHistory(req.getUserId(), cacheKey);

        WrapResponse resp = new WrapResponse();
        resp.setStatus("ok");
        resp.setCached(false);
        resp.setSourceUrl(normUrl);
        resp.setDownstreamMs(result.elapsedMs());
        resp.setData(dataModel);
        return resp;
    }

    private void recordHistory(Long userId, String cacheKey) {
        if (userId == null) return;

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;

        Optional<LinkCache> cacheOpt = cacheService.findCacheEntityByKey(cacheKey);
        if (cacheOpt.isEmpty()) return;

        searchHistoryService.increment(userOpt.get(), cacheOpt.get());
    }
}