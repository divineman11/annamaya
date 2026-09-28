"""Generates icon-180.png and icon-512.png (no extra libraries needed). Run: python make_icons.py"""
import math, struct, zlib, os

JADE, PALE, SOFT, GHEE = (0x1F, 0x5C, 0x52), (0xEE, 0xF3, 0xF0), (0xDC, 0xEB, 0xE6), (0xB8, 0x89, 0x1A)

def color_at(x, y):
    # coordinates in 512-space
    cx, cy = 256, 280
    d = math.hypot(x - cx, y - cy)
    # drop: circle at (256, 274) r=58 plus triangle up to (256,150)
    in_drop = math.hypot(x - 256, y - 274) <= 58 or (150 <= y <= 274 and abs(x - 256) <= (y - 150) * 58 / 124)
    if in_drop: return GHEE
    if d <= 104: return SOFT
    if d <= 150: return PALE
    return JADE

def make(size, path):
    s = 512 / size
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            # 2x2 supersample
            acc = [0, 0, 0]
            for oy in (0.25, 0.75):
                for ox in (0.25, 0.75):
                    c = color_at((px + ox) * s, (py + oy) * s)
                    for i in range(3): acc[i] += c[i]
            row += bytes(v // 4 for v in acc)
        rows.append(bytes(row))
    raw = zlib.compress(b''.join(rows), 9)
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', raw) + chunk(b'IEND', b'')
    with open(path, 'wb') as f: f.write(png)

here = os.path.dirname(os.path.abspath(__file__))
make(180, os.path.join(here, 'icon-180.png'))
make(512, os.path.join(here, 'icon-512.png'))
print('icons written')
