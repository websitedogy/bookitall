-- pgAdmin: connect as postgres (or your superuser) to database "postgres".
-- Run Query 1, then Query 2. Do not run them together.

-- Query 1
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bookitall') THEN
    CREATE ROLE bookitall LOGIN PASSWORD 'bookitall';
  ELSE
    ALTER ROLE bookitall WITH LOGIN PASSWORD 'bookitall';
  END IF;
END
$$;

-- Query 2
CREATE DATABASE bookitall OWNER bookitall;
