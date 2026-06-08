import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

app.listen(env.port, () => {
  logger.info(`EventVault server is running on port ${env.port}`);
});
