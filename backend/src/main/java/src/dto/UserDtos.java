package src.dto;

import src.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class UserDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse {
        private String id;
        private String name;
        private String email;
        private String picture;
        private String role;
        private int rating;
        private List<SolvedProblemInfo> solvedProblems;
        private List<User.ContestAttended> contestsAttended;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SolvedProblemInfo {
        private String id;
        private String title;
        private String difficulty;
        private LocalDateTime solvedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private int totalSolved;
        private int easySolved;
        private int mediumSolved;
        private int hardSolved;
        private int contestsAttended;
        private Integer bestRank;
        private int rating;
        private String bestRankContestId;  // for navigating to leaderboard
    }

    @Data
    public static class SolveRequest {
        private String problemId;
    }

    @Data
    public static class ContestSubmitRequest {
        private String contestId;
        private int solvedCount;
    }

    @Data
    public static class ProblemSubmitRequest {
        private String problemId;
        private String sourceCode;
        private String language;   // java | python | cpp | c
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SavedSolutionResponse {
        private String problemId;
        private String problemTitle;
        private String code;
        private String language;
        private String contestId;
        private LocalDateTime savedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserDetailResponse {
        private String id;
        private String name;
        private String email;
        private String role;
        private int rating;
        private LocalDateTime createdAt;
        private List<SolvedProblemInfo> solvedProblems;
        private List<User.ContestAttended> contestsAttended;
        private List<SavedSolutionResponse> savedSolutions;
    }
}
