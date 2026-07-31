import '@testing-library/jest-dom';

// zip.test.ts opts into the node environment, where `window` does not exist.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

/* cmdk observes its list to size the popover, and Radix Popover positions against
   measured rects. jsdom implements neither ResizeObserver nor scrollIntoView, and
   without these every Combobox and CommandPalette test throws before asserting.
   Both are no-ops: layout is not what these tests are about. */
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
