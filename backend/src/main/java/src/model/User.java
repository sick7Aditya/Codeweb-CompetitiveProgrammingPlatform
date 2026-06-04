package src.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    @Builder.Default
    private String role = "USER";

    private String googleId;
    private String picture;

    @Builder.Default
    private List<String> solvedProblems = new ArrayList<>();

    @Builder.Default
    private List<ContestAttended> contestsAttended = new ArrayList<>();

    /** Saved code per problem; contestId null means practice / problem section. */
    @Builder.Default
    private List<SavedSolution> savedSolutions = new ArrayList<>();

    // Rating starts at 400 (base rating). Beginner: 0-700, Intermediate: 700-1200, Elite: 1200+
    @Builder.Default
    private int rating = 400;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContestAttended {
        private String contestId;
        private String contestName;
        private int rank;
        private int score;
        private int solvedCount;
        private int ratingChange;  // +20 per solved problem, -10 if solved nothing
        private LocalDateTime attendedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SavedSolution {
        private String problemId;
        private String problemTitle;
        private String code;
        private String language;
        /** Contest id when solved inside a contest; null for practice problems. */
        private String contestId;
        private LocalDateTime savedAt;
    }
}