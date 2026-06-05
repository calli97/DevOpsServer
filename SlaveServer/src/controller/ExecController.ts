import { Request, Response } from "express";
import { ExecService } from "../service/ExecService";
import { ExecRequest } from "../dto/slave.dto";

export class ExecController {
  constructor(private readonly execService: ExecService) {}

  exec = async (req: Request, res: Response): Promise<void> => {
    const { cmd, cwd } = req.body as ExecRequest;
    const result = await this.execService.run(cmd, cwd);
    res.status(200).json(result);
  };
}
