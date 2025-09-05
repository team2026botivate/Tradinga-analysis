/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_URL: string;
  readonly VITE_GS_SHEET_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}