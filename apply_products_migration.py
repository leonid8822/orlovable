#!/usr/bin/env python3
"""Apply products table migration"""
import sys

# Read migration file
with open('backend/migrations/010_create_products_table.sql', 'r') as f:
    sql = f.read()

print("=" * 70)
print("Please run the following SQL in Supabase SQL Editor:")
print("https://supabase.com/dashboard/project/vofigcbihwkmocrsfowt/sql/new")
print("=" * 70)
print()
print(sql)
print()
print("=" * 70)
