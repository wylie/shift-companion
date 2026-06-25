import { app } from "@microsoft/teams-js";
import { useEffect, useState } from "react";
import type { TeamsContextSummary, TeamsRuntimeState } from "../types";

type TeamsAppContext = Awaited<ReturnType<typeof app.getContext>>;
type FrameProbe = {
  self: unknown;
  top: unknown;
};

const initialBrowserRuntime: TeamsRuntimeState = {
  isEmbedded: false,
  mode: "browserPreview",
};

function getFrameProbe(): FrameProbe | undefined {
  const browserGlobal = globalThis as {
    self?: unknown;
    top?: unknown;
    window?: FrameProbe;
  };

  if (browserGlobal.window) {
    return browserGlobal.window;
  }

  if ("self" in browserGlobal && "top" in browserGlobal) {
    return {
      self: browserGlobal.self,
      top: browserGlobal.top,
    };
  }

  return undefined;
}

function isFramedWindow(frameProbe: FrameProbe): boolean {
  try {
    return frameProbe.self !== frameProbe.top;
  } catch {
    return true;
  }
}

function toContextSummary(context: TeamsAppContext): TeamsContextSummary {
  return {
    clientType: context.app.host.clientType,
    frameContext: context.page.frameContext,
    hostName: context.app.host.name,
    locale: context.app.locale,
    tenantId: context.user?.tenant?.id,
    theme: context.app.theme,
    userDisplayName: context.user?.displayName,
    userPrincipalName: context.user?.userPrincipalName,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Teams initialization failed.";
}

export function isTeamsInitializationErrorSafeToTreatAsBrowserPreview(
  error: unknown,
): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("no parent window") ||
    message.includes("initialization failed") ||
    message.includes("not running inside microsoft teams")
  );
}

export async function initializeTeamsRuntime(): Promise<TeamsRuntimeState> {
  const frameProbe = getFrameProbe();

  if (!frameProbe || !isFramedWindow(frameProbe)) {
    return initialBrowserRuntime;
  }

  try {
    await app.initialize();
    const context = await app.getContext();

    return {
      context: toContextSummary(context),
      isEmbedded: true,
      mode: "teamsReady",
    };
  } catch (error) {
    if (isTeamsInitializationErrorSafeToTreatAsBrowserPreview(error)) {
      return initialBrowserRuntime;
    }

    return {
      errorMessage: getErrorMessage(error),
      isEmbedded: true,
      mode: "teamsUnavailable",
    };
  }
}

export function useTeamsRuntime(): TeamsRuntimeState {
  const [runtimeState, setRuntimeState] = useState<TeamsRuntimeState>(() => {
    const frameProbe = getFrameProbe();

    if (!frameProbe) {
      return {
        isEmbedded: false,
        mode: "teamsInitializing",
      };
    }

    return isFramedWindow(frameProbe)
      ? {
          isEmbedded: true,
          mode: "teamsInitializing",
        }
      : initialBrowserRuntime;
  });

  useEffect(() => {
    const frameProbe = getFrameProbe();

    if (!frameProbe || !isFramedWindow(frameProbe)) {
      setRuntimeState(initialBrowserRuntime);
      return;
    }

    let isCancelled = false;

    setRuntimeState({
      isEmbedded: true,
      mode: "teamsInitializing",
    });

    void initializeTeamsRuntime().then((nextState) => {
      if (!isCancelled) {
        setRuntimeState(nextState);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return runtimeState;
}
