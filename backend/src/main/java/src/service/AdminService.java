package src.service;

import src.dto.AdminDtos;
import src.model.Contest;
import src.model.Problem;
import src.model.User;
import src.repository.ContestRepository;
import src.repository.ProblemRepository;
import src.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final ContestRepository contestRepository;
    private final PasswordEncoder passwordEncoder;

    public User addAdmin(AdminDtos.AddAdminRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User admin = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role("ADMIN")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return userRepository.save(admin);
    }

    public Problem addProblem(AdminDtos.AddProblemRequest req) {
        if (problemRepository.existsById(req.getId())) {
            throw new RuntimeException("Problem with this ID already exists");
        }

        List<Problem.TestCase> testCases = req.getTestCases() == null ? List.of() :
                req.getTestCases().stream()
                        .map(tc -> new Problem.TestCase(tc.getInput(), tc.getOutput()))
                        .collect(Collectors.toList());

        Problem problem = Problem.builder()
                .id(req.getId())
                .title(req.getTitle())
                .description(req.getDescription())
                .difficulty(req.getDifficulty())
                .tags(req.getTags() != null ? req.getTags() : List.of())
                .constraints(req.getConstraints() != null ? req.getConstraints() : List.of())
                .timeLimit(req.getTimeLimit())
                .memoryLimit(req.getMemoryLimit())
                .explanation(req.getExplanation())
                .testCases(testCases)
                .build();

        return problemRepository.save(problem);
    }

    public Contest addContest(AdminDtos.AddContestRequest req) {
        String id = req.getId() != null ? req.getId().trim() : "";
        if (id.isEmpty()) {
            throw new RuntimeException("Contest id is required (e.g. contest_001)");
        }
        if (contestRepository.existsById(id)) {
            throw new RuntimeException("Contest with this ID already exists");
        }

        Instant startTime = parseDateTime(req.getStartTime()).toInstant();
        Instant endTime   = parseDateTime(req.getEndTime()).toInstant();

        Contest contest = Contest.builder()
                .id(id)
                .name(req.getName())
                .difficulty(req.getDifficulty())
                .duration(req.getDuration())
                .startTime(startTime)
                .endTime(endTime)
                .problems(req.getProblems() != null ? req.getProblems() : List.of())
                .build();

        return contestRepository.save(contest);
    }
    private OffsetDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;

        // Parse the exact format coming from datetime-local
        LocalDateTime ldt = LocalDateTime.parse(value);

        // Attach IST timezone
        return ldt.atZone(ZoneId.of("Asia/Kolkata")).toOffsetDateTime();
    }


}
