import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// jsdom omits matchMedia; components (e.g. Mermaid) subscribe to the dark-mode
// query on mount. Provide an inert light-mode stub so those effects don't throw.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
