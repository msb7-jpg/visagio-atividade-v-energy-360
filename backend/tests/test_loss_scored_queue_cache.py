"""A fila ordenada é reaproveitada para a mesma lista de perfis e refeita para uma lista nova."""

from app.features.loss_management.scoring import ConsumptionProfile, rank_suspicious_units


def profile(id_uc: str, recent_kwh: float) -> ConsumptionProfile:
    return ConsumptionProfile(
        id_uc=id_uc, municipio="RECIFE", bairro="IPUTINGA", classe_consumo="RESIDENCIAL",
        consumo_base_kwh=300.0, consumo_recente_kwh=recent_kwh, meses_zerados=0, meses_base=12,
    )


def test_reuses_the_ranking_for_the_same_profiles_and_recomputes_for_new_ones():
    profiles = [profile("UC1", 100.0), profile("UC2", 50.0)]

    first = rank_suspicious_units(profiles, None, tariff_rs_kwh=0.8)
    again = rank_suspicious_units(profiles, None, tariff_rs_kwh=0.8)
    other_tariff = rank_suspicious_units(profiles, None, tariff_rs_kwh=1.0)
    new_profiles = rank_suspicious_units([profile("UC3", 10.0)], None, tariff_rs_kwh=0.8)

    assert [unit.id_uc for unit in first] == ["UC2", "UC1"]
    assert all(cached is original for cached, original in zip(again, first, strict=True))
    assert again is not first
    assert other_tariff[0].valor_estimado_recuperar_rs != first[0].valor_estimado_recuperar_rs
    assert [unit.id_uc for unit in new_profiles] == ["UC3"]
