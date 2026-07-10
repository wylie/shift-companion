import { getApp, logRuntimeReady } from "../server/runtime";

const app = getApp();

logRuntimeReady({
  deploymentTarget: "vercel-function",
});

export default app;
