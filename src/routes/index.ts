import { Router } from "express";
import github from "./github";

const routes = Router();

routes.use("/github", github);

export default routes;
