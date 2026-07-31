const pool = require("../config/database");

// 1. جلب كل المستخدمين
async function getUsers(req, res) {
  try {
    const result = await pool.query("SELECT id, full_name, email, phone, role, is_active, created_at FROM users ORDER BY id DESC");
    res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve users" });
  }
}

// 2. جلب مستخدم واحد
async function getUserById(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const result = await pool.query("SELECT id, full_name, email, phone, role, is_active, created_at FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve user" });
  }
}

// 3. إنشاء مستخدم جديد
async function createUser(req, res) {
  try {
    const { full_name, email, phone, role } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: "full_name and email are required" });
    }

    const result = await pool.query(`
      INSERT INTO users (full_name, email, phone, role)
      VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone, role, is_active, created_at
    `, [full_name, email, phone || null, role || 'customer']);

    res.status(201).json({ success: true, message: "User created successfully", data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
}

// 4. تغيير حالة المستخدم (Activate/Deactivate)
async function toggleUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const result = await pool.query(`
      UPDATE users SET is_active = NOT is_active, updated_at = NOW() 
      WHERE id = $1 RETURNING id, full_name, email, is_active
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const statusText = result.rows[0].is_active ? "activated" : "deactivated";
    res.status(200).json({ success: true, message: `User ${statusText} successfully`, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
}

module.exports = { getUsers, getUserById, createUser, toggleUserStatus };