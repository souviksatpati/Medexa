import math

from app.models.facility import Facility


AVAILABILITY_PENALTY = {
    "available": 0,
    "limited": 1,
    "unavailable": 2,
}


def haversine_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """Return great-circle distance between two coordinates in kilometres."""
    radius_km = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1)
        * math.cos(phi2)
        * math.sin(delta_lambda / 2) ** 2
    )

    return 2 * radius_km * math.asin(math.sqrt(a))


def availability_score(facility: Facility) -> int:
    """Lower score means better current availability."""
    return (
        AVAILABILITY_PENALTY[facility.service_availability.value]
        + AVAILABILITY_PENALTY[facility.diagnostic_availability.value]
        + AVAILABILITY_PENALTY[facility.medicine_availability.value]
    )


def rank_pathway_options(
    origin: Facility,
    candidates: list[Facility],
    limit: int = 5,
) -> list[tuple[Facility, float]]:
    """Rank eligible pathway facilities.

    Ranking is intentionally explainable:
    1. Better aggregate availability wins.
    2. Distance breaks availability ties.

    Facilities without complete coordinates cannot participate in
    geographic pathway ranking.
    """
    if origin.latitude is None or origin.longitude is None:
        raise ValueError("Origin facility must have coordinates")

    ranked: list[tuple[Facility, float]] = []

    for facility in candidates:
        if facility.id == origin.id:
            continue

        if facility.latitude is None or facility.longitude is None:
            continue

        distance = haversine_km(
            origin.latitude,
            origin.longitude,
            facility.latitude,
            facility.longitude,
        )

        ranked.append((facility, distance))

    ranked.sort(
        key=lambda pair: (
            availability_score(pair[0]),
            pair[1],
        )
    )

    return ranked[:limit]
