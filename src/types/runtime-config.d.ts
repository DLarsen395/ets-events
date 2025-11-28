// Runtime configuration types
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      MAPBOX_TOKEN?: string;
    };
  }
}

export {};
