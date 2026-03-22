import bcrypt

password = "admin123"

# Generate correct hash
hash_result = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10))
correct_hash = hash_result.decode('utf-8')
print(f"Password: {password}")
print(f"Correct Hash: {correct_hash}")

# Test if the hash from script matches
test_hash = "$2a$10$EIx.OHrQ1SZKvJZu3bZuB.nKKCM6eVLQ6HvC1KCGHoKX.Rq.M9j2K"
print(f"\nTesting provided hash:")
try:
    matches = bcrypt.checkpw(password.encode('utf-8'), test_hash.encode('utf-8'))
    print(f"Does provided hash match password? {matches}")
except Exception as e:
    print(f"Error: {e}")
