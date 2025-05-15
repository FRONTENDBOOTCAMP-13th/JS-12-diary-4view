/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_APIKEY: string;
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
