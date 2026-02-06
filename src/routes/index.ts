import { Router } from "express";
import github from "./github";
import projects from "./projects";

const routes = Router();

routes.use("/github", github);
routes.use("/projects", projects);

export default routes;
