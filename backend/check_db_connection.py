import sys
from sqlalchemy import create_engine, text

# Base URL parts
USER = "gen_user"
PASS = "OneHero2025!"
HOST = "17320a4ca96019c5784b1e2f.twc1.net"
PORT = "5432"

DATABASES = ["jewelry_db", "jewelry-db-instance", "postgres", "gen_user"]

for db in DATABASES:
    url = f"postgresql://{USER}:{PASS}@{HOST}:{PORT}/{db}"
    print(f"Testing connection to database: '{db}'...")
    try:
        engine = create_engine(url, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            print(f"  SUCCESS! Connected to '{db}'.")
            # Try to list tables
            result = conn.execute(text("SELECT 1")).scalar()
            print("  Query check passed.")
            sys.exit(0) # Exit on first success
    except Exception as e:
        print(f"  FAILED: {e}")
        print("-" * 20)
