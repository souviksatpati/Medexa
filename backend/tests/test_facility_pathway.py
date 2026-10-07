from types import SimpleNamespace

import pytest

from app.models.facility import AvailabilityLevel
from app.services.facility_pathway import (
    availability_score,
    haversine_km,
    rank_pathway_options,
)


def make_facility(
    facility_id,
    name,
    latitude,
    longitude,
    service=AvailabilityLevel.AVAILABLE,
    diagnostic=AvailabilityLevel.AVAILABLE,
    medicine=AvailabilityLevel.AVAILABLE,
):
    return SimpleNamespace(
        id=facility_id,
        name=name,
        latitude=latitude,
        longitude=longitude,
        service_availability=service,
        diagnostic_availability=diagnostic,
        medicine_availability=medicine,
    )


def test_haversine_distance_same_point_is_zero():
    distance = haversine_km(
        22.5726,
        88.3639,
        22.5726,
        88.3639,
    )

    assert distance == pytest.approx(0.0)


def test_haversine_distance_is_reasonable():
    distance = haversine_km(
        22.5726,
        88.3639,
        23.5204,
        87.3119,
    )

    assert distance == pytest.approx(160, abs=10)


def test_availability_score_prefers_available_over_limited():
    available = make_facility(
        "available",
        "Available Facility",
        22.57,
        88.36,
    )

    limited = make_facility(
        "limited",
        "Limited Facility",
        22.57,
        88.36,
        service=AvailabilityLevel.LIMITED,
    )

    unavailable = make_facility(
        "unavailable",
        "Unavailable Facility",
        22.57,
        88.36,
        service=AvailabilityLevel.UNAVAILABLE,
    )

    assert availability_score(available) < availability_score(limited)
    assert availability_score(limited) < availability_score(unavailable)


def test_better_availability_beats_shorter_distance():
    origin = make_facility(
        "origin",
        "Origin",
        22.57,
        88.36,
    )

    nearby_unavailable = make_facility(
        "nearby",
        "Nearby Unavailable",
        22.571,
        88.361,
        service=AvailabilityLevel.UNAVAILABLE,
        diagnostic=AvailabilityLevel.UNAVAILABLE,
        medicine=AvailabilityLevel.UNAVAILABLE,
    )

    farther_available = make_facility(
        "farther",
        "Farther Available",
        22.60,
        88.40,
    )

    ranked = rank_pathway_options(
        origin,
        [nearby_unavailable, farther_available],
    )

    assert [facility.id for facility, _ in ranked] == [
        "farther",
        "nearby",
    ]


def test_distance_breaks_availability_tie():
    origin = make_facility(
        "origin",
        "Origin",
        22.57,
        88.36,
    )

    nearer = make_facility(
        "nearer",
        "Nearer",
        22.571,
        88.361,
    )

    farther = make_facility(
        "farther",
        "Farther",
        22.60,
        88.40,
    )

    ranked = rank_pathway_options(
        origin,
        [farther, nearer],
    )

    assert [facility.id for facility, _ in ranked] == [
        "nearer",
        "farther",
    ]


def test_origin_is_excluded():
    origin = make_facility(
        "origin",
        "Origin",
        22.57,
        88.36,
    )

    other = make_facility(
        "other",
        "Other",
        22.58,
        88.37,
    )

    ranked = rank_pathway_options(
        origin,
        [origin, other],
    )

    assert [facility.id for facility, _ in ranked] == ["other"]


def test_missing_coordinates_are_excluded():
    origin = make_facility(
        "origin",
        "Origin",
        22.57,
        88.36,
    )

    missing_latitude = make_facility(
        "missing-lat",
        "Missing Latitude",
        None,
        88.37,
    )

    missing_longitude = make_facility(
        "missing-lon",
        "Missing Longitude",
        22.58,
        None,
    )

    valid = make_facility(
        "valid",
        "Valid",
        22.58,
        88.37,
    )

    ranked = rank_pathway_options(
        origin,
        [missing_latitude, missing_longitude, valid],
    )

    assert [facility.id for facility, _ in ranked] == ["valid"]


def test_limit_returns_only_requested_number():
    origin = make_facility(
        "origin",
        "Origin",
        22.57,
        88.36,
    )

    candidates = [
        make_facility(
            f"facility-{index}",
            f"Facility {index}",
            22.57 + index * 0.01,
            88.36,
        )
        for index in range(10)
    ]

    ranked = rank_pathway_options(origin, candidates, limit=3)

    assert len(ranked) == 3


def test_origin_without_coordinates_is_rejected():
    origin = make_facility(
        "origin",
        "Origin",
        None,
        88.36,
    )

    candidate = make_facility(
        "candidate",
        "Candidate",
        22.58,
        88.37,
    )

    with pytest.raises(ValueError, match="Origin facility must have coordinates"):
        rank_pathway_options(origin, [candidate])
