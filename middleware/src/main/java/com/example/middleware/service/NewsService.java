package com.example.middleware.service;

import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NewsService {

    private static final List<String> RSS_FEEDS = List.of(
            "https://feeds.bbci.co.uk/news/rss.xml",
            "https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best",
            "https://www.aljazeera.com/xml/rss/all.xml",
            "https://apnews.com/hub/apf-topnews?output=rss",
            "https://rss.cnn.com/rss/edition.rss",
            "https://feeds.nytimes.com/nyt/rss/HomePage"
    );

    @Data
    public static class NewsItem {
        private String title;
        private String url;
        private String source;
        private OffsetDateTime publishedAt;
    }

    public Map<String, Object> topNews(int limit) throws Exception {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime cutoff = now.minusDays(1);

        List<NewsItem> allItems = new ArrayList<>();
        for (String feedUrl : RSS_FEEDS) {
            allItems.addAll(fetchFeed(feedUrl));
        }

        List<NewsItem> fresh = allItems.stream()
                .filter(it -> !it.getPublishedAt().isBefore(cutoff))
                .collect(Collectors.toList());

        Map<String, NewsItem> dedup = new HashMap<>();
        for (NewsItem it : fresh) {
            dedup.merge(
                    it.getUrl(),
                    it,
                    (oldV, newV) -> newV.getPublishedAt().isAfter(oldV.getPublishedAt()) ? newV : oldV
            );
        }

        List<NewsItem> sorted = dedup.values().stream()
                .sorted(Comparator.comparing(NewsItem::getPublishedAt).reversed())
                .limit(Math.max(1, Math.min(50, limit)))
                .toList();

        List<Map<String, Object>> items = sorted.stream().map(it ->
                Map.<String, Object>of(
                        "title", it.getTitle(),
                        "url", it.getUrl(),
                        "source", it.getSource(),
                        "published_at", it.getPublishedAt().toString()
                )
        ).toList();

        return Map.of(
                "status", "ok",
                "count", items.size(),
                "generated_at", now.toString(),
                "items", items
        );
    }

    private List<NewsItem> fetchFeed(String feedUrl) {
        try (XmlReader reader = new XmlReader(new URL(feedUrl))) {
            SyndFeed feed = new SyndFeedInput().build(reader);
            String source = feed.getTitle();

            List<NewsItem> items = new ArrayList<>();
            for (SyndEntry e : feed.getEntries()) {
                if (e.getLink() == null || e.getTitle() == null) continue;

                NewsItem it = new NewsItem();
                it.setTitle(e.getTitle().trim());
                it.setUrl(e.getLink());
                it.setSource(source);

                Date published = Optional.ofNullable(e.getPublishedDate())
                        .orElseGet(() -> Optional.ofNullable(e.getUpdatedDate()).orElse(new Date()));
                it.setPublishedAt(published.toInstant().atOffset(ZoneOffset.UTC));
                items.add(it);
            }
            return items;
        } catch (Exception e) {
            return List.of();
        }
    }
}
