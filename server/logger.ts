type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function serializeError(error: unknown): LogContext | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  return {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
  };
}

function writeLog(level: LogLevel, event: string, context?: LogContext) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };
  const message = JSON.stringify(payload);

  if (level === "error") {
    console.error(message);
    return;
  }

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.info(message);
}

export function logInfo(event: string, context?: LogContext) {
  writeLog("info", event, context);
}

export function logWarn(event: string, context?: LogContext) {
  writeLog("warn", event, context);
}

export function logError(event: string, error: unknown, context?: LogContext) {
  writeLog("error", event, {
    ...context,
    ...serializeError(error),
  });
}
