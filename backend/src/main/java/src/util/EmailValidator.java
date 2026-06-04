package src.util;

import java.util.regex.Pattern;

/**
 * RFC-like sanity check for contest / notification emails.
 * Does not guarantee deliverability (use real SMTP for that).
 */
public final class EmailValidator {

    private static final Pattern PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$"
    );

    private EmailValidator() {}

    public static boolean isValid(String email) {
        if (email == null) return false;
        String e = email.trim();
        if (e.length() < 5 || e.length() > 254) return false;
        return PATTERN.matcher(e).matches();
    }
}
