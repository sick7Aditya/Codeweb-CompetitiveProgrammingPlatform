package src.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import src.model.Contest;
import src.repository.ContestRepository;
import src.util.EmailValidator;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;

/**
 * Every 30s: send pre-start (last minute) and start notifications for registered users.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ContestNotificationScheduler {

    private final ContestRepository contestRepository;
    private final EmailService emailService;

    @Scheduled(fixedRate = 30_000)
    public void tick() {
        Instant now = Instant.now();
        List<Contest> contests = contestRepository.findAll();
        for (Contest c : contests) {
            if (c.getStartTime() == null || c.getRegisteredUsers() == null || c.getRegisteredUsers().isEmpty()) {
                continue;
            }
            Instant start = c.getStartTime();
            long secUntil = start.getEpochSecond() - now.getEpochSecond();
            long secAfterStart = now.getEpochSecond() - start.getEpochSecond();

            boolean changed = false;

            // Last minute before start: 0 < secUntil <= 60
            if (secUntil > 0 && secUntil <= 60) {
                if (c.getPreStartEmailsNotified() == null) {
                    c.setPreStartEmailsNotified(new HashSet<>());
                }
                for (String email : c.getRegisteredUsers()) {
                    if (!EmailValidator.isValid(email)) continue;
                    if (c.getPreStartEmailsNotified().contains(email)) continue;
                    emailService.sendContestPreStart(email, c.getName() != null ? c.getName() : c.getId());
                    c.getPreStartEmailsNotified().add(email);
                    changed = true;
                }
            }

            // First ~45s after start (scheduler is 30s; window covers jitter)
            if (secAfterStart >= 0 && secAfterStart <= 45) {
                if (c.getStartEmailsNotified() == null) {
                    c.setStartEmailsNotified(new HashSet<>());
                }
                for (String email : c.getRegisteredUsers()) {
                    if (!EmailValidator.isValid(email)) continue;
                    if (c.getStartEmailsNotified().contains(email)) continue;
                    emailService.sendContestStarted(email, c.getName() != null ? c.getName() : c.getId());
                    c.getStartEmailsNotified().add(email);
                    changed = true;
                }
            }

            if (changed) {
                try {
                    contestRepository.save(c);
                } catch (Exception e) {
                    log.warn("Failed to save contest notification state {}: {}", c.getId(), e.getMessage());
                }
            }
        }
    }
}
