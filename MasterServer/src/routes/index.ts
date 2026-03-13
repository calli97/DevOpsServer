import { Router } from "express";
import github from "./github";
import projects from "./projects";
import deploys from "./deploys";
import configFiles from "./config-files";
import slaveServers from "./slave-servers";

const routes = Router();

routes.use("/github", github);
routes.use("/projects", projects);
routes.use("/deploys", deploys);
routes.use("/config-files", configFiles);
routes.use("/slave-servers", slaveServers);

export default routes;
