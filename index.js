import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/userRouter.js";
import creatorRouter from "./routes/creatorRouter.js";
import postRouter from "./routes/postRouter.js";
import subRequestRouter from "./routes/subRequestRouter.js"
import subscriberRouter from "./routes/subscriberRouter.js";
import { getDbConnection } from "./config/db.js";

const result = dotenv.config();
if (result.error) {
    console.error("Erreur lors du chargement du fichier .env :", result.error);
    process.exit(1);
}

// Initialisation de l'application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Pour analyser les requêtes au format JSON
app.use(express.urlencoded({ extended: true })); // Pour analyser les données URL encodées

// Routes
app.use("/api", userRouter);
app.use("/api", creatorRouter);
app.use("/api", postRouter);
app.use("/api", subRequestRouter);
app.use("/api", subscriberRouter)

// Vérifier la connexion à la base de données
getDbConnection().catch((err) => {
    console.error("Erreur lors de la connexion à la base de données :", err);
    process.exit(1); // Arrêter le serveur si la connexion échoue
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
