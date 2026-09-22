import type { KeyboardEvent } from "react";

/** Activate a click handler from Enter/Space for non-button controls. */
export function onActivateKeyDown(
  event: KeyboardEvent,
  activate: () => void
): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    activate();
  }
}
