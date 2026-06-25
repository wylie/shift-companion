import { createApp } from "./app";
import { appConfig } from "./config";

const app = createApp();

app.listen(appConfig.port, () => {
  console.log(
    `Teams Shifts Companion API listening on http://localhost:${appConfig.port}`,
  );
});
