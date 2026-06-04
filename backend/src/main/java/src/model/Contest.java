package src.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "contests")
public class Contest {

    @Id
    private String id;

    private String name;
    private String difficulty;
    private String duration;
    private Instant startTime;
    private Instant endTime;

    @Builder.Default
    private List<String> problems = new ArrayList<>();

    @Builder.Default
    private List<String> registeredUsers = new ArrayList<>();  // ✅ ADD

    @Builder.Default
    private List<LeaderboardEntry> leaderboard = new ArrayList<>();  // ✅ ADD

    /** Emails that already received the "1 minute before start" notification. */
    @Builder.Default
    private Set<String> preStartEmailsNotified = new HashSet<>();

    /** Emails that already received the "contest started" notification. */
    @Builder.Default
    private Set<String> startEmailsNotified = new HashSet<>();

    /**
     * After {@link #endTime}, registered users who never appeared on the leaderboard get -10 and a row once;
     * then this flag is set true so settlement does not run again.
     */
    @Builder.Default
    private Boolean participationSettled = false;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private String user;
        private String name;
        private int score;
        private int rank;
        private int solvedCount;
        private Instant submittedAt;
    }
}