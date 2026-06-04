package src.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import src.model.Contest;
import src.model.User;
import src.repository.ContestRepository;
import src.repository.UserRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * After a contest ends: any registered user who is not already on the leaderboard
 * (never submitted / never scored) gets -10 rating (min 400), a ContestAttended row,
 * and a leaderboard entry at the bottom (0 pts, 0 solved).
 *
 * FIX: Skips users who no longer exist in the DB (e.g. were banned).
 * FIX: Cleans up stale email references from registeredUsers when user is not found.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementService {

    private final ContestRepository contestRepository;
    private final UserRepository userRepository;

    public void settleEndedContests() {
        Instant now = Instant.now();
        for (Contest c : contestRepository.findAll()) {
            if (c.getEndTime() == null || now.isBefore(c.getEndTime())) continue;
            if (Boolean.TRUE.equals(c.getParticipationSettled())) continue;
            try {
                settleOne(c);
            } catch (Exception e) {
                log.warn("Contest settlement failed for {}: {}", c.getId(), e.getMessage());
            }
        }
    }

    private void settleOne(Contest contest) {
        String contestId = contest.getId();
        List<String> reg = contest.getRegisteredUsers() != null ? contest.getRegisteredUsers() : List.of();
        if (contest.getLeaderboard() == null) contest.setLeaderboard(new ArrayList<>());
        List<Contest.LeaderboardEntry> lb = contest.getLeaderboard();

        for (String email : reg) {
            if (email == null || email.isBlank()) continue;
            final String em = email.trim();
            boolean onBoard = lb.stream().anyMatch(e -> em.equalsIgnoreCase(e.getUser()));
            if (onBoard) continue;

            // FIX: If user doesn't exist (was banned), skip — don't create a ghost record.
            // We simply leave the email in registeredUsers (cleaning it up would mutate the list
            // we're iterating; a separate cleanup job could handle that).
            User user = userRepository.findByEmail(em).orElse(null);
            if (user == null) {
                log.debug("Skipping settlement for non-existent user: {}", em);
                continue;
            }

            String displayName = user.getName() != null ? user.getName() : em;
            lb.add(new Contest.LeaderboardEntry(em, displayName, 0, 0, 0, Instant.now()));

            // FIX: null-safe contestsAttended
            if (user.getContestsAttended() == null) user.setContestsAttended(new ArrayList<>());
            boolean hasRecord = user.getContestsAttended().stream()
                    .anyMatch(x -> contestId.equals(x.getContestId()));
            if (!hasRecord) {
                int ratingChange = -10;
                user.setRating(Math.max(400, user.getRating() + ratingChange));
                user.getContestsAttended().add(new User.ContestAttended(
                        contestId,
                        contest.getName() != null ? contest.getName() : contestId,
                        0, 0, 0, ratingChange, LocalDateTime.now()
                ));
                userRepository.save(user);
            }
        }

        lb.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));
        for (int i = 0; i < lb.size(); i++) {
            lb.get(i).setRank(i + 1);
        }

        contest.setParticipationSettled(true);
        contestRepository.save(contest);

        // Sync final ranks back into each user's contestsAttended record
        for (Contest.LeaderboardEntry e : lb) {
            userRepository.findByEmail(e.getUser()).ifPresent(u -> {
                if (u.getContestsAttended() == null) return;
                boolean changed = false;
                for (User.ContestAttended ca : u.getContestsAttended()) {
                    if (contestId.equals(ca.getContestId()) && ca.getRank() != e.getRank()) {
                        ca.setRank(e.getRank());
                        changed = true;
                        break;
                    }
                }
                if (changed) userRepository.save(u);
            });
        }

        log.info("Settled participation for contest {}", contestId);
    }
}
