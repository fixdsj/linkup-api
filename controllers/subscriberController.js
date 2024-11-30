import mssql from "mssql"
import { getDbConnection } from "../config/db.js";

export async function readAll(req, res) {
    const { userId, creatorId } = req.params;

    // Vérification si userId, creatorId, et res.locals.userId sont des nombres
    if (isNaN(Number(userId)) || isNaN(Number(creatorId)) || isNaN(Number(res.locals.userId))) {
        return res.status(400).json({
            error: `userId: "${userId}", creatorId: "${creatorId}", ou res.locals.userId: "${res.locals.userId}" n'est pas un nombre valide.`
        });
    }

    // Vérification si userId correspond à res.locals.userId
    if (Number(userId) !== Number(res.locals.userId)) {
        return res.status(403).json({ error: "Accès non autorisé." });
    }

    let pool;
    try {
        pool = await getDbConnection();

        // Vérifier si le créateur appartient bien à l'utilisateur
        const creatorCheck = await pool.request()
            .input("creatorId", mssql.Int, creatorId)
            .input("userId", mssql.Int, userId)
            .query(`
                SELECT UserId
                FROM Creator
                WHERE CreatorId = @creatorId
            `);

        if (creatorCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Créateur non trouvé ou non associé à cet utilisateur." });
        }

        if (creatorCheck.recordset[0].UserId !== Number(userId)) {
            const isSubcriberCheck = await pool.request()
                .input("creatorId", mssql.Int, creatorId)
                .input("userId", mssql.Int, userId)
                .query(`
                SELECT 1
                FROM Subscriber 
                Where CreatorId = @creatorId 
                AND UserId = @userId
                AND HasAccess = 1 
            `);

            if (isSubcriberCheck.recordset.length === 0) {
                return res.status(404).json({ error: "Utilisateur non abonné." });
            }
        }

        // Récupérer tous les abonnés associés au créateur
        const subscribers = await pool.request()
            .input("creatorId", mssql.Int, creatorId)
            .query(`
                SELECT 
                    s.SubscriberId,
                    u.Name AS SubscriberName,
                    u.Email AS SubscriberEmail,
                    s.HasAccess
                FROM Subscriber s
                JOIN [User] u ON s.UserId = u.UserId
                WHERE s.CreatorId = @creatorId
            `);

        return res.status(200).json({
            message: "Abonnés récupérés avec succès.",
            data: subscribers.recordset,
        });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Erreur interne du serveur." });
    } finally {
        if (pool) {
            pool.close(); // Assurer la fermeture de la connexion
        }
    }
}

export async function readOne(req, res) {
    const { userId, creatorId, subcriberId } = req.params;

    // Vérification si les IDs sont valides
    if (isNaN(Number(userId)) || isNaN(Number(creatorId)) || isNaN(Number(subcriberId)) || isNaN(Number(res.locals.userId))) {
        return res.status(400).json({
            error: `userId: "${userId}", creatorId: "${creatorId}", subcriberId: "${subcriberId}", ou res.locals.userId: "${res.locals.userId}" n'est pas un nombre valide.`
        });
    }

    // Vérification de l'autorisation
    if (Number(userId) !== Number(res.locals.userId)) {
        return res.status(403).json({ error: "Accès non autorisé." });
    }

    let pool;
    try {
        pool = await getDbConnection();

        // Vérification du créateur
        const creatorCheck = await pool.request()
            .input("creatorId", mssql.Int, creatorId)
            .input("userId", mssql.Int, userId)
            .query(`
                SELECT UserId
                FROM Creator
                WHERE CreatorId = @creatorId
            `);

        if (creatorCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Créateur non trouvé ou non associé à cet utilisateur." });
        }

        // Vérification des droits d'accès si l'utilisateur n'est pas le propriétaire
        if (creatorCheck.recordset[0].UserId !== Number(userId)) {
            const isSubcriberCheck = await pool.request()
                .input("creatorId", mssql.Int, creatorId)
                .input("userId", mssql.Int, userId)
                .query(`
                    SELECT 1
                    FROM Subscriber
                    WHERE CreatorId = @creatorId
                    AND UserId = @userId
                    AND HasAccess = 1
                `);

            if (isSubcriberCheck.recordset.length === 0) {
                return res.status(403).json({ error: "Utilisateur non abonné." });
            }
        }

        // Récupération de l'abonné spécifique
        const subscriber = await pool.request()
            .input("subcriberId", mssql.Int, subcriberId)
            .input("creatorId", mssql.Int, creatorId)
            .query(`
                SELECT 
                    s.SubscriberId,
                    u.Name AS SubscriberName,
                    u.Email AS SubscriberEmail,
                    s.HasAccess
                FROM Subscriber s
                JOIN [User] u ON s.UserId = u.UserId
                WHERE s.SubscriberId = @subcriberId AND s.CreatorId = @creatorId
            `);

        if (subscriber.recordset.length === 0) {
            return res.status(404).json({ error: "Abonné non trouvé." });
        }

        return res.status(200).json({
            message: "Abonné récupéré avec succès.",
            data: subscriber.recordset[0],
        });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Erreur interne du serveur." });
    } finally {
        if (pool) {
            pool.close();
        }
    }
}

export async function deleteSubscriber(req, res) {
    const { userId, creatorId, subcriberId } = req.params;

    // Vérification si les IDs sont valides
    if (isNaN(Number(userId)) || isNaN(Number(creatorId)) || isNaN(Number(subcriberId)) || isNaN(Number(res.locals.userId))) {
        return res.status(400).json({
            error: `userId: "${userId}", creatorId: "${creatorId}", subcriberId: "${subcriberId}", ou res.locals.userId: "${res.locals.userId}" n'est pas un nombre valide.`
        });
    }

    // Vérification de l'autorisation
    if (Number(userId) !== Number(res.locals.userId)) {
        return res.status(403).json({ error: "Accès non autorisé." });
    }

    let pool;
    try {
        pool = await getDbConnection();

        // Vérification du créateur
        const creatorCheck = await pool.request()
            .input("creatorId", mssql.Int, creatorId)
            .input("userId", mssql.Int, userId)
            .query(`
                SELECT UserId
                FROM Creator
                WHERE CreatorId = @creatorId
            `);

        if (creatorCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Créateur non trouvé ou non associé à cet utilisateur." });
        }

        // Vérification que l'abonné existe
        const subscriberCheck = await pool.request()
            .input("subcriberId", mssql.Int, subcriberId)
            .input("creatorId", mssql.Int, creatorId)
            .query(`
                SELECT 1
                FROM Subscriber
                WHERE SubscriberId = @subcriberId AND CreatorId = @creatorId
            `);

        if (subscriberCheck.recordset.length === 0) {
            return res.status(404).json({ error: "Abonné non trouvé." });
        }

        // Suppression de l'abonné
        await pool.request()
            .input("subcriberId", mssql.Int, subcriberId)
            .query(`
                DELETE FROM Subscriber
                WHERE SubscriberId = @subcriberId
            `);

        return res.status(200).json({
            message: "Abonné supprimé avec succès."
        });
    } catch (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Erreur interne du serveur." });
    } finally {
        if (pool) {
            pool.close();
        }
    }
}
