declare module 'react-quill' {
  import React from 'react';

  interface QuillModules {
    toolbar?: unknown;
    [key: string]: unknown;
  }

  interface ReactQuillProps {
    value?: string;
    onChange?: (value: string) => void;
    theme?: string;
    modules?: QuillModules;
    formats?: string[];
    readOnly?: boolean;
    className?: string;
    placeholder?: string;
  }

  const ReactQuill: React.ComponentType<ReactQuillProps>;
  export default ReactQuill;
}

declare module 'react-quill/dist/quill.snow.css';
declare module 'react-quill/dist/quill.bubble.css';

// @material-tailwind/react type augmentation
import type { TypographyProps as MTTypographyProps } from '@material-tailwind/react';

declare module '@material-tailwind/react' {
  interface TypographyProps extends MTTypographyProps {
    placeholder?: string;
    onPointerEnterCapture?: React.PointerEventHandler;
    onPointerLeaveCapture?: React.PointerEventHandler;
    onResize?: React.ReactEventHandler;
    onResizeCapture?: React.ReactEventHandler;
  }
}
