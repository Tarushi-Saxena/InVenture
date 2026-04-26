import sqlite3
import os

DB_NAME = "incubator.db"
SCHEMA_FILE = "schema.sql"

def setup_database():
    if os.path.exists(DB_NAME):
        print(f"[-] {DB_NAME} already exists. Deleting it for a fresh seed...")
        os.remove(DB_NAME)

    print(f"[+] Creating empty {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    print(f"[+] Reading {SCHEMA_FILE}...")
    with open(SCHEMA_FILE, "r") as f:
        sql_script = f.read()

    print(f"[+] Executing SQL script. This will create tables and insert dummy data...")
    cursor.executescript(sql_script)
    
    conn.commit()
    conn.close()
    
    print(f"[✓] Database successfully seeded! You can now run `streamlit run app.py`.")

if __name__ == "__main__":
    setup_database()
