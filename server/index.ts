import { appConfig } from "./config.js";
import { getApp, logRuntimeReady } from "./runtime.js";

const app = getApp();

app.listen(appConfig.port, () => {
  logRuntimeReady({
    deploymentTarget: "local-express",
    port: appConfig.port,
  });
});
