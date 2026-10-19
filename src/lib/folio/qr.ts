type QROptions = {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  version?: number;
  margin?: number;
  width?: number;
  color?: { dark?: string; light?: string };
};

const INK = "#14120e";
const QUIET = "#fffdf8";

export async function deckCodeToQr(code: string): Promise<string> {
  const loaded = (await import("qrcode")) as {
    toDataURL?: (text: string, options?: QROptions) => Promise<string>;
    default?: { toDataURL: (text: string, options?: QROptions) => Promise<string> };
  };
  const toDataURL = loaded.toDataURL ?? loaded.default?.toDataURL;
  if (!toDataURL) throw new Error("No pude preparar el código QR.");
  const options: QROptions = {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 640,
    color: { dark: INK, light: QUIET },
  };
  try {
    return await toDataURL(code, { ...options, version: 9 });
  } catch {
    return toDataURL(code, options);
  }
}
