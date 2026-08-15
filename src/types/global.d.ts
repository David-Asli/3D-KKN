declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      'auto-rotate'?: boolean;
      'camera-controls'?: boolean;
      'touch-action'?: string;
      'shadow-intensity'?: string | number;
      'shadow-softness'?: string | number;
      exposure?: string | number;
      'environment-image'?: string;
      poster?: string;
    };
  }
}
