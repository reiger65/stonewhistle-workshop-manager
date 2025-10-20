/**
 * Utility functions for handling version increments
 */

/**
 * Increment the version counter
 * Call this function whenever a permanent change is made to the system
 * that should be reflected in the version number
 */
export function incrementVersion() {
  // Dispatch a custom event to notify the VersionInfo component
  const event = new CustomEvent('incrementVersion');
  window.dispatchEvent(event);
}

/**
 * Reset the version counter to 1
 * This should only be used during development or when deploying a new major version
 */
export function resetVersionCounter() {
  localStorage.setItem('versionChangeCounter', '1');
  // Also trigger a refresh of the component
  incrementVersion();
}