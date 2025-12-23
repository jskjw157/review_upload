/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAFE24_MALL_ID: string
  readonly VITE_CAFE24_CLIENT_ID: string
  readonly VITE_CAFE24_CLIENT_SECRET: string
  readonly VITE_CAFE24_REDIRECT_URI: string
  readonly VITE_CAFE24_SCOPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
