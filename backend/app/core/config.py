from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Config over hardcoding. Every credential and tunable threshold lives
    here, read from environment variables — never hardcoded in route or
    service logic. SLA windows and risk thresholds especially: these are
    business rules for a hackathon prototype, not clinical guidelines,
    and should be defensible as "here's exactly where these numbers live
    and how to change them" if a judge asks.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://medexa_user:medexa_pass@localhost:5432/medexa"
    database_url_sync: str = "postgresql+psycopg2://medexa_user:medexa_pass@localhost:5432/medexa"

    # Auth
    jwt_secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12  # 12h — long-lived for field workers with poor connectivity

    # Dashboard alert thresholds — tunable, not magic numbers buried in code
    completion_rate_alert_below_percent: float = 80.0
    follow_up_compliance_alert_below_percent: float = 70.0
    referral_delay_alert_above_hours: float = 12.0

    # Clinical Risk Engine thresholds (patient-condition urgency)
    clinical_risk_high_threshold: int = 6
    clinical_risk_moderate_threshold: int = 3

    # Continuity Risk Engine thresholds (care-journey failure probability)
    # — deliberately a SEPARATE set of thresholds from clinical risk,
    # since these score different things (canonical context Section 16)
    continuity_risk_high_threshold: int = 6
    continuity_risk_medium_threshold: int = 3

    # Referral SLA windows, in hours from referral creation. Business
    # rules for the demo, tunable per pilot district if needed.
    sla_acknowledgement_hours: int = 6
    sla_appointment_hours: int = 24
    sla_consultation_hours: int = 48
    sla_back_referral_hours: int = 72
    sla_follow_up_hours: int = 168  # 7 days

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # Bhashini (multilingual) — stretch goal, key left blank until wired
    bhashini_api_key: str = ""


settings = Settings()
