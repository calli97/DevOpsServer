import { Router } from "express";
import cloneRouter from "./clone";
import deployRouter from "./deploy";

const routes = Router();

routes.get("/status", (req, res) => res.status(200).json({ ok: true }));
routes.use("/clone", cloneRouter);
routes.use("/deploy", deployRouter);

export default routes;
