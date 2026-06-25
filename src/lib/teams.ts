import { app, authentication } from "@microsoft/teams-js";
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
  sso: {
    status: "idle",
  },
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

function classifySsoError(error: unknown): TeamsRuntimeState["sso"] {
  const message = getErrorMessage(error);
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("webapplicationinfo") ||
    normalizedMessage.includes("resource") ||
    normalizedMessage.includes("manifest") ||
    normalizedMessage.includes("application with identifier") ||
    normalizedMessage.includes("aadsts500011") ||
    normalizedMessage.includes("aadsts65001") ||
    normalizedMessage.includes("consent")
  ) {
    return {
      errorCode: "sso_not_configured",
      errorMessage:
        "Teams SSO is not configured for this tab yet. Check the Teams manifest, Entra app registration, and local environment values.",
      status: "setupRequired",
    };
  }

  return {
    errorCode: "token_unavailable",
    errorMessage: message,
    status: "tokenUnavailable",
  };
}

async function acquireTeamsToken(
  tenantId?: string,
): Promise<TeamsRuntimeState["sso"]> {
  try {
    const token = await authentication.getAuthToken({
      silent: false,
      tenantId,
    });

    return {
      status: "tokenReady",
      token,
    };
  } catch (error) {
    return classifySsoError(error);
  }
}

export async function initializeTeamsRuntime(): Promise<TeamsRuntimeState> {
  const frameProbe = getFrameProbe();

  if (!frameProbe || !isFramedWindow(frameProbe)) {
    return initialBrowserRuntime;
  }

  try {
    await app.initialize();
    const context = await app.getContext();
    const contextSummary = toContextSummary(context);
    const sso = await acquireTeamsToken(contextSummary.tenantId);

    return {
      context: contextSummary,
      isEmbedded: true,
      mode: "teamsReady",
      sso,
    };
  } catch (error) {
    if (isTeamsInitializationErrorSafeToTreatAsBrowserPreview(error)) {
      return initialBrowserRuntime;
    }

    return {
      errorMessage: getErrorMessage(error),
      isEmbedded: true,
      mode: "teamsUnavailable",
      sso: {
        errorCode: "token_request_failed",
        errorMessage: getErrorMessage(error),
        status: "tokenUnavailable",
      },
    };
  }
}

export function useTeamsRuntime(reloadKey = 0): TeamsRuntimeState {
  const [runtimeState, setRuntimeState] = useState<TeamsRuntimeState>(() => {
    const frameProbe = getFrameProbe();

    if (!frameProbe) {
      return {
        isEmbedded: false,
        mode: "teamsInitializing",
        sso: {
          status: "requestingToken",
        },
      };
    }

    return isFramedWindow(frameProbe)
      ? {
          isEmbedded: true,
          mode: "teamsInitializing",
          sso: {
            status: "requestingToken",
          },
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
      sso: {
        status: "requestingToken",
      },
    });

    void initializeTeamsRuntime().then((nextState) => {
      if (!isCancelled) {
        setRuntimeState(nextState);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  return runtimeState;
}
