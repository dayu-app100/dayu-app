// 生成大鱼 App 图标（纯 Node，无依赖，输出 PNG）
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'www', 'icons');
const BRAND = [29, 158, 117];      // #1D9E75
const BRAND_DARK = [15, 110, 86];  // #0F6E56
const WHITE = [255, 255, 255];

function insideEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx, dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function insideTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function sample(x, y, S) {
  // 鱼身
  if (insideEllipse(x, y, S * 0.55, S * 0.52, S * 0.235, S * 0.155)) return WHITE;
  // 尾鳍
  if (insideTriangle(x, y, S * 0.34, S * 0.52, S * 0.17, S * 0.38, S * 0.17, S * 0.66)) return WHITE;
  // 背鳍
  if (insideTriangle(x, y, S * 0.5, S * 0.37, S * 0.63, S * 0.37, S * 0.55, S * 0.28)) return WHITE;
  return null;
}

function render(S) {
  const px = Buffer.alloc(S * S * 4);
  const SS = 3;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let cov = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (x + (sx + 0.5) / SS);
          const fy = (y + (sy + 0.5) / SS);
          // 眼睛位置挖空
          const inEye = insideEllipse(fx, fy, S * 0.66, S * 0.475, S * 0.021, S * 0.021);
          if (!inEye && sample(fx, fy, S)) cov++;
        }
      }
      const a = cov / (SS * SS);
      // 背景：轻微竖向明暗，保持扁平但有层次
      const t = y / S;
      const bg = t < 0.5 ? BRAND : BRAND_DARK;
      const i = (y * S + x) * 4;
      px[i] = Math.round(bg[0] * (1 - a) + WHITE[0] * a);
      px[i + 1] = Math.round(bg[1] * (1 - a) + WHITE[1] * a);
      px[i + 2] = Math.round(bg[2] * (1 - a) + WHITE[2] * a);
      px[i + 3] = 255;
    }
  }
  return px;
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(px, S) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  const raw = Buffer.alloc((S * 4 + 1) * S);
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0; // filter none
    px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function resize(src, S, target) {
  const out = Buffer.alloc(target * target * 4);
  const scale = S / target;
  for (let y = 0; y < target; y++) {
    for (let x = 0; x < target; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      const x0 = Math.floor(x * scale), x1 = Math.min(S, Math.ceil((x + 1) * scale));
      const y0 = Math.floor(y * scale), y1 = Math.min(S, Math.ceil((y + 1) * scale));
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * S + sx) * 4;
          r += src[i]; g += src[i + 1]; b += src[i + 2]; a += src[i + 3]; n++;
        }
      }
      const o = (y * target + x) * 4;
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n); out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const base = 1024;
const big = render(base);
fs.writeFileSync(path.join(OUT, 'icon-1024.png'), encodePNG(big, base));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), encodePNG(resize(big, base, 512), 512));
fs.writeFileSync(path.join(OUT, 'icon-180.png'), encodePNG(resize(big, base, 180), 180));
console.log('图标已生成:', fs.readdirSync(OUT).join(', '));
