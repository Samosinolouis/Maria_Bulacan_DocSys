/**
 * Console / NoOp Telemetry Adapters
 *
 * [SOLID:LSP] Both are fully substitutable for ITelemetryPort.
 */

import type { ITelemetryPort, ISpan } from "./telemetry.interface.js";

class NoOpSpan implements ISpan {
  setAttribute(): ISpan {
    return this;
  }
  setAttributes(): ISpan {
    return this;
  }
  end(): void {}
  recordException(): void {}
}

/** Silent telemetry — used in tests and when telemetry is disabled. */
export class NoOpTelemetryService implements ITelemetryPort {
  trackEvent(): void {}
  trackError(): void {}
  trackPerformance(): void {}
  startSpan(): ISpan {
    return new NoOpSpan();
  }
  getActiveSpan(): ISpan | undefined {
    return undefined;
  }
}

/** Console telemetry — development fallback when OpenTelemetry is unavailable. */
export class ConsoleTelemetryService implements ITelemetryPort {
  constructor(private readonly serviceName: string = "docsys-api") {}

  trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    console.log(`[EVENT] ${eventName}`, properties ?? {});
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${error.message}`, { context });
  }

  trackPerformance(
    operationName: string,
    durationMs: number,
    properties?: Record<string, unknown>,
  ): void {
    console.log(`[PERF] ${this.serviceName}.${operationName} ${durationMs}ms`, properties ?? {});
  }

  startSpan(name: string): ISpan {
    const started = Date.now();
    const label = `${this.serviceName}.${name}`;
    const span: ISpan = {
      setAttribute: () => span,
      setAttributes: () => span,
      end: () => console.log(`[SPAN] ${label} finished in ${Date.now() - started}ms`),
      recordException: (e: Error) => console.error(`[SPAN] ${label} exception`, e.message),
    };
    return span;
  }

  getActiveSpan(): ISpan | undefined {
    return undefined;
  }
}
