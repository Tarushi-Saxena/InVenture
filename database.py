import sqlite3
import streamlit as st
import os
import shutil

DB_SOURCE = "incubator.db"
DB_TMP = "/tmp/incubator_working.db"

@st.cache_resource
def init_connection():
    # Streamlit Cloud mounts the Github repo as Read-Only. 
    # SQLite needs write access to the folder to create journal locks.
    target_db = DB_SOURCE
    
    try:
        # Streamlit Cloud uses read-only Docker mounts. CREATE TABLE IF NOT EXISTS 
        # doesn't acquire a write lock if it already exists, so we force an INSERT.
        conn.execute("CREATE TABLE IF NOT EXISTS _test_lock_ (i INT)")
        conn.execute("INSERT INTO _test_lock_ (i) VALUES (1)")
        conn.commit()
    except sqlite3.OperationalError as e:
        if "readonly" in str(e).lower() or "locked" in str(e).lower():
            # We are in a read-only container
            conn.close()
            target_db = DB_TMP
            if not os.path.exists(target_db):
                shutil.copy(DB_SOURCE, target_db)
            conn = sqlite3.connect(target_db, check_same_thread=False)
            
    conn = sqlite3.connect(target_db, check_same_thread=False)
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
