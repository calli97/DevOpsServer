import { Router } from "express";
import github from "./github";
import projects from "./projects";
import projectInstances from "./project-instances";
import deploys from "./deploys";
import configFiles from "./config-files";
import nginxConfigs from "./nginx-configs";
import slaveServers from "./slave-servers";

const routes = Router();

routes.get("/status", (req, res) => res.status(200).json({ ok: true }));

routes.use("/github", github);
routes.use("/projects", projects);
routes.use("/project-instances", projectInstances);
routes.use("/deploys", deploys);
routes.use("/config-files", configFiles);
routes.use("/nginx-configs", nginxConfigs);
routes.use("/slave-servers", slaveServers);

export default routes;
