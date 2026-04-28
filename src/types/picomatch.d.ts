declare module 'picomatch' {
  interface PicomatchOptions {
    dot?: boolean;
    nocase?: boolean;
  }

  type Matcher = (input: string) => boolean;

  function picomatch(pattern: string | string[], options?: PicomatchOptions): Matcher;

  namespace picomatch {
    function isMatch(input: string, pattern: string | string[], options?: PicomatchOptions): boolean;
  }

  export = picomatch;
}
