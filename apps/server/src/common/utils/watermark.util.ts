import sharp from "sharp";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

/**
 * Applies a small, crisp watermark to an image buffer.
 * If the buffer is not a valid image or Sharp fails, the original buffer is returned.
 */
export const applyWatermark = async (
  buffer: Buffer,
  text: string | string[],
): Promise<Buffer> => {
  try {
    const watermarkText = Array.isArray(text)
      ? text.map((line) => line.trim()).filter(Boolean).join(" | ")
      : text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .join(" | ");

    if (!watermarkText) {
      return buffer;
    }

    const image = sharp(buffer);
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (!width || !height) {
      return buffer;
    }

    const fontSize = width >= 1600 ? 14 : width >= 1000 ? 12 : 10;
    const paddingX = 8;
    const paddingY = 5;
    const margin = 8;
    const approxCharWidth = fontSize * 0.58;
    const textWidth = Math.ceil(watermarkText.length * approxCharWidth);
    const textHeight = Math.ceil(fontSize * 1.35);
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = textHeight + paddingY * 2;

    const svg = Buffer.from(`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="${Math.max(0, width - boxWidth - margin)}"
          y="${Math.max(0, height - boxHeight - margin)}"
          width="${boxWidth}"
          height="${boxHeight}"
          rx="4"
          ry="4"
          fill="rgba(255,255,255,0.78)"
          stroke="rgba(0,0,0,0.18)"
          stroke-width="1"
        />
        <text
          x="${Math.max(0, width - boxWidth - margin + paddingX)}"
          y="${Math.max(fontSize + 2, height - boxHeight - margin + paddingY + fontSize)}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}"
          font-weight="600"
          fill="rgba(0,0,0,0.9)"
        >${escapeXml(watermarkText)}</text>
      </svg>
    `);

    return await image
      .composite([
        {
          input: svg,
          left: 0,
          top: 0,
        },
      ])
      .toBuffer();
  } catch (error) {
    console.error("Failed to apply watermark, returning original buffer:", error);
    return buffer;
  }
};
