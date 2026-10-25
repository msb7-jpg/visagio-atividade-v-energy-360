"""Utilitário de ingestão e geração das tabelas Gold para o SQLite local v_energy.db.

Popula:
- dim_unidade_consumidora
- fato_faturamento
- fato_qualidade_alimentador (com todas as 15 colunas do contrato da Fatia 02 / Fatia 06)
- fato_atendimentos
"""

import csv
import json
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
LANDING_DIR = ROOT_DIR / "data" / "landing"
DB_PATH = ROOT_DIR / "backend" / "v_energy.db"


def init_schema(conn: sqlite3.Connection) -> None:
    """Cria ou atualiza as tabelas com o contrato exato das fatias."""
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_unidade_consumidora (
        id_uc TEXT PRIMARY KEY,
        codigo_cliente TEXT,
        classe_consumo TEXT,
        subgrupo_tarifario TEXT,
        municipio TEXT,
        bairro TEXT,
        alimentador TEXT,
        subestacao TEXT,
        numero_medidor_ativo TEXT,
        possui_gd BOOLEAN,
        potencia_gd_kw REAL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS fato_faturamento (
        id_fatura TEXT PRIMARY KEY,
        id_uc TEXT,
        competencia TEXT,
        valor_total_rs REAL,
        consumo_faturado_kwh REAL,
        bandeira_tarifaria TEXT,
        tarifa_aplicada_rs_kwh REAL,
        data_vencimento TEXT,
        data_pagamento TEXT,
        status_pagamento TEXT
    );
    """)

    # Schema alinhado ao contrato oficial ADR-003 da Fatia 02 e consumo da Fatia 06 (Grid Quality)
    cur.execute("DROP TABLE IF EXISTS fato_qualidade_alimentador;")
    cur.execute("""
    CREATE TABLE fato_qualidade_alimentador (
        id_alimentador TEXT,
        competencia TEXT,
        conjunto_aneel TEXT,
        criterio_limite TEXT,
        ucs_atendidas INTEGER,
        ucs_interrompidas INTEGER,
        dec_apurado_horas REAL,
        fec_apurado_vezes REAL,
        dec_acumulado_ano_horas REAL,
        fec_acumulado_ano_vezes REAL,
        dec_limite_aneel REAL,
        fec_limite_aneel REAL,
        violou_dec BOOLEAN,
        violou_fec BOOLEAN,
        violou_meta BOOLEAN,
        PRIMARY KEY (id_alimentador, competencia)
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS fato_atendimentos (
        id_atendimento TEXT PRIMARY KEY,
        id_uc TEXT,
        numero_protocolo TEXT,
        motivo_chamado TEXT,
        data_abertura TEXT,
        status_chamado TEXT,
        nota_csat INT
    );
    """)

    conn.commit()


def populate_units(conn: sqlite3.Connection) -> dict[str, int]:
    """Popula dim_unidade_consumidora e retorna a contagem de UCs por alimentador."""
    print("-> Carregando Geração Distribuída...")
    gd_map = {}
    gd_file = LANDING_DIR / "geracao_distribuida.csv"
    if gd_file.exists():
        with open(gd_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    gd_map[row["id_uc"]] = float(row.get("potencia_kwp") or 0.0)
                except ValueError:
                    continue

    print("-> Carregando Medidores Ativos...")
    medidor_map = {}
    medidor_file = LANDING_DIR / "medidores.csv"
    if medidor_file.exists():
        with open(medidor_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("status", "").upper() == "ATIVO":
                    medidor_map[row["id_uc"]] = row.get("id_medidor")

    print("-> Populando dim_unidade_consumidora...")
    uc_file = LANDING_DIR / "unidades_consumidoras.csv"
    if not uc_file.exists():
        print("Arquivo unidades_consumidoras.csv não encontrado!")
        return {}

    rows = []
    ucs_per_feeder = defaultdict(int)
    with open(uc_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            id_uc = row["id_uc"]
            potencia_gd = gd_map.get(id_uc, 0.0)
            possui_gd = id_uc in gd_map
            numero_medidor = medidor_map.get(id_uc) or f"MD-{id_uc}"
            alimentador = row.get("alimentador") or "ALM-REC-001"
            ucs_per_feeder[alimentador] += 1
            
            rows.append((
                id_uc,
                row.get("cpf_cnpj") or f"CLI{id_uc[2:]}",
                row.get("classe", "Residencial"),
                row.get("subgrupo_tarifario", "B1"),
                row.get("municipio", "Recife"),
                row.get("bairro", "Centro"),
                alimentador,
                "SE-CENTRO",
                numero_medidor,
                1 if possui_gd else 0,
                potencia_gd
            ))

    cur = conn.cursor()
    cur.executemany("""
    INSERT OR REPLACE INTO dim_unidade_consumidora (
        id_uc, codigo_cliente, classe_consumo, subgrupo_tarifario,
        municipio, bairro, alimentador, subestacao, numero_medidor_ativo,
        possui_gd, potencia_gd_kw
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, rows)
    conn.commit()
    print(f"✓ {len(rows)} unidades consumidoras inseridas.")
    return ucs_per_feeder


def populate_invoices(conn: sqlite3.Connection, limit: int | None = None) -> None:
    """Popula fato_faturamento a partir de faturas.csv."""
    fat_file = LANDING_DIR / "faturas.csv"
    if not fat_file.exists():
        print("Arquivo faturas.csv não encontrado!")
        return

    print("-> Populando fato_faturamento...")
    cur = conn.cursor()
    batch = []
    total = 0

    with open(fat_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            try:
                valor_total = float(row.get("valor_total") or 0.0)
                consumo_kwh = round(valor_total / 0.85, 2)
                tarifa = 0.85

                batch.append((
                    row["id_fatura"],
                    row["id_uc"],
                    row.get("mes_referencia", "2024-01"),
                    valor_total,
                    consumo_kwh,
                    row.get("bandeira_tarifaria", "Verde").upper(),
                    tarifa,
                    row.get("data_vencimento"),
                    row.get("data_pagamento"),
                    row.get("status", "PAGA").upper()
                ))
            except Exception:
                continue

            if len(batch) >= 20000:
                cur.executemany("""
                INSERT OR REPLACE INTO fato_faturamento (
                    id_fatura, id_uc, competencia, valor_total_rs,
                    consumo_faturado_kwh, bandeira_tarifaria,
                    tarifa_aplicada_rs_kwh, data_vencimento,
                    data_pagamento, status_pagamento
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, batch)
                conn.commit()
                total += len(batch)
                batch = []
                print(f"   ... {total} faturas inseridas")
                if limit and total >= limit:
                    break

        if batch and (not limit or total < limit):
            cur.executemany("""
            INSERT OR REPLACE INTO fato_faturamento (
                id_fatura, id_uc, competencia, valor_total_rs,
                consumo_faturado_kwh, bandeira_tarifaria,
                tarifa_aplicada_rs_kwh, data_vencimento,
                data_pagamento, status_pagamento
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, batch)
            conn.commit()
            total += len(batch)

    print(f"✓ {total} faturas inseridas em fato_faturamento.")


def populate_quality(conn: sqlite3.Connection, ucs_per_feeder: dict[str, int]) -> None:
    """Calcula e popula fato_qualidade_alimentador com os 15 campos requeridos pela Fatia 06."""
    occ_file = LANDING_DIR / "ocorrencias_rede.csv"
    if not occ_file.exists():
        print("Arquivo ocorrencias_rede.csv não encontrado!")
        return

    print("-> Processando indicadores de qualidade da rede (DEC & FEC)...")
    # Agrupa por (alimentador, ano_mes)
    feeder_months = defaultdict(lambda: {"ucs_interrompidas": 0, "duracao_total_min": 0.0})

    with open(occ_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            alim = row.get("alimentador")
            abertura = row.get("data_abertura", "")
            if not alim or len(abertura) < 7:
                continue
            comp = abertura[:7]
            raw_dur = row.get("duracao_min") or "0"
            match = re.search(r"[-+]?\d*\.?\d+", raw_dur)
            dur_min = float(match.group()) if match else 0.0

            feeder_months[(alim, comp)]["ucs_interrompidas"] += 1
            feeder_months[(alim, comp)]["duracao_total_min"] += dur_min

    # Ordena para calcular acumulados no ano
    sorted_keys = sorted(feeder_months.keys(), key=lambda x: (x[0], x[1]))
    
    # Rastreia acumulados por (alimentador, ano)
    ytd_dec = defaultdict(float)
    ytd_fec = defaultdict(float)

    rows = []
    for alim, comp in sorted_keys:
        ano = comp[:4]
        data = feeder_months[(alim, comp)]
        atendidas = max(ucs_per_feeder.get(alim, 350), 50)
        interrompidas = data["ucs_interrompidas"]

        # DEC mensal (horas) e FEC mensal (vezes)
        dec_mes_horas = round((data["duracao_total_min"] / 60.0) / atendidas, 4)
        fec_mes_vezes = round(interrompidas / atendidas, 4)

        # Acumulado no ano
        ytd_dec[(alim, ano)] += dec_mes_horas
        ytd_fec[(alim, ano)] += fec_mes_vezes

        dec_acumulado = round(ytd_dec[(alim, ano)], 4)
        fec_acumulado = round(ytd_fec[(alim, ano)], 4)

        dec_limite = 10.0
        fec_limite = 6.0
        violou_dec = dec_acumulado > dec_limite
        violou_fec = fec_acumulado > fec_limite
        violou_meta = violou_dec or violou_fec

        rows.append((
            alim,
            comp,
            "CONJUNTO RECIFE",
            "CONJUNTO",
            atendidas,
            interrompidas,
            dec_mes_horas,
            fec_mes_vezes,
            dec_acumulado,
            fec_acumulado,
            dec_limite,
            fec_limite,
            1 if violou_dec else 0,
            1 if violou_fec else 0,
            1 if violou_meta else 0
        ))

    cur = conn.cursor()
    cur.executemany("""
    INSERT OR REPLACE INTO fato_qualidade_alimentador (
        id_alimentador, competencia, conjunto_aneel, criterio_limite,
        ucs_atendidas, ucs_interrompidas, dec_apurado_horas, fec_apurado_vezes,
        dec_acumulado_ano_horas, fec_acumulado_ano_vezes, dec_limite_aneel,
        fec_limite_aneel, violou_dec, violou_fec, violou_meta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, rows)
    conn.commit()
    print(f"✓ {len(rows)} apurações mensais de DEC/FEC inseridas em fato_qualidade_alimentador.")


def populate_tickets(conn: sqlite3.Connection) -> None:
    """Popula fato_atendimentos a partir de atendimentos.json."""
    json_file = LANDING_DIR / "atendimentos.json"
    if not json_file.exists():
        return

    print("-> Populando fato_atendimentos...")
    with open(json_file, mode="r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []
    for item in data[:50000]:  # Amostra robusta para atendimento ágil
        protocolo = item.get("protocolo", "")
        rows.append((
            protocolo,
            item.get("id_uc", ""),
            protocolo,
            item.get("assunto", "OUTROS"),
            item.get("data_abertura", ""),
            item.get("status", "ENCERRADO"),
            int(item.get("nota_satisfacao") or 8)
        ))

    cur = conn.cursor()
    cur.executemany("""
    INSERT OR REPLACE INTO fato_atendimentos (
        id_atendimento, id_uc, numero_protocolo, motivo_chamado,
        data_abertura, status_chamado, nota_csat
    ) VALUES (?, ?, ?, ?, ?, ?, ?);
    """, rows)
    conn.commit()
    print(f"✓ {len(rows)} atendimentos inseridos em fato_atendimentos.")


def create_indexes(conn: sqlite3.Connection) -> None:
    """Cria índices analíticos para garantir performance nas consultas."""
    print("-> Criando índices analíticos...")
    cur = conn.cursor()
    cur.execute("CREATE INDEX IF NOT EXISTS idx_dim_uc_municipio ON dim_unidade_consumidora(municipio);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_dim_uc_bairro ON dim_unidade_consumidora(bairro);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_dim_uc_classe ON dim_unidade_consumidora(classe_consumo);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fato_fat_comp ON fato_faturamento(competencia);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fato_fat_uc ON fato_faturamento(id_uc);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fato_qualidade_comp ON fato_qualidade_alimentador(competencia);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fato_qualidade_alim ON fato_qualidade_alimentador(id_alimentador);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fato_atend_uc ON fato_atendimentos(id_uc);")
    conn.commit()
    print("✓ Índices criados.")


def main():
    print(f"=== Sincronizando SQLite {DB_PATH} com Camada Landing ===")
    conn = sqlite3.connect(DB_PATH)
    try:
        init_schema(conn)
        ucs_per_feeder = populate_units(conn)
        limit_arg = int(sys.argv[1]) if len(sys.argv) > 1 else 100000
        populate_invoices(conn, limit=limit_arg)
        populate_quality(conn, ucs_per_feeder)
        populate_tickets(conn)
        create_indexes(conn)
        print("=== Concluído com sucesso! ===")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
