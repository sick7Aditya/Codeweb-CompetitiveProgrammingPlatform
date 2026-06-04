package src.service;

import src.dto.UserDtos;
import src.model.Contest;
import src.model.Problem;
import src.model.User;
import src.repository.ContestRepository;
import src.repository.ProblemRepository;
import src.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final ContestRepository contestRepository;

    private User getCurrentUser() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserDtos.ProfileResponse getProfile() {
        User user = getCurrentUser();
        return UserDtos.ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .picture(user.getPicture())
                .role(user.getRole())
                .rating(user.getRating())
                .solvedProblems(buildSolvedProblemInfos(user))
                // FIX: null-safe — old documents may have null contestsAttended
                .contestsAttended(user.getContestsAttended() != null ? user.getContestsAttended() : new ArrayList<>())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private List<UserDtos.SolvedProblemInfo> buildSolvedProblemInfos(User user) {
        List<User.SavedSolution> saved = user.getSavedSolutions() != null ? user.getSavedSolutions() : new ArrayList<>();
        // FIX: null-safe — old documents may have null solvedProblems
        List<String> solvedIds = user.getSolvedProblems() != null ? user.getSolvedProblems() : new ArrayList<>();
        return solvedIds.stream()
                .map(problemId -> {
                    LocalDateTime solvedAt = saved.stream()
                            .filter(s -> problemId.equals(s.getProblemId())
                                    && (s.getContestId() == null || s.getContestId().isBlank()))
                            .map(User.SavedSolution::getSavedAt)
                            .filter(Objects::nonNull)
                            .max(LocalDateTime::compareTo)
                            .orElse(null);
                    return problemRepository.findById(problemId)
                            .map(p -> new UserDtos.SolvedProblemInfo(p.getId(), p.getTitle(), p.getDifficulty(), solvedAt))
                            .orElse(new UserDtos.SolvedProblemInfo(problemId, problemId, "Unknown", solvedAt));
                })
                .collect(Collectors.toList());
    }

    public void saveSolution(String problemId, String code, String language, String contestId) {
        if (problemId == null || problemId.isBlank()) throw new RuntimeException("problemId required");
        User user = getCurrentUser();
        if (user.getSavedSolutions() == null) user.setSavedSolutions(new ArrayList<>());
        String cNorm = (contestId == null || contestId.isBlank()) ? null : contestId.trim();
        final String cKey = cNorm;
        user.getSavedSolutions().removeIf(s ->
                Objects.equals(s.getProblemId(), problemId.trim())
                        && Objects.equals(normalizeContestKey(s.getContestId()), normalizeContestKey(cKey)));
        String title = problemRepository.findById(problemId.trim()).map(Problem::getTitle).orElse(problemId.trim());
        user.getSavedSolutions().add(User.SavedSolution.builder()
                .problemId(problemId.trim())
                .problemTitle(title)
                .code(code != null ? code : "")
                .language(language != null ? language : "")
                .contestId(cNorm)
                .savedAt(LocalDateTime.now())
                .build());
        userRepository.save(user);
    }

    private static String normalizeContestKey(String c) {
        return c == null || c.isBlank() ? null : c;
    }

    public List<UserDtos.SavedSolutionResponse> listSolutions() {
        User user = getCurrentUser();
        List<User.SavedSolution> list = user.getSavedSolutions() != null ? user.getSavedSolutions() : new ArrayList<>();
        return list.stream().map(this::toSavedSolutionDto).collect(Collectors.toList());
    }

    public List<UserDtos.SavedSolutionResponse> listContestSolutions(String contestId) {
        User user = getCurrentUser();
        if (contestId == null || user.getSavedSolutions() == null) return new ArrayList<>();
        return user.getSavedSolutions().stream()
                .filter(s -> contestId.equals(s.getContestId()))
                .map(this::toSavedSolutionDto)
                .collect(Collectors.toList());
    }

    private UserDtos.SavedSolutionResponse toSavedSolutionDto(User.SavedSolution s) {
        return UserDtos.SavedSolutionResponse.builder()
                .problemId(s.getProblemId())
                .problemTitle(s.getProblemTitle())
                .code(s.getCode())
                .language(s.getLanguage())
                .contestId(s.getContestId())
                .savedAt(s.getSavedAt())
                .build();
    }

    public UserDtos.AdminUserDetailResponse getAdminUserDetail(String userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // FIX: null-safe savedSolutions
        List<UserDtos.SavedSolutionResponse> sols = (u.getSavedSolutions() != null ? u.getSavedSolutions() : new ArrayList<User.SavedSolution>())
                .stream()
                .map(this::toSavedSolutionDto)
                .collect(Collectors.toList());
        return UserDtos.AdminUserDetailResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole())
                .rating(u.getRating())
                .createdAt(u.getCreatedAt())
                .solvedProblems(buildSolvedProblemInfos(u))
                // FIX: null-safe contestsAttended
                .contestsAttended(u.getContestsAttended() != null ? u.getContestsAttended() : new ArrayList<>())
                .savedSolutions(sols)
                .build();
    }

    public UserDtos.StatsResponse getStats() {
        User user = getCurrentUser();

        // FIX: removed System.out.println — use log.debug() which is silent at INFO level
        log.debug("getStats() for user: {}", user.getEmail());

        // FIX: null-safe solvedProblems list
        List<String> solvedIds = user.getSolvedProblems() != null ? user.getSolvedProblems() : new ArrayList<>();

        log.debug("Solved IDs count: {}", solvedIds.size());

        List<Problem> problems = solvedIds.isEmpty()
                ? new ArrayList<>()
                : problemRepository.findAllById(solvedIds);

        int easy = 0, medium = 0, hard = 0;
        for (Problem p : problems) {
            if (p == null || p.getDifficulty() == null) continue;
            String diff = p.getDifficulty().toLowerCase();
            if (diff.equals("easy")) easy++;
            else if (diff.equals("medium")) medium++;
            else if (diff.equals("hard")) hard++;
        }

        // FIX: null-safe contestsAttended
        List<User.ContestAttended> contests = user.getContestsAttended() != null
                ? user.getContestsAttended()
                : new ArrayList<>();

        log.debug("Contests attended: {}", contests.size());

        Integer bestRank = contests.stream()
                .map(User.ContestAttended::getRank)
                .filter(r -> r != null && r > 0)
                .min(Integer::compareTo)
                .orElse(null);

        String bestRankContestId = null;
        if (bestRank != null) {
            final int br = bestRank;
            bestRankContestId = contests.stream()
                    .filter(c -> br == c.getRank())
                    .map(User.ContestAttended::getContestId)
                    .findFirst()
                    .orElse(null);
        }

        return UserDtos.StatsResponse.builder()
                .totalSolved(solvedIds.size())
                .easySolved(easy)
                .mediumSolved(medium)
                .hardSolved(hard)
                .contestsAttended(contests.size())
                .bestRank(bestRank)
                .rating(user.getRating())
                .bestRankContestId(bestRankContestId)
                .build();
    }

    public void markSolved(String problemId) {
        User user = getCurrentUser();
        // FIX: null-safe solvedProblems
        if (user.getSolvedProblems() == null) user.setSolvedProblems(new ArrayList<>());
        if (!user.getSolvedProblems().contains(problemId)) {
            user.getSolvedProblems().add(problemId);
            userRepository.save(user);
        }
    }

    /**
     * Called when user submits a standalone problem (all test cases pass).
     * Rating: +5 per new solve.
     */
    public void submitProblem(String problemId) {
        User user = getCurrentUser();
        // FIX: null-safe solvedProblems
        if (user.getSolvedProblems() == null) user.setSolvedProblems(new ArrayList<>());
        boolean isNew = !user.getSolvedProblems().contains(problemId);
        if (isNew) {
            user.getSolvedProblems().add(problemId);
            user.setRating(Math.max(400, user.getRating() + 5));
            userRepository.save(user);
        }
    }

    /**
     * Called when a user submits their contest.
     * Rating: +20 per solved problem, -10 if solved nothing. Min rating: 400.
     * FIX: rank is now computed server-side from the leaderboard, not trusted from the client.
     */
    public void submitContest(String contestId, int solvedCount) {
        User user = getCurrentUser();
        Contest contest = contestRepository.findById(contestId).orElse(null);
        if (contest == null) throw new RuntimeException("Contest not found");

        // FIX: null-safe contestsAttended
        if (user.getContestsAttended() == null) user.setContestsAttended(new ArrayList<>());

        boolean alreadyRecorded = user.getContestsAttended().stream()
                .anyMatch(c -> c.getContestId().equals(contestId));
        if (alreadyRecorded) return;

        int ratingChange = solvedCount > 0 ? (solvedCount * 20) : -10;
        int newRating = Math.max(400, user.getRating() + ratingChange);
        user.setRating(newRating);

        int score = solvedCount * 20;

        // Add/update leaderboard entry for this user
        if (contest.getLeaderboard() == null) contest.setLeaderboard(new ArrayList<>());
        Contest.LeaderboardEntry entry = contest.getLeaderboard().stream()
                .filter(e -> e.getUser().equals(user.getEmail()))
                .findFirst().orElse(null);

        if (entry == null) {
            entry = new Contest.LeaderboardEntry(
                    user.getEmail(), user.getName(), score, 0, solvedCount, java.time.Instant.now()
            );
            contest.getLeaderboard().add(entry);
        } else {
            entry.setSolvedCount(solvedCount);
            entry.setScore(score);
        }

        // FIX: Re-rank leaderboard server-side by score descending
        List<Contest.LeaderboardEntry> lb = contest.getLeaderboard();
        lb.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));
        for (int i = 0; i < lb.size(); i++) {
            lb.get(i).setRank(i + 1);
        }
        contestRepository.save(contest);

        // FIX: Use the server-computed rank, not the client-submitted rank
        int serverRank = lb.stream()
                .filter(e -> e.getUser().equals(user.getEmail()))
                .map(Contest.LeaderboardEntry::getRank)
                .findFirst()
                .orElse(lb.size());

        User.ContestAttended attended = new User.ContestAttended(
                contestId,
                contest.getName(),
                serverRank,
                score,
                solvedCount,
                ratingChange,
                LocalDateTime.now()
        );
        user.getContestsAttended().add(attended);
        userRepository.save(user);

        // Sync rank back to all users on the leaderboard
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
    }

    // Get all users (admin only)
    public List<java.util.Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(u -> !"ADMIN".equals(u.getRole()))
                .map(u -> {
                    java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole());
                    map.put("rating", u.getRating());
                    // FIX: null-safe — old documents may not have these lists populated
                    map.put("solvedCount", u.getSolvedProblems() != null ? u.getSolvedProblems().size() : 0);
                    map.put("contestsAttended", u.getContestsAttended() != null ? u.getContestsAttended().size() : 0);
                    map.put("createdAt", u.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());
    }

    public void banUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if ("ADMIN".equals(user.getRole())) throw new RuntimeException("Cannot ban an admin");
        userRepository.delete(user);
    }
}
