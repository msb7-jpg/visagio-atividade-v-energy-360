"""Runtime local para execução dos notebooks do Lakehouse em um Jupyter Kernel local.

Este módulo só é importado quando `IS_DATABRICKS == False` (fora do Databricks).
Fornece:
- `SparkSession` configurada com Delta Lake local (`data/lakehouse/`).
- Descoberta automática de tabelas Delta entre sessões/kernels (sem lock de Derby).
- Shim compatível com `dbutils.fs` (`ls`, `cp`, `rm`).
- Função `display()` compatível com Jupyter/VS Code e execução via script.
"""

from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from delta import configure_spark_with_delta_pip
from pyspark.sql import DataFrame, SparkSession

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
LANDING_DIR = REPO_ROOT / "data" / "landing"
REFERENCE_DIR = REPO_ROOT / "data-engineering" / "reference"
LAKEHOUSE_DIR = REPO_ROOT / "data" / "lakehouse"
EXPORTS_DIR = REPO_ROOT / "data" / "gold_exports"
VOLUME_DB_PATH = REPO_ROOT / "backend" / "v_energy.db"

SCHEMAS = ("bronze", "silver", "gold")


@dataclass(frozen=True)
class FileInfo:
    """Representa um item retornado por `dbutils.fs.ls`."""

    path: str
    name: str
    size: int
    modificationTime: int  # ruff: ignore[N815]


class LocalDbutilsFs:
    """Emulador local de `dbutils.fs` operando sobre o filesystem local."""

    @staticmethod
    def ls(dir_path: str) -> list[FileInfo]:
        target = Path(dir_path.removeprefix("file:"))
        if not target.exists():
            raise FileNotFoundError(f"Caminho não encontrado: {dir_path}")
        entries: list[FileInfo] = []
        for child in sorted(target.iterdir()):
            stat = child.stat()
            name = f"{child.name}/" if child.is_dir() else child.name
            entries.append(
                FileInfo(
                    path=str(child.resolve()),
                    name=name,
                    size=stat.st_size,
                    modificationTime=int(stat.st_mtime * 1000),
                )
            )
        return entries

    @staticmethod
    def cp(source_path: str, dest_path: str, recurse: bool = False) -> bool:
        src = Path(source_path.removeprefix("file:"))
        dst = Path(dest_path.removeprefix("file:"))
        dst.parent.mkdir(parents=True, exist_ok=True)
        if src.is_dir():
            if not recurse:
                raise IsADirectoryError(f"Use recurse=True para copiar diretórios: {src}")
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        return True

    @staticmethod
    def rm(target_path: str, recurse: bool = False) -> bool:
        target = Path(target_path.removeprefix("file:"))
        if not target.exists():
            return False
        if target.is_dir():
            if recurse:
                shutil.rmtree(target)
            else:
                target.rmdir()
        else:
            target.unlink()
        return True


class LocalDbutils:
    """Shim local do objeto `dbutils` do Databricks."""

    def __init__(self) -> None:
        self.fs = LocalDbutilsFs()


def local_display(obj: Any) -> None:
    """Exibe DataFrames PySpark de forma amigável em Jupyter Kernel ou terminal."""
    if isinstance(obj, DataFrame):
        try:
            from IPython.display import display as ipython_display

            ipython_display(obj.limit(50).toPandas())
            return
        except Exception:
            obj.show(20, truncate=False)
            return
    try:
        from IPython.display import display as ipython_display

        ipython_display(obj)
    except Exception:
        print(obj)  # ruff: ignore[T201]


def _sync_reference_files() -> None:
    """Garante que arquivos de referência (ex: limites ANEEL) estejam em data/landing/."""
    LANDING_DIR.mkdir(parents=True, exist_ok=True)
    if REFERENCE_DIR.exists():
        for ref_file in REFERENCE_DIR.glob("*.csv"):
            dest = LANDING_DIR / ref_file.name
            if not dest.exists() or ref_file.stat().st_mtime > dest.stat().st_mtime:
                shutil.copy2(ref_file, dest)


def _register_databricks_sql_aliases(spark: SparkSession) -> None:
    """Registra aliases de funções SQL nativas do Databricks (ex: try_to_date) no Catalyst."""
    registry = spark._jsparkSession.sessionState().functionRegistry()  # ruff: ignore[SLF001]
    jvm = spark._jvm  # ruff: ignore[SLF001]
    to_date_id = jvm.org.apache.spark.sql.catalyst.FunctionIdentifier("to_date")
    info = registry.lookupFunction(to_date_id).get()
    builder = registry.lookupFunctionBuilder(to_date_id).get()
    try_to_date_id = jvm.org.apache.spark.sql.catalyst.FunctionIdentifier("try_to_date")
    registry.registerFunction(try_to_date_id, info, builder)


def _register_existing_delta_tables(spark: SparkSession) -> None:
    """Registra no catálogo da sessão tabelas Delta já persistidas em data/lakehouse/."""
    for schema_name in SCHEMAS:
        spark.sql(f"CREATE SCHEMA IF NOT EXISTS {schema_name}")
        schema_dir = LAKEHOUSE_DIR / f"{schema_name}.db"
        if not schema_dir.exists():
            continue
        for table_dir in sorted(schema_dir.iterdir()):
            if table_dir.is_dir() and (table_dir / "_delta_log").exists():
                spark.sql(
                    f"CREATE TABLE IF NOT EXISTS {schema_name}.{table_dir.name} "
                    f"USING DELTA LOCATION '{table_dir.as_posix()}'"
                )


def setup_local_env() -> tuple[SparkSession, LocalDbutils, Any, dict[str, str], dict[str, str]]:
    """Inicializa e retorna o ambiente local compatível com os notebooks do Lakehouse."""
    _sync_reference_files()
    LAKEHOUSE_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    VOLUME_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    builder = (
        SparkSession.builder.appName("v-energy-grid-360-local-lakehouse")
        .master("local[*]")
        .config("spark.driver.memory", "4g")
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
        .config("spark.sql.sources.default", "delta")
        .config("spark.sql.warehouse.dir", LAKEHOUSE_DIR.as_posix())
        .config("spark.sql.ansi.enabled", "false")
        .config("spark.sql.legacy.allowNonEmptyLocationInCTAS", "true")
        .config("spark.sql.repl.eagerEval.enabled", "true")
        .config("spark.ui.showConsoleProgress", "false")
    )
    spark = configure_spark_with_delta_pip(builder).getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")

    _register_databricks_sql_aliases(spark)
    _register_existing_delta_tables(spark)

    paths = {
        "landing": LANDING_DIR.as_posix(),
        "exports": EXPORTS_DIR.as_posix(),
        "volume_db": VOLUME_DB_PATH.as_posix(),
    }
    schemas = {
        "catalog": "spark_catalog",
        "bronze": "bronze",
        "silver": "silver",
        "gold": "gold",
    }
    return spark, LocalDbutils(), local_display, paths, schemas
