const { pool } = require("./index");
const bcrypt = require("bcrypt");
const uuid = require("uuid");

// Fetch all users
const fetchUsers = async () => {
  const query = "SELECT id, email, full_name, address, zip_code, dob FROM users;";
  try {
    const { rows } = await pool.query(query);
    return rows;
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err;
  }
};

// Create a user
const createUser = async ({
  email,
  password,
  full_name,
  address,
  zip_code,
  dob
}) => {
  try {
    const checkSQL = `SELECT * FROM users WHERE email = $1;`;
    const { rows } = await pool.query(checkSQL, [email]);
    if (rows.length > 0) {
      throw new Error("User with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const SQL = `
      INSERT INTO users(id, email, password, full_name, address, zip_code, dob, created_at)
      VALUES(uuid_generate_v4(), $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, email, full_name, address, zip_code, dob, created_at;
    `;

    const result = await pool.query(SQL, [
      email,
      hashedPassword,
      full_name,
      address,
      zip_code,
      dob,
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
};

// Find user by email
const findUserByEmail = async (email) => {
  const SQL = `SELECT * FROM users WHERE email = $1;`;
  try {
    const { rows } = await pool.query(SQL, [email]);
    return rows[0] || null;
  } catch (err) {
    console.error("Error finding user by email:", err);
    throw err;
  }
};

// Update user
const updateUser = async (userId, updateData) => {
  try {
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in updateData) {
      fields.push(`${key} = $${index}`);
      values.push(updateData[key]);
      index++;
    }

    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING id, email, full_name, address, zip_code, dob, created_at;
    `;

    values.push(userId);

    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

// Delete user
const deleteUser = async (userId) => {
  try {
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    return true;
  } catch (err) {
    console.error("Error deleting user:", err);
    throw err;
  }
};

module.exports = {
  fetchUsers,
  createUser,
  findUserByEmail,
  updateUser,
  deleteUser,
};

