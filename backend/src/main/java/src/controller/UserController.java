package src.controller;

import src.dto.UserDtos;
import src.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            return ResponseEntity.ok(userService.getProfile());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            return ResponseEntity.ok(userService.getStats());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/solve")
    public ResponseEntity<?> markSolved(@RequestBody UserDtos.SolveRequest req) {
        try {
            userService.markSolved(req.getProblemId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/submit-problem")
    public ResponseEntity<?> submitProblem(@RequestBody Map<String, String> req) {
        try {
            userService.submitProblem(req.get("problemId"));
            return ResponseEntity.ok(Map.of("message", "Problem submitted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * FIX: rank is now computed server-side — we only accept solvedCount from the client.
     * The backend re-ranks the leaderboard and assigns the correct rank.
     */
    @PostMapping("/submit-contest")
    public ResponseEntity<?> submitContest(@RequestBody Map<String, Object> req) {
        try {
            String contestId = (String) req.get("contestId");
            int solvedCount  = ((Number) req.getOrDefault("solvedCount", 0)).intValue();
            // FIX: rank is no longer read from the request body — it is computed server-side
            userService.submitContest(contestId, solvedCount);
            return ResponseEntity.ok(Map.of("message", "Contest submitted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Admin: manage users ──────────────────────────────────────

    @GetMapping("/admin/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/admin/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable String id) {
        try {
            userService.banUser(id);
            return ResponseEntity.ok(Map.of("message", "User banned successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/users/{id}/detail")
    public ResponseEntity<?> getAdminUserDetail(@PathVariable String id) {
        try {
            return ResponseEntity.ok(userService.getAdminUserDetail(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/save-solution")
    public ResponseEntity<?> saveSolution(@RequestBody Map<String, String> req) {
        try {
            userService.saveSolution(
                    req.get("problemId"),
                    req.get("code"),
                    req.get("language"),
                    req.get("contestId")
            );
            return ResponseEntity.ok(Map.of("message", "Solution saved"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/solutions")
    public ResponseEntity<?> listSolutions() {
        try {
            return ResponseEntity.ok(userService.listSolutions());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/contest-solutions/{contestId}")
    public ResponseEntity<?> listContestSolutions(@PathVariable String contestId) {
        try {
            return ResponseEntity.ok(userService.listContestSolutions(contestId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
