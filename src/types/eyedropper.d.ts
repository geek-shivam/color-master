export {};

declare global {
  interface EyeDropperResult {
    sRGBHex: string;
  }

  interface EyeDropperInstance {
    open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult>;
  }

  interface Window {
    EyeDropper?: new () => EyeDropperInstance;
  }
}
