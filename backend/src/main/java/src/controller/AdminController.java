package src.controller;

import src.dto.AdminDtos;
import src.dto.AuthDtos;
import src.model.Contest;
import src.model.User;
import src.repository.ContestRepository;
import src.repository.ProblemRepository;
import src.repository.UserRepository;
import src.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ProblemRepository problemRepository;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;

    @PostMapping("/add-admin")
    public ResponseEntity<?> addAdmin(@RequestBody AdminDtos.AddAdminRequest req) {
        try {
            adminService.addAdmin(req);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthDtos.ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/problems")
    public ResponseEntity<?> addProblem(@RequestBody AdminDtos.AddProblemRequest req) {
        try {
            return ResponseEntity.ok(adminService.addProblem(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthDtos.ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/contests")
    public ResponseEntity<?> addContest(@RequestBody AdminDtos.AddContestRequest req) {
        try {
            return ResponseEntity.ok(adminService.addContest(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthDtos.ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/problems/{id}")
    public ResponseEntity<?> deleteProblem(@PathVariable String id) {
        problemRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/contests/{id}")
    public ResponseEntity<?> deleteContest(@PathVariable String id) {
        contestRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Download the full leaderboard for a contest as a JSON file.
     * Each entry has rank, name, email, score, solvedCount, submittedAt,
     * plus all saved solutions (code + language) for that contest.
     * Users who registered but never appeared on the leaderboard are included
     * at the bottom with whatever code they saved (or empty list).
     */
    @GetMapping("/contests/{id}/leaderboard-download")
    public ResponseEntity<byte[]> downloadLeaderboard(@PathVariable String id) {
        Contest contest = contestRepository.findById(id).orElse(null);
        if (contest == null) return ResponseEntity.notFound().build();

        List<String> registeredEmails = contest.getRegisteredUsers() != null
                ? contest.getRegisteredUsers() : new ArrayList<>();

        // email -> User map for solution lookup
        Map<String, User> emailToUser = userRepository.findAll().stream()
                .filter(u -> registeredEmails.contains(u.getEmail()))
                .collect(Collectors.toMap(User::getEmail, u -> u, (a, b) -> a));

        List<Contest.LeaderboardEntry> lb = contest.getLeaderboard() != null
                ? contest.getLeaderboard() : new ArrayList<>();

        Set<String> rankedEmails = lb.stream()
                .map(Contest.LeaderboardEntry::getUser)
                .collect(Collectors.toSet());

        List<Map<String, Object>> rows = new ArrayList<>();

        // 1. Ranked users (sorted by rank ascending)
        lb.stream()
                .sorted(Comparator.comparingInt(Contest.LeaderboardEntry::getRank))
                .forEach(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("rank", entry.getRank());
                    row.put("name", entry.getName() != null ? entry.getName() : entry.getUser());
                    row.put("email", entry.getUser());
                    row.put("score", entry.getScore());
                    row.put("solvedCount", entry.getSolvedCount());
                    row.put("submittedAt", entry.getSubmittedAt() != null ? entry.getSubmittedAt().toString() : null);
                    row.put("submissions", buildSubmissions(emailToUser.get(entry.getUser()), id));
                    rows.add(row);
                });

        // 2. Registered but unranked users
        for (String email : registeredEmails) {
            if (!rankedEmails.contains(email)) {
                User u = emailToUser.get(email);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("rank", "—");
                row.put("name", u != null && u.getName() != null ? u.getName() : email);
                row.put("email", email);
                row.put("score", 0);
                row.put("solvedCount", 0);
                row.put("submittedAt", null);
                row.put("submissions", buildSubmissions(u, id));
                rows.add(row);
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("contestId", contest.getId());
        payload.put("contestName", contest.getName() != null ? contest.getName() : contest.getId());
        payload.put("totalRegistered", registeredEmails.size());
        payload.put("leaderboard", rows);

        byte[] bytes = toJson(payload).getBytes(StandardCharsets.UTF_8);
        String filename = "leaderboard_" + contest.getId() + ".json";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .contentLength(bytes.length)
                .body(bytes);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private List<Map<String, Object>> buildSubmissions(User u, String contestId) {
        if (u == null || u.getSavedSolutions() == null) return Collections.emptyList();
        return u.getSavedSolutions().stream()
                .filter(s -> contestId.equals(s.getContestId()))
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("problemId", s.getProblemId());
                    m.put("problemTitle", s.getProblemTitle());
                    m.put("language", s.getLanguage());
                    m.put("code", s.getCode() != null ? s.getCode() : "");
                    m.put("savedAt", s.getSavedAt() != null ? s.getSavedAt().toString() : null);
                    return m;
                })
                .collect(Collectors.toList());
    }

    /** Minimal recursive JSON serialiser (handles Map, List, String, Number, Boolean, null). */
    @SuppressWarnings("unchecked")
    private String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof Boolean) return obj.toString();
        if (obj instanceof Number)  return obj.toString();
        if (obj instanceof String) {
            return "\"" + ((String) obj)
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t") + "\"";
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(toJson(list.get(i)));
            }
            return sb.append("]").toString();
        }
        if (obj instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) obj;
            StringBuilder sb = new StringBuilder("{\n");
            int i = 0;
            for (Map.Entry<String, Object> e : map.entrySet()) {
                if (i++ > 0) sb.append(",\n");
                sb.append("  ").append(toJson(e.getKey())).append(": ").append(toJson(e.getValue()));
            }
            return sb.append("\n}").toString();
        }
        return "\"" + obj + "\"";
    }
}
