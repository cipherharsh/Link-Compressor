/// <reference types="vite/client" />

// Shaders are imported with Vite's `?raw` suffix so the GLSL source string is
// inlined (a plain `.glsl` import would resolve to the file's URL instead).
declare module '*.glsl?raw' {
  const value: string;
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}
