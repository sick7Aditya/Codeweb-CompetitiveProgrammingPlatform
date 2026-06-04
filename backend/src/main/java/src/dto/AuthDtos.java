package src.dto;

import lombok.Data;

public class AuthDtos {

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        public AuthResponse(String token) { this.token = token; }
    }

    @Data
    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) { this.error = error; }
    }
}
