import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(size, primaryColor, textColor) {
  // Simple PNG encoder
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Draw rounded rect background
      const radius = Math.floor(size * 0.2);
      const isCorner = (x < radius || x >= width - radius) && (y < radius || y >= height - radius);
      let inBackground = true;
      if (isCorner) {
        const cx = x < radius ? radius : width - radius - 1;
        const cy = y < radius ? radius : height - radius - 1;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist > radius) inBackground = false;
      }

      // Draw text "RTL" or symbol arrows in center
      const inArrow = (y >= Math.floor(height * 0.35) && y <= Math.floor(height * 0.65)) &&
                      (x >= Math.floor(width * 0.2) && x <= Math.floor(width * 0.8));

      if (inBackground) {
        if (inArrow && size >= 32) {
          rawData[pixelOffset] = textColor[0];     // R
          rawData[pixelOffset + 1] = textColor[1]; // G
          rawData[pixelOffset + 2] = textColor[2]; // B
          rawData[pixelOffset + 3] = 255;          // A
        } else {
          rawData[pixelOffset] = primaryColor[0];     // R
          rawData[pixelOffset + 1] = primaryColor[1]; // G
          rawData[pixelOffset + 2] = primaryColor[2]; // B
          rawData[pixelOffset + 3] = 255;             // A
        }
      } else {
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function calcCRC(buf) {
    let c = 0xffffffff;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let k = n;
      for (let m = 0; m < 8; m++) {
        if (k & 1) k = 0xedb88320 ^ (k >>> 1);
        else k = k >>> 1;
      }
      table[n] = k;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    const crcVal = calcCRC(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Brand color: #4F46E5 (Indigo 600), White text #FFFFFF
const primary = [79, 70, 229];
const text = [255, 255, 255];

[16, 48, 128].forEach(size => {
  const iconBuffer = createPNG(size, primary, text);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), iconBuffer);
  console.log(`Generated icon${size}.png`);
});
