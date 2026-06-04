import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Aditya@2508',
    database='qams'
)

cursor = conn.cursor()
cursor.execute('SELECT id, status, statusReason, LENGTH(transcription) as trans_len FROM Recording ORDER BY createdAt DESC LIMIT 15')

print("=" * 120)
print(f"{'ID':<30} | {'Status':<15} | {'Status Reason':<50} | Transcript Length")
print("=" * 120)

for row in cursor.fetchall():
    rec_id = row[0][:28] if row[0] else "None"
    status = row[1] or "None"
    reason = (row[2][:47] + "...") if row[2] and len(row[2]) > 50 else (row[2] or "None")
    trans_len = row[3] if row[3] else 0
    print(f"{rec_id:<30} | {status:<15} | {reason:<50} | {trans_len}")

conn.close()
