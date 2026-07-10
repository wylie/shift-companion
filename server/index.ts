import { appConfig } from "./config";
import { getApp, logRuntimeReady } from "./runtime";

const app = getApp();

app.listen(appConfig.port, () => {
  logRuntimeReady({
    deploymentTarget: "local-express",
    port: appConfig.port,
  });
});
