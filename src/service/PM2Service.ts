import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

class PM2Service {}

export default PM2Service;
