declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);
    pipe(stream: any): this;
    fontSize(size: number): this;
    text(text: string, options?: any): this;
    text(text: string, x: number, y: number, options?: any): this;
    addPage(options?: any): this;
    end(): void;
    [key: string]: any;
  }
  export = PDFDocument;
}
