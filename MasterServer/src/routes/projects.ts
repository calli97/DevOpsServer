import { Router } from "express";
import { ProjectService } from "../service/ProjectService";
import { ProjectController } from "../controller/ProjectController";
import { getRepository } from "../dbConnection";
import Project from "../entity/Project";

const router = Router();

let controller: ProjectController;

async function getController() {
  if (!controller) {
    const projectRepository = await getRepository(Project);
    const projectService = new ProjectService(projectRepository);
    controller = new ProjectController(projectService);
  }
  return controller;
}

router.get("/", async (req, res) => (await getController()).listAll(req, res));
router.get("/:id", async (req, res) => (await getController()).getById(req, res));
router.post("/", async (req, res) => (await getController()).create(req, res));
router.put("/:id", async (req, res) => (await getController()).update(req, res));
router.delete("/:id", async (req, res) => (await getController()).delete(req, res));

export default router;
