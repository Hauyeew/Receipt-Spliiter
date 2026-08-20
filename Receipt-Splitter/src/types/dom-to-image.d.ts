declare module 'dom-to-image' {
  type DomToImageOptions = {
    quality?: number;
    width?: number;
    height?: number;
  };

  export function toPng(node: Node, options?: DomToImageOptions): Promise<string>;
  export function toJpeg(node: Node, options?: DomToImageOptions): Promise<string>;

  const domtoimage: {
    toPng: typeof toPng;
    toJpeg: typeof toJpeg;
  };

  export default domtoimage;
}
