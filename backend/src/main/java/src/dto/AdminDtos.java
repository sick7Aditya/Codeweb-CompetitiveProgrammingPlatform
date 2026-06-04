package src.dto;

import lombok.Data;

import java.util.List;

public class AdminDtos {
    @Data
    public static class AddAdminRequest {
        private String name;
        private String email;
        private String password;
    }

    @Data
    public static class AddProblemRequest {
        private String id;
        private String title;
        private String description;
        private String difficulty;
        private List<String> tags;
        private List<String> constraints;
        private String timeLimit;
        private String memoryLimit;
        private String explanation;
        private List<TestCaseDto> testCases;
    }

    @Data
    public static class TestCaseDto {
        private String input;
        private String output;
    }

    @Data
    public static class AddContestRequest {
        /** Stored as MongoDB _id (e.g. contest_001). */
        private String id;
        private String name;
        private String difficulty;
        private String duration;
        private String startTime;
        private String endTime;
        private List<String> problems;
    }
}
