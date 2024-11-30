import express from "express";
import {create, login, update, readAll, readOne, deleteUser} from "../controllers/userController.js";
import {authentication} from "../middlewares/authentication.js";

const userRouter = express.Router();

userRouter.post("/users/create", create);
userRouter.put("/users/:userId/update", authentication, update);
userRouter.post("/users/login", login);
userRouter.get("/users/:userId", authentication, readOne);
userRouter.get("/users", authentication, readAll);
userRouter.delete("/users/:userId/delete", authentication, deleteUser);

export default userRouter