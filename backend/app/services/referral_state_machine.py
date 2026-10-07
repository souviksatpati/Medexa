from app.models.referral import ReferralState, TERMINAL_STATES

"""
This is the AUTHORITATIVE version of the transition table. The frontend
has a mirror (src/models/referralStateMachine.ts) purely for UX — so the
UI only ever offers legal next-actions — but this file is what actually
gets enforced. Never trust client input alone for a state transition
(Build Guide Section 11: "enforced state machine, not a free-text status
field").

Keep this table byte-for-byte in sync with the frontend's copy. If they
diverge, the frontend might offer an action the backend then rejects —
annoying but safe (fails closed). The reverse (backend more permissive
than frontend) is the dangerous direction, so if in doubt, keep this
table the stricter of the two.
"""

LEGAL_TRANSITIONS: dict[ReferralState, set[ReferralState]] = {
    ReferralState.DRAFT: {ReferralState.SENT, ReferralState.CANCELLED},
    ReferralState.SENT: {
        ReferralState.RECEIVED,
        ReferralState.ACCEPTED,
        ReferralState.REJECTED,
        ReferralState.EXPIRED,
        ReferralState.EMERGENCY_ESCALATED,
    },
    ReferralState.RECEIVED: {
        ReferralState.ACCEPTED,
        ReferralState.REJECTED,
        ReferralState.EMERGENCY_ESCALATED,
    },
    ReferralState.ACCEPTED: {
        ReferralState.APPOINTMENT_QUEUED,
        ReferralState.CONSULTED,
        ReferralState.PATIENT_NO_SHOW,
        ReferralState.EMERGENCY_ESCALATED,
    },
    ReferralState.APPOINTMENT_QUEUED: {
        ReferralState.CONSULTED,
        ReferralState.PATIENT_NO_SHOW,
        ReferralState.EMERGENCY_ESCALATED,
    },
    ReferralState.CONSULTED: {
        ReferralState.REFERRED_BACK,
        ReferralState.FOLLOW_UP_DUE,
        ReferralState.CLOSED,
    },
    ReferralState.REFERRED_BACK: {ReferralState.FOLLOW_UP_DUE, ReferralState.CLOSED},
    ReferralState.FOLLOW_UP_DUE: {
        ReferralState.FOLLOW_UP_COMPLETED,
        ReferralState.PATIENT_NO_SHOW,
    },
    ReferralState.FOLLOW_UP_COMPLETED: {ReferralState.CLOSED},
    ReferralState.CLOSED: set(),
    ReferralState.REJECTED: set(),
    ReferralState.CANCELLED: set(),
    ReferralState.EXPIRED: set(),
    ReferralState.PATIENT_NO_SHOW: {ReferralState.SENT},  # allow re-referral
    ReferralState.EMERGENCY_ESCALATED: {ReferralState.ACCEPTED, ReferralState.CLOSED},
}


class IllegalTransitionError(Exception):
    def __init__(self, from_state: ReferralState, to_state: ReferralState):
        self.from_state = from_state
        self.to_state = to_state
        super().__init__(
            f"Illegal referral transition: {from_state.value} -> {to_state.value}"
        )


def validate_transition(from_state: ReferralState, to_state: ReferralState) -> None:
    """Raises IllegalTransitionError if the transition isn't allowed.
    Callers (the referrals router) catch this and return HTTP 409, not
    a generic 500 — this is a business-rule violation, not a bug."""
    allowed = LEGAL_TRANSITIONS.get(from_state, set())
    if to_state not in allowed:
        raise IllegalTransitionError(from_state, to_state)


def is_terminal(state: ReferralState) -> bool:
    return state in TERMINAL_STATES
