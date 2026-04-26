import sys
from database import execute_query

res = execute_query(
    "INSERT INTO startups (name, industry, stage, description, funding_needed, founder_id) VALUES (%s, %s, %s, %s, %s, %s)",
    ("My Startup", "AI", "Idea", "Desc", 1000.0, 2),
    fetch="none"
)
print("Create test response:", res)

test_select = execute_query("SELECT * FROM startups WHERE founder_id = 2")
print("Select test length:", len(test_select))
