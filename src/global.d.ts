export {};

declare global {
  interface Window {
    global?: Window;
    globalThis?: Window;
  }
}
