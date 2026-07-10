import { getApp, logRuntimeReady } from "../server/runtime.js";

const app = getApp();

logRuntimeReady({
  deploymentTarget: "vercel-function",
});

export default app;
