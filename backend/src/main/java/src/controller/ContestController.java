package src.controller;

import src.model.Contest;
import src.model.Problem;
import src.repository.ContestRepository;
import src.repository.ProblemRepository;
import src.service.EmailService;
import src.util.EmailValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestRepository contestRepository;
    private final ProblemRepository problemRepository;
    private final EmailService emailService;

    // ✅ GET all contests with dynamic status
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllContests() {
        List<Map<String, Object>> result = contestRepository.findAll()
                .stream()
                .map(c -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id",              c.getId());
                    map.put("name",            c.getName());
                    map.put("difficulty",      c.getDifficulty());
                    map.put("duration",        c.getDuration());
                    map.put("problems",        c.getProblems());
                    map.put("registeredUsers", c.getRegisteredUsers());
                    map.put("leaderboard",     c.getLeaderboard());
                    map.put("startTime",       c.getStartTime() != null ? c.getStartTime().toString() : null);
                    map.put("endTime",         c.getEndTime()   != null ? c.getEndTime().toString()   : null);

                    // Dynamic status
                    Instant now = Instant.now();
                    String status;
                    if (c.getStartTime() == null || c.getEndTime() == null) {
                        status = "unknown";
                    } else if (now.isBefore(c.getStartTime())) {
                        status = "upcoming";
                    } else if (now.isBefore(c.getEndTime())) {
                        status = "live";
                    } else {
                        status = "past";
                    }
                    map.put("status", status);
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ✅ GET single contest
    @GetMapping("/{id}")
    public ResponseEntity<?> getContest(@PathVariable String id) {
        return contestRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ GET problems for a contest
    @GetMapping("/{id}/problems")
    public ResponseEntity<List<Problem>> getContestProblems(@PathVariable String id) {
        Contest c = contestRepository.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();

        List<Problem> problems = problemRepository.findByProblemIdIn(c.getProblems());
        return ResponseEntity.ok(problems);
    }

    // ✅ POST register for a contest
    @PostMapping("/{id}/register")
    public ResponseEntity<?> register(@PathVariable String id) {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        Contest contest = contestRepository.findById(id).orElse(null);
        if (contest == null) return ResponseEntity.notFound().build();

        boolean wasNew = !contest.getRegisteredUsers().contains(email);
        if (wasNew) {
            contest.getRegisteredUsers().add(email);
            contestRepository.save(contest);
            // Only send email notification if the email address is valid
            if (EmailValidator.isValid(email)) {
                try {
                    emailService.sendContestRegistration(email, contest.getName() != null ? contest.getName() : contest.getId());
                } catch (Exception ignored) {
                    // Email send failure should not block registration
                }
            }
        }

        return ResponseEntity.ok(Map.of("message", "Registered successfully"));
    }

    // ✅ GET leaderboard for a contest
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<?> getLeaderboard(@PathVariable String id) {
        Contest c = contestRepository.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(c.getLeaderboard());
    }
}