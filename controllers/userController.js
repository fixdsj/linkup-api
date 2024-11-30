import mssql from "mssql";
import userSchema from "../models/user.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { getDbConnection } from "../config/db.js";
dotenv.config();

export async function create(req, res) {
  const { name, email, password } = req.body;

  const { error } = userSchema.validate({ name, email, password });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); 

    const pool = await getDbConnection();

    const result = await pool.request()
      .input("name", mssql.VarChar, name)
      .input("email", mssql.VarChar, email)
      .input("password", mssql.VarChar, hashedPassword) 
      .query(`
          INSERT INTO [User] (name, email, password)
          OUTPUT INSERTED.userId
          VALUES (@name, @email, @password)
        `);

    res.status(201).json({
      message: "Utilisateur créé avec succès.",
      userId: result.recordset[0].userId,
    });

    pool.close();
  } catch (err) {
    if (err.originalError && err.originalError.info && err.originalError.info.number === 2627) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }
    console.error("Database error:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  try {
    const pool = await getDbConnection();

    if (!pool) {
      return res.status(400).json({ message: "Echec de la connexion à la base de données." })
    }

    const result = await pool.request()
      .input("email", mssql.VarChar, email)
      .query(`
        SELECT userId, name, password FROM [User] WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe invalide." });
    }

    const user = result.recordset[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Email ou mot de passe invalide." });
    }
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Connexion réussie.",
      token
    });

    pool.close();
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
}

export async function update(req, res) {
  const { userId } = req.params;

  if (isNaN(Number(userId)) || isNaN(Number(res.locals.userId))) {
    return res.status(400).json({
      error: `userId: "${userId}" et/ou res.locals.userId: "${res.locals.userId}" ne sont pas des nombres valides.`
    });
  }

  if (Number(userId) !== Number(res.locals.userId)) {
    return res.status(403).json({
      error: "Non autorisé."
    });
  }

  const { name, email, password } = req.body;

  const { error } = userSchema.validate({ name, email, password }, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: error.details.map(err => err.message)
    });
  }

  try {
    const pool = await getDbConnection();

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.request()
      .input("userId", mssql.Int, userId)
      .input("name", mssql.NVarChar(50), name)
      .input("email", mssql.NVarChar(320), email)
      .input("Password", mssql.NVarChar(255), hashedPassword)
      .query(
        `
        UPDATE [User]
        SET [Name] = @name, Email = @email, [Password] = @Password
        WHERE UserId = @userId
      `
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé."
      });
    }

    res.status(200).json({
      message: "Utilisateur mis à jour avec succès."
    });

    pool.close();
  } catch (err) {
    console.error("Database error:", err);

    if (err.code === "EREQUEST" && err.message.includes("UNIQUE KEY constraint")) {
      return res.status(409).json({
        error: "Cet email est déjà utilisé par un autre utilisateur."
      });
    }

    res.status(500).json({
      error: "Erreur interne du serveur."
    });
  }
}


export async function readOne(req, res) {
  const { userId } = req.params;

  if (isNaN(Number(userId))) {
    return res.status(400).json({
      error: `userId: "${userId}" n'est pas un nombre valide.`
    });
  }

  try {
    const pool = await getDbConnection();

    const result = await pool.request()
      .input("userId", mssql.Int, userId)
      .query(
        `
        SELECT UserId, Name, Email
        FROM [User]
        WHERE UserId = @userId
      `
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé."
      });
    }

    res.status(200).json(result.recordset[0]);

    pool.close();
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Erreur interne du serveur."
    });
  }
}

export async function readAll(req, res) {
  try {
    const pool = await getDbConnection();

    const result = await pool.request().query(
      `
      SELECT UserId, Name, Email
      FROM [User]
    `
    );

    res.status(200).json(result.recordset);

    pool.close();
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Erreur interne du serveur."
    });
  }
}

export async function deleteUser(req, res) {
  const { userId } = req.params;

  if (isNaN(Number(userId))) {
    return res.status(400).json({
      error: `userId: "${userId}" n'est pas un nombre valide.`
    });
  }

  try {
    const pool = await getDbConnection();

    const result = await pool.request()
      .input("userId", mssql.Int, userId)
      .query(
        `
        DELETE FROM [User]
        WHERE UserId = @userId
      `
      );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé."
      });
    }

    res.status(200).json({
      message: "Utilisateur supprimé avec succès."
    });

    pool.close();
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      error: "Erreur interne du serveur."
    });
  }
}