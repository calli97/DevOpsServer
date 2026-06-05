import { z } from "zod";

export const execSchema = z.object({
  cmd: z.string().min(1),
  cwd: z.string().min(1),
  target: z.string().min(1),
});

export type ExecDto = z.infer<typeof execSchema>;
