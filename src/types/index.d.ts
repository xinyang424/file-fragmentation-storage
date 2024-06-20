/// <reference types="./types/hooks.d.ts" />

interface AnyObject {
  [key: string | Symbol]: any;
}

interface SplitFile {
  path: string;
  base64?: string;
  extractContent: string;
}
