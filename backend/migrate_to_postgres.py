import os
import sys
from sqlalchemy import create_engine, MetaData, Table, insert, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Configuration
SOURCE_DB_URL = os.getenv("SOURCE_DATABASE_URL")
TARGET_DB_URL = os.getenv("DATABASE_URL")

# Helper to construct Supabase URL if password is provided
SUPABASE_PROJECT_ID = "dbgatvbzeptuonyhngyw"
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")

if not SOURCE_DB_URL and SUPABASE_DB_PASSWORD:
    # Default Supabase Connection String
    SOURCE_DB_URL = f"postgresql://postgres:{SUPABASE_DB_PASSWORD}@db.{SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"

def migrate():
    if not TARGET_DB_URL:
        print("Error: DATABASE_URL (Target) is not set.")
        sys.exit(1)
    
    if not SOURCE_DB_URL:
        print("Error: SOURCE_DATABASE_URL is not set, and SUPABASE_DB_PASSWORD is missing.")
        print("Please provide either the full source URL or the Supabase DB password.")
        sys.exit(1)

    print(f"Migrating from Source (Supabase/Other) to Target (Cloud SQL)...")
    print(f"Source: {SOURCE_DB_URL.split('@')[-1]}") # Mask password
    print(f"Target: {TARGET_DB_URL.split('@')[-1]}")

    # Source
    source_engine = create_engine(SOURCE_DB_URL)
    source_meta = MetaData()
    
    # Target
    target_engine = create_engine(TARGET_DB_URL)
    target_meta = MetaData()

    try:
        source_meta.reflect(bind=source_engine)
        target_meta.reflect(bind=target_engine)
    except Exception as e:
        print(f"Error connecting/reflecting databases: {e}")
        sys.exit(1)

    tables = source_meta.tables.keys()

    with source_engine.connect() as source_conn, target_engine.connect() as target_conn:
        for table_name in tables:
            # Skip system tables if any
            if table_name.startswith("pg_"):
                continue
                
            print(f"Migrating table: {table_name}")
            
            # Check if table exists in target
            if table_name not in target_meta.tables:
                print(f"  Table {table_name} does not exist in target. Skipping (Create table first if needed).")
                continue

            source_table = Table(table_name, source_meta, autoload_with=source_engine)
            target_table = Table(table_name, target_meta, autoload_with=target_engine)

            # Extract data
            data = source_conn.execute(source_table.select()).fetchall()
            rows = [dict(row._mapping) for row in data]

            if not rows:
                print(f"  No data for {table_name}, skipping.")
                continue

            # Insert into target
            try:
                # Optional: Clear target table?
                # target_conn.execute(target_table.delete()) 
                
                target_conn.execute(insert(target_table), rows)
                target_conn.commit()
                print(f"  Inserted {len(rows)} rows.")
            except Exception as e:
                print(f"  Error migrating {table_name}: {e}")
                target_conn.rollback()

    print("Migration complete.")

if __name__ == "__main__":
    migrate()
