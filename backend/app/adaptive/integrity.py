from typing import Any, Dict, List

from .models import IntegritySignal


class IntegrityAnalyzer:
    """
    Detects review-worthy process signals.

    Important:
    These signals are evidence for human review.
    They do NOT automatically declare cheating.
    """

    def analyze(
        self,
        events: List[Dict[str, Any]],
    ) -> List[IntegritySignal]:
        signals: List[IntegritySignal] = []

        large_paste_events = []

        for event in events:
            event_type = event.get("type")
            timestamp = event.get("t_ms")
            event_id = str(
                event.get("event_id", event.get("seq", ""))
            )

            payload = event.get("payload", {})

            if event_type == "paste":
                text_length = int(
                    payload.get("text_length", 0)
                )

                if text_length >= 100:
                    large_paste_events.append(event)

                    signals.append(
                        IntegritySignal(
                            signal_type="large_paste",
                            severity="medium",
                            timestamp_ms=timestamp,
                            explanation=(
                                "A large amount of code was "
                                "inserted through a paste event."
                            ),
                            evidence_strength="medium",
                            review_recommended=True,
                            event_ids=[event_id],
                        )
                    )

            elif event_type == "focus_lost":
                signals.append(
                    IntegritySignal(
                        signal_type="focus_loss",
                        severity="low",
                        timestamp_ms=timestamp,
                        explanation=(
                            "The coding editor lost focus. "
                            "This can have innocent causes and "
                            "should be reviewed with surrounding "
                            "events."
                        ),
                        evidence_strength="low",
                        review_recommended=False,
                        event_ids=[event_id],
                    )
                )

        # Combine related evidence.
        if large_paste_events:
            focus_signals = [
                signal
                for signal in signals
                if signal.signal_type == "focus_loss"
            ]

            if focus_signals:
                for signal in signals:
                    if signal.signal_type == "large_paste":
                        signal.severity = "high"
                        signal.evidence_strength = "high"
                        signal.review_recommended = True

        return signals