import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

type RouteLayer = {
  route?: {
    methods?: Record<string, boolean>;
    path?: string;
  };
};

function getRegisteredRoutes() {
  const app = createApp();
  const stack = ((app as unknown as { router?: { stack?: RouteLayer[] } }).router
    ?.stack ?? []) as RouteLayer[];

  return stack
    .filter((layer) => layer.route?.path)
    .map((layer) => ({
      methods: Object.keys(layer.route?.methods ?? {}).sort(),
      path: layer.route?.path ?? "",
    }));
}

describe("Express API routes", () => {
  it("registers /api/health on the shared app instance", () => {
    expect(getRegisteredRoutes()).toContainEqual({
      methods: ["get"],
      path: "/api/health",
    });
  });

  it("registers /api/bootstrap on the shared app instance", () => {
    expect(getRegisteredRoutes()).toContainEqual({
      methods: ["get"],
      path: "/api/bootstrap",
    });
  });
});
