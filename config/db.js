import mssql from "mssql";
import dotenv from "dotenv";

dotenv.config(); // Charger les variables d'environnement

// Configuration de la base de données
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Utilisé pour Azure SQL
    enableArithAbort: true, // Recommandé par mssql
    connectTimeout: 30000, 
    requestTimeout: 30000,
  },
};

export async function getDbConnection() {
  try {
    const pool = await mssql.connect(dbConfig);
    console.log('Connexion à la base de données réussie.');
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    throw err;
  }
}

export default dbConfig;
