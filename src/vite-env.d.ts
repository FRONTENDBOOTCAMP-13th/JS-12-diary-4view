/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_APIKEY: string;
  readonly VITE_SPOTIFY_CLIENT_ID: string;
  readonly VITE_SPOTIFY_CLIENT_SECRET: string;
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
