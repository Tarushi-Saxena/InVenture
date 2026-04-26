import sqlite3
import streamlit as st

DB_NAME = "incubator.db"

@st.cache_resource
def init_connection():
    # Detects if file exists; if not, we should probably run the seeder
    # But connecting automatically creates the empty incubator.db file!
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def get_connection():
    conn = init_connection()
    # Enforce foreign keys for SQLite
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def execute_query(query, params=None, fetch="all"):
    """
    Executes a query and returns dictionary results.
    fetch can be 'all', 'one', or 'none'.
    """
    conn = get_connection()
    
    # Intelligently convert MySQL %s placeholders to SQLite ? placeholders
    query = query.replace("%s", "?")
    
    cursor = conn.cursor()
    try:
        cursor.execute(query, params or ())
        
        # SQLite needs manual commit for INSERT/UPDATE/DELETE
        if "INSERT" in query.upper() or "UPDATE" in query.upper() or "DELETE" in query.upper():
            conn.commit()
            
        if fetch == "all":
            rows = cursor.fetchall()
            return [dict(ix) for ix in rows] if rows else []
        elif fetch == "one":
            row = cursor.fetchone()
            return dict(row) if row else None
        else:
            return cursor.lastrowid # typically used for inserts to get row ID
    except Exception as e:
        conn.rollback()
        st.error(f"Database Error: {e}")
        return None
    finally:
        cursor.close()
