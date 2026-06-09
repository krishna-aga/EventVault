import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

import { createServer } from "node:http";
import { initializeSocket } from "./common/services/socket.io.js";

const server = createServer(app);
initializeSocket(server);

server.listen(env.port, () => {
  logger.info(`EventVault server is running on port ${env.port}`);
});
