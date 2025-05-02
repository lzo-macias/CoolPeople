const { pool } = require("./index"); // Use pool instead of client
const createTables = async () => {
    const SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  DROP TABLE IF EXISTS deadlines CASCADE;
  DROP TABLE IF EXISTS saved_elections CASCADE;
  DROP TABLE IF EXISTS ballot_measures CASCADE;
  DROP TABLE IF EXISTS candidates CASCADE;
  DROP TABLE IF EXISTS elections CASCADE;
  DROP TABLE IF EXISTS offices CASCADE;
  DROP TABLE IF EXISTS api_logs CASCADE;
  DROP TABLE IF EXISTS users CASCADE;

  -- Users Table
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(256) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    full_name VARCHAR(128),
    borough VARCHAR(128),
    cityCouncilDistrict VARCHAR(64),
    address TEXT,
    zip_code VARCHAR(10),
    dob DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Elections Table
  CREATE TABLE IF NOT EXISTS elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(256) NOT NULL,
    election_day DATE NOT NULL,
    level VARCHAR(64) NOT NULL, -- 'local', 'state', 'federal'
    jurisdiction VARCHAR(256),
    state VARCHAR(64),
    borough VARCHAR(64),
    council_district INTEGER,
    congressional_district VARCHAR(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Offices Table (optional but helpful for reuse + structure)
  CREATE TABLE IF NOT EXISTS offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(128) NOT NULL, -- e.g. "City Council"
    level VARCHAR(64),           -- e.g. "local"
    jurisdiction VARCHAR(256),
    term_length INTEGER,
    description TEXT
  );

  -- Candidates Table
  CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(128) NOT NULL,
  bio TEXT,
  party VARCHAR(64),
  website TEXT,
  photo_url TEXT,
  position VARCHAR(128),
  office_id UUID REFERENCES offices(id),
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  incumbency BOOLEAN,
  stances TEXT,
  finances BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

  -- Ballot Measures Table
  CREATE TABLE IF NOT EXISTS ballot_measures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(256),
    summary TEXT,
    full_text TEXT,
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- User Saved Elections
  CREATE TABLE IF NOT EXISTS saved_elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- API Logs (optional)
  CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT,
    status_code INTEGER,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Election Deadlines Table (optional but useful for voter alerts)
  CREATE TABLE IF NOT EXISTS deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    type VARCHAR(64), -- e.g. 'registration', 'early_voting_start', 'ballot_request'
    deadline_date DATE
  );
    `
    await pool.query(SQL); // ⬅️ RUN IT!! (important)
}
module.exports = { createTables };
