declare module "qrcode" {
  export type QRCodeToDataURLOptions = {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    version?: number;
    margin?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  };

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
}
