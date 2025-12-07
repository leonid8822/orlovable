import os
import sys
import csv
import json
import glob
from sqlalchemy import create_engine, MetaData, Table, insert, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from models import Base, Application, PendantGeneration, GenerationSettings, Example
from datetime import datetime

load_dotenv()

# Increase CSV field size limit for large base64 images
csv.field_size_limit(sys.maxsize)

TARGET_DB_URL = os.getenv("DATABASE_URL")

def parse_value(column, value):
    """Helper to parse CSV string values into appropriate Python types"""
    str_val = str(value).strip()
    
    # Handle NULLs
    if not str_val or str_val.lower() == 'null':
        return None
        
    # Handle JSON columns
    if hasattr(column.type, 'python_type') and column.type.python_type == dict: # JSON/JSONB
        try:
            # It might be double-escaped in CSV
            return json.loads(str_val)
        except json.JSONDecodeError:
             # Try fixing common CSV escapings if json load fails directly
             try:
                 return json.loads(str_val.replace('""', '"'))
             except:
                 print(f"Warning: Could not parse JSON: {str_val}")
                 return {}
    
    # Handle JSON column definition in basic SQLAlchemy (might not have python_type=dict easily accessible if not using pg specific)
    if str(column.type) == 'JSON':
         try:
            return json.loads(str_val)
         except:
             return {}

    # Handle Booleans
    if str(column.type) == 'BOOLEAN':
        return str_val.lower() == 'true'

    return str_val

def migrate_csv():
    if not TARGET_DB_URL:
        print("Error: DATABASE_URL is not set.")
        sys.exit(1)

    print(f"Migrating CSVs to {TARGET_DB_URL.split('@')[-1]}...")
    
    engine = create_engine(TARGET_DB_URL)
    
    # Create tables if they don't exist
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()

    # Map CSV patterns to Models
    mappings = [
        ("generation_settings", GenerationSettings),
        ("applications", Application),
        ("pendant_generations", PendantGeneration),
        ("examples", Example),
    ]

    base_dir = "../db_migration" # execution expected from backend dir
    if not os.path.exists(base_dir):
        base_dir = "db_migration" # try root relative

    for pattern, Model in mappings:
        files = glob.glob(os.path.join(base_dir, f"{pattern}-export*.csv"))
        if not files:
            print(f"No file found for {pattern}")
            continue
            
        csv_path = files[0] # Take first match
        print(f"Processing {csv_path} into {Model.__tablename__}...")
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            # Detect format - looking like semi-colon delimited based on previous `head`
            reader = csv.DictReader(f, delimiter=';')
            
            rows_to_insert = []
            for row in reader:
                obj_data = {}
                for col_name, value in row.items():
                    # Match column in model
                    if hasattr(Model, col_name):
                        col_attr = getattr(Model, col_name)
                        # primitive handling of types
                        if col_name in ['output_images', 'value']: # Known JSON fields
                             try:
                                 obj_data[col_name] = json.loads(value)
                             except:
                                 # Fallback for some CSV weirdness
                                 obj_data[col_name] = value
                        elif col_name == 'has_back_engraving':
                             # Integer column (0 or 1)
                             obj_data[col_name] = 1 if value.lower() == 'true' else 0
                        elif col_name == 'is_active':
                             # Boolean column
                             obj_data[col_name] = (value.lower() == 'true')
                        else:
                             obj_data[col_name] = value if value != '' else None
                
                rows_to_insert.append(obj_data)

            if rows_to_insert:
                try:
                    # Clean table first? User said "from scratch", but safer to upsert or just insert via ORM
                    # Using Core Insert for speed/simplicity, ignoring conflicts if ID exists?
                    # Let's use ORM merge (upsert-like behavior) to be safe against re-runs
                    for data in rows_to_insert:
                        obj = Model(**data)
                        session.merge(obj)
                    
                    session.commit()
                    print(f"  Imported {len(rows_to_insert)} rows.")
                except Exception as e:
                    print(f"  Error importing {pattern}: {e}")
                    session.rollback()

    print("CSV Migration complete.")

if __name__ == "__main__":
    migrate_csv()
