package src.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import src.util.EmailValidator;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:noreply@codeweb.local}")
    private String fromAddress;

    public void sendPlain(String to, String subject, String body) {
        if (!EmailValidator.isValid(to)) {
            log.warn("Skip mail: invalid address {}", to);
            return;
        }
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.info("[mail not configured] to={} subject={}\n{}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
            log.debug("Mail sent to {}", to);
        } catch (Exception ex) {
            log.warn("Mail send failed to {}: {}", to, ex.getMessage());
        }
    }

    public void sendContestRegistration(String to, String contestName) {
        sendPlain(to, "Registered: " + contestName,
                "You are registered for \"" + contestName + "\".\n\n"
                        + "You will receive reminders 1 minute before the contest starts and when it begins.\n\n"
                        + "— CodeWeb");
    }

    public void sendContestPreStart(String to, String contestName) {
        sendPlain(to, "Starting in 1 minute: " + contestName,
                "\"" + contestName + "\" starts in about one minute. Good luck!\n\n— CodeWeb");
    }

    public void sendContestStarted(String to, String contestName) {
        sendPlain(to, "Live now: " + contestName,
                "\"" + contestName + "\" has started. Open the app and join the arena.\n\n— CodeWeb");
    }
}
