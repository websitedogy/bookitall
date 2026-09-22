-- Run as a PostgreSQL superuser (psql -U postgres -f scripts/setup-db.sql)
CREATE USER bookitall WITH PASSWORD 'bookitall';
CREATE DATABASE bookitall OWNER bookitall;
GRANT ALL PRIVILEGES ON DATABASE bookitall TO bookitall;
\c bookitall
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO bookitall;
