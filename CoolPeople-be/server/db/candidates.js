const pool = require("./index").pool; 

// Fetch all candidates
const fetchCandidates = async () => {
  const SQL = `
    SELECT id, name, bio, party, website, photo_url, position, office_id, election_id, created_at
    FROM candidates;
  `;
  const { rows } = await pool.query(SQL);
  return rows;
};

// Fetch single candidate by ID
const fetchCandidateById = async (id) => {
  const SQL = `
    SELECT id, name, bio, party, website, photo_url, position, office_id, election_id, created_at
    FROM candidates
    WHERE id = $1;
  `;
  const { rows } = await pool.query(SQL, [id]);
  return rows[0];
};

// Create a new candidate
const createCandidate = async ({
  name,
  bio,
  party,
  website,
  photo_url,
  position,
  office_id,
  election_id
}) => {
  const SQL = `
    INSERT INTO candidates (id, name, bio, party, website, photo_url, position, office_id, election_id, created_at)
    VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    RETURNING *;
  `;

  const { rows } = await pool.query(SQL, [
    name,
    bio,
    party,
    website,
    photo_url,
    position,
    office_id,
    election_id
  ]);

  return rows[0];
};

// Update candidate
const updateCandidate = async (id, updateData) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in updateData) {
    fields.push(`${key} = $${idx}`);
    values.push(updateData[key]);
    idx++;
  }

  const SQL = `
    UPDATE candidates
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *;
  `;

  values.push(id);
  const { rows } = await pool.query(SQL, values);
  return rows[0];
};

// Delete candidate
const deleteCandidate = async (id) => {
  const SQL = `
    DELETE FROM candidates
    WHERE id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(SQL, [id]);
  return rows[0];
};

module.exports = {
  fetchCandidates,
  fetchCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate
};
