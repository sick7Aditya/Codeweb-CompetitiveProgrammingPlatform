package src.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "Problems")
public class Problem {

    @Id
    private String id;

    private String title;
    private String description;
    private String difficulty; // Easy | Medium | Hard

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private List<String> constraints = new ArrayList<>();

    private String timeLimit;
    private String memoryLimit;
    private String explanation;

    @Builder.Default
    private List<TestCase> testCases = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCase {
        private String input;
        private String output;
    }
}
