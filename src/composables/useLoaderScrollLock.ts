// ---- Constants ----
const SCROLL_LOCK_CLASS = 'noveo-loader-scroll-lock';

// ---- Helpers ----
const scrollLockTargets = () => [
  document.documentElement,
  document.body,
  ...document.querySelectorAll('.q-page-container, .auth-page, .auth-form-panel'),
];

// ---- Module-Level State ----
let scrollLockCount = 0;
const lockedElements = new Set<Element>();

// ---- Internal Helpers ----
const removeLockFromAll = () => {
  lockedElements.forEach((element) => {
    try {
      element.classList.remove(SCROLL_LOCK_CLASS);
    } catch {
      /* element may have been removed from DOM */
    }
  });
  lockedElements.clear();
  scrollLockTargets().forEach((element) => {
    element.classList.remove(SCROLL_LOCK_CLASS);
  });
};

// ---- Public API ----
export const acquireLoaderScrollLock = () => {
  scrollLockCount += 1;

  if (scrollLockCount > 1) {
    return;
  }

  scrollLockTargets().forEach((element) => {
    element.classList.add(SCROLL_LOCK_CLASS);
    lockedElements.add(element);
  });
};

export const releaseLoaderScrollLock = () => {
  scrollLockCount = Math.max(0, scrollLockCount - 1);

  if (scrollLockCount > 0) {
    return;
  }

  removeLockFromAll();
};

export const resetLoaderScrollLock = () => {
  scrollLockCount = 0;
  removeLockFromAll();
};
