package src.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Applies no-show penalties and leaderboard rows after each contest's {@code endTime}.
 */
@Component
@RequiredArgsConstructor
public class ContestSettlementScheduler {

    private final ContestSettlementService contestSettlementService;

    @Scheduled(fixedRate = 60_000)
    public void run() {
        contestSettlementService.settleEndedContests();
    }
}
