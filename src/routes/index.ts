import { Router } from "express";
import github from "./github";
import deploys from "./deploys";

const routes = Router();

routes.use("/github", github);
routes.use("/deploys", deploys);

export default routes;
