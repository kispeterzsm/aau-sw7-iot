package com.example.middleware.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class JobManager {

    private final Map<String, Thread> runningJobs = new ConcurrentHashMap<>();

    public void registerJob(String jobId) {
        if (jobId != null) {
            runningJobs.put(jobId, Thread.currentThread());
        }
    }

    public void unregisterJob(String jobId) {
        if (jobId != null) {
            runningJobs.remove(jobId);
        }
    }

    public boolean cancelJob(String jobId) {
        Thread worker = runningJobs.get(jobId);
        if (worker != null) {
            worker.interrupt(); 
            runningJobs.remove(jobId);
            return true;
        }
        return false;
    }
}