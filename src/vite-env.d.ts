import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }

  // Ensure process.env is typed for GenAI SDK usage
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      [key: string]: any;
    }
  }

  // Ensure import.meta.env is typed
  interface ImportMetaEnv {
    [key: string]: any;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Manual type definitions to replace missing vite/client

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: string;
  export default content;
}
