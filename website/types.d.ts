declare module 'react-quill-new' {
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

declare module 'react-quill-new/dist/quill.snow.css';
declare module 'react-quill-new/dist/quill.bubble.css';
