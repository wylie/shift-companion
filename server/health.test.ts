import { describe, expect, it } from "vitest";
import { buildAppConfig } from "./config";
import { buildHealthSnapshot } from "./health";

describe("getHealthSnapshot", () => {
  it("reports a healthy in-memory runtime when DATABASE_URL is not configured", async () => {
    const snapshot = await buildHealthSnapshot({
      config: buildAppConfig({
        PORT: "8787",
      }),
      isDatabaseConfigured: false,
    });

    expect(snapshot.status).toBe("ok");
    expect(snapshot.runtime.dataSource).toBe("in-memory");
    expect(snapshot.checks).toContainEqual({
      details:
        "DATABASE_URL is not configured. The API is using in-memory demo data.",
      name: "database",
      status: "skipped",
    });
  });
});
