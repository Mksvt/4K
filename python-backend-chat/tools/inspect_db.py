import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "professor_db" / "chroma.sqlite3"

print("db", DB)
print("exists", DB.exists())
if DB.exists():
    print("size", DB.stat().st_size)

con = sqlite3.connect(str(DB))
cur = con.cursor()
cur.execute("select name from sqlite_master where type='table' order by name")
tables = [r[0] for r in cur.fetchall()]
print("tables", len(tables))
for t in tables:
    print(" -", t)

# quick sanity check on a few common tables
for candidate in ["collections", "segments", "embeddings", "tenants", "databases", "collection_metadata"]:
    if candidate in tables:
        try:
            cur.execute(f"select count(*) from {candidate}")
            print(f"{candidate}.count", cur.fetchone()[0])
        except Exception as e:
            print(f"{candidate}.count error", e)
