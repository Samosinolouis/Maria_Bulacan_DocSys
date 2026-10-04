/**
 * Telemetry Port Interface
 *
 * Abstracts observability (logs, metrics, traces) so business logic never
 * depends on a specific vendor. [SOLID:DIP] Production uses OpenTelemetry
 * (LGTM stack); tests use the NoOp implementation.
 */

export interface ISpan {
  setAttribute(key: string, value: unknown): ISpan;
  setAttributes(attributes: Record<string, unknown>): ISpan;
  end(): void;
  recordException(error: Error): void;
}

export interface ITelemetryPort {
  /** Discrete event (log + metric counter + trace span). */
  trackEvent(eventName: string, properties?: Record<string, unknown>): void;
  /** Error (log + error counter + record on active span). */
  trackError(error: Error, context?: Record<string, unknown>): void;
  /** Performance timing (log + histogram + trace span). */
  trackPerformance(
    operationName: string,
    durationMs: number,
    properties?: Record<string, unknown>,
  ): void;
  /** Start a long-running span wrapping an operation. */
  startSpan(name: string): ISpan;
  /** Active span for manual instrumentation. */
  getActiveSpan(): ISpan | undefined;
}
