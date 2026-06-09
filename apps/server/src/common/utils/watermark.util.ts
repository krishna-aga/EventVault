import { Jimp } from "jimp";
import { SANS_16_WHITE, SANS_16_BLACK, SANS_32_WHITE, SANS_32_BLACK, SANS_64_WHITE, SANS_64_BLACK } from "jimp/fonts";

/**
 * Applies a text watermark to the given image buffer.
 * If the buffer is not a valid image or Jimp fails, the original buffer is returned.
 */
export const applyWatermark = async (
  buffer: Buffer,
  text: string,
): Promise<Buffer> => {
  try {
    const jimpAny = Jimp as any;
    const image = (await jimpAny.read(buffer)) as any;
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Load appropriate font based on image width
    let fontPath = SANS_16_WHITE;
    let shadowFontPath = SANS_16_BLACK;

    if (width > 1200) {
      fontPath = SANS_64_WHITE;
      shadowFontPath = SANS_64_BLACK;
    } else if (width > 600) {
      fontPath = SANS_32_WHITE;
      shadowFontPath = SANS_32_BLACK;
    }

    const [font, shadowFont] = await Promise.all([
      jimpAny.loadFont(fontPath),
      jimpAny.loadFont(shadowFontPath),
    ]);

    // Calculate watermark position (bottom center or bottom right)
    const textWidth = jimpAny.measureText(font, text);
    
    // Position at bottom-right corner with 20px padding
    const x = Math.max(20, width - textWidth - 30);
    const y = Math.max(20, height - 50);

    // Render shadow for contrast
    image.print({ font: shadowFont, x: x + 2, y: y + 2, text });
    // Render main white text
    image.print({ font, x, y, text });

    const mime = image.mime || "image/jpeg";
    return await image.getBufferAsync(mime);
  } catch (error) {
    console.error("Failed to apply watermark, returning original buffer:", error);
    return buffer;
  }
};
