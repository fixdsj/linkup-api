import jwt from "jsonwebtoken";
import mssql from "mssql";
import {getDbConnection} from "../config/db.js";

import dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET

export async function authentication(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            error: "Le jeton est manquant.",
        });
    }

    if (!jwtSecret) {
        return res.status(401).json({
            error: "JwtSecret inaccessible.",
        })
    }

    jwt.verify(token, jwtSecret, async (err, decoded) => {
        if (err) {
            return res.status(401).json({
                error: `Erreur d'authentification : ${err.message}`,
            });
        }

        if (!decoded || typeof decoded !== "object") {
            return res.status(401).json({
                error: "Le jeton n'est pas valide.",
            });
        }

        const userId = decoded.userId;

        try {
            // Obtenez une connexion MSSQL
            const pool = await getDbConnection();

            if (!pool) {
                return res.status(500).json({error: "Erreur de connexion à la base de données."});
            }

            // Vérifiez si l'utilisateur existe dans la base de données
            const result = await pool.request()
                .input("userId", mssql.Int, userId)
                .query("SELECT userId FROM [User] WHERE userId = @userId");

            if (result.recordset.length === 0) {
                return res.status(401).json({
                    error: "Utilisateur non trouvé.",
                });
            }

            const user = result.recordset[0];

            // Attachez l'utilisateur au contexte de la requête
            res.locals.userId = user.userId;

            return next(); // Passez au middleware suivant
        } catch (error) {
            console.error("Erreur lors de la vérification de l'utilisateur :", error);
            return res.status(500).json({
                error: "Erreur interne du serveur.",
            });
        }
    });
}
