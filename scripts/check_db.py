import sqlite3

conn = sqlite3.connect('certificate_validator.db')
cursor = conn.cursor()

print("=== AVAILABLE TABLES ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"Found {len(tables)} tables:")
for table in tables:
    print(f"- {table[0]}")

if any('fraud_detection_log' in table for table in tables):
    print("\n=== FRAUD DETECTION TABLE EXISTS ===")
    cursor.execute("SELECT COUNT(*) FROM fraud_detection_log")
    count = cursor.fetchone()[0]
    print(f"Fraud logs count: {count}")
else:
    print("\n❌ fraud_detection_log table not found")

print("\n=== CERTIFICATE TABLE STRUCTURE ===")
cursor.execute("PRAGMA table_info(certificate)")
columns = cursor.fetchall()
for col in columns:
    print(f"{col[1]} ({col[2]})")

conn.close()