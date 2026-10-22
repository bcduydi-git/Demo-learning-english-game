"""Turns the players' own character art into game sprites.

    python3 tools/import_characters.py

Source: tools/source_art/lac_tim.webp — one sheet with two rows (Lắc on top,
Tím below) and four standing poses per row: facing down, left, right, up.

Output (client/public/assets/characters/<look>/):
- walk.png      4 rows (down, left, right, up) x 4 frames. The source only
                has standing poses, so steps are made by lifting one foot
                and bobbing the body by one pixel.
- portrait.png  head and shoulders taken from the large original art.
"""
import json
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'source_art', 'lac_tim.webp')
OUT = os.path.join(ROOT, 'client', 'public', 'assets', 'characters')

# The art keeps its own detail: the figure is ~46px tall inside a 32x64 frame
# and the game draws it at half size (about 23 world pixels, ~1.5 tiles), so
# it stands naturally next to the Ninja Adventure houses and trees.
HEIGHT = 46
FRAME_W, FRAME_H = 32, 64
DISPLAY_SCALE = 0.5
OUTLINE = (20, 16, 24, 255)

# pose boxes in the source sheet: (rows), then (columns per row)
ROWS = [(50, 513), (564, 1039)]
COLS = [[(83, 301), (431, 650), (798, 1020), (1148, 1365)],
        [(54, 315), (426, 678), (770, 1017), (1137, 1389)]]
LOOKS = [('lac', 'Lắc'), ('tim', 'Tím')]


def load():
    return Image.open(SRC).convert('RGBA')


def pose(im, row, col):
    y0, y1 = ROWS[row]
    x0, x1 = COLS[row][col]
    c = np.array(im.crop((x0 - 4, y0 - 4, x1 + 4, y1 + 4)))
    c[..., 3] = np.where(c[..., 3] > 128, 255, 0)
    return Image.fromarray(c)


def shrink(img, h):
    """Box-downscale with premultiplied alpha, then hard alpha edges."""
    w0, h0 = img.size
    w = max(1, round(w0 * h / h0))
    a = np.array(img).astype(np.float32)
    pm = a.copy()
    pm[..., :3] *= pm[..., 3:4] / 255
    s = np.array(Image.fromarray(pm.astype(np.uint8)).resize((w, h), Image.BOX)).astype(np.float32)
    al = np.array(Image.fromarray(a[..., 3].astype(np.uint8)).resize((w, h), Image.BOX)).astype(np.float32)
    rgb = np.where(al[..., None] > 0, s[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = rgb.clip(0, 255)
    out[..., 3] = np.where(al > 110, 255, 0)
    return Image.fromarray(out)


def quantize(img, n=24):
    """Snap the downscaled colours to a small palette so edges stay crisp."""
    a = np.array(img)
    rgb = Image.fromarray(a[..., :3]).quantize(colors=n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    a[..., :3] = np.array(rgb)
    return Image.fromarray(a)


def add_outline(img):
    """1px dark outline around the figure so it reads on grass and sand."""
    a = np.array(img)
    solid = a[..., 3] > 0
    n = np.zeros_like(solid)
    n[1:, :] |= solid[:-1, :]
    n[:-1, :] |= solid[1:, :]
    n[:, 1:] |= solid[:, :-1]
    n[:, :-1] |= solid[:, 1:]
    edge = n & ~solid
    a[edge] = OUTLINE
    return Image.fromarray(a)


def bottom_center(img, fw, fh):
    """Place a sprite in a frame, centred, feet on the bottom row."""
    frame = Image.new('RGBA', (fw, fh))
    bb = img.getbbox()
    img = img.crop(bb)
    x = (fw - img.size[0]) // 2
    y = fh - img.size[1]
    frame.alpha_composite(img, (x, y))
    return frame


def step_frames(stand, facing):
    """Make 4 walk frames (stand, step, stand, step) from one standing pose."""
    a = np.array(stand)
    h, w = a.shape[:2]
    rows = np.nonzero(a[..., 3].any(1))[0]
    top, bot = rows.min(), rows.max()
    hip = top + int((bot - top) * 0.70)  # legs are the lowest ~30%
    cols = np.nonzero(a[..., 3].any(0))[0]
    mid = (cols.min() + cols.max() + 1) // 2

    def shifted(region, dy=0, dx=0):
        out = np.zeros_like(region)
        ys = slice(max(0, -dy), h - max(0, dy))
        yd = slice(max(0, dy), h - max(0, -dy))
        xs = slice(max(0, -dx), w - max(0, dx))
        xd = slice(max(0, dx), w - max(0, -dx))
        out[yd, xd] = region[ys, xs]
        return out

    def compose(parts):
        out = np.zeros_like(a)
        for p in parts:
            m = p[..., 3] > 0
            out[m] = p[m]
        return Image.fromarray(out)

    upper = a.copy()
    upper[hip:] = 0
    seam = np.zeros_like(a)  # repeats the hip row so a 1px bob leaves no gap
    seam[hip - 1:hip + 1] = a[hip - 1:hip + 1]
    lower = a.copy()
    lower[:hip] = 0
    left_leg = lower.copy()
    left_leg[:, mid:] = 0
    right_leg = lower.copy()
    right_leg[:, :mid] = 0

    if facing in ('down', 'up'):
        f1 = compose([seam, shifted(right_leg), shifted(left_leg, dy=-1), shifted(upper, dy=-1)])
        f3 = compose([seam, shifted(left_leg), shifted(right_leg, dy=-1), shifted(upper, dy=-1)])
    else:
        fwd = 1 if facing == 'right' else -1
        feet = hip + (bot - hip) // 2
        back = lower.copy()
        front = lower.copy()
        if fwd > 0:
            back[:, mid:] = 0
            front[:, :mid] = 0
        else:
            back[:, :mid] = 0
            front[:, mid:] = 0
        back[:feet] = 0
        front[:feet] = 0
        thighs = lower.copy()
        thighs[feet:] = 0
        f1 = compose([seam, shifted(back, dx=-fwd), shifted(front, dx=fwd, dy=-1), shifted(thighs), shifted(upper, dy=-1)])
        f3 = compose([seam, shifted(front, dx=-fwd), shifted(back, dx=fwd, dy=-1), shifted(thighs), shifted(upper, dy=-1)])
    return [stand, f1, stand, f3]


def portrait(im, row):
    """Head and shoulders from the front pose, kept at the original detail."""
    y0, _ = ROWS[row]
    x0, x1 = COLS[row][0]
    cx = (x0 + x1) // 2
    size = int((x1 - x0) * 1.15)
    box = (cx - size // 2, y0 - 6, cx + size // 2, y0 - 6 + size)
    crop = im.crop(box)
    return crop.resize((190, 190), Image.LANCZOS)


def main():
    im = load()
    cfg_path = os.path.join(OUT, 'config.json')
    try:
        cfg = json.load(open(cfg_path, encoding='utf-8'))
    except Exception:
        cfg = {}
    for row, (look, name) in enumerate(LOOKS):
        small = [add_outline(quantize(shrink(pose(im, row, c), HEIGHT))) for c in range(4)]  # down, left, right, up
        fw, fh = FRAME_W, FRAME_H
        sheet = Image.new('RGBA', (fw * 4, fh * 4))
        for r, (spr, facing) in enumerate(zip(small, ['down', 'left', 'right', 'up'])):
            stand = bottom_center(spr, fw, fh)
            for f, frame in enumerate(step_frames(stand, facing)):
                sheet.alpha_composite(frame, (f * fw, r * fh))
        d = os.path.join(OUT, look)
        os.makedirs(d, exist_ok=True)
        sheet.save(os.path.join(d, 'walk.png'))
        portrait(im, row).save(os.path.join(d, 'portrait.png'))
        cfg[look] = {'name': name, 'frameWidth': fw, 'frameHeight': fh, 'scale': DISPLAY_SCALE, 'framesPerRow': 4, 'fps': 7}
        print(look, 'frame', fw, 'x', fh)
    cfg['_help'] = ('Nhân vật: mỗi thư mục (lac, tim) có walk.png = lưới 4 hàng (xuống, trái, phải, lên) x 4 khung bước đi, '
                    'và portrait.png = chân dung vuông. frameWidth/frameHeight = kích thước MỘT khung. '
                    'Tạo lại từ ảnh gốc: python3 tools/import_characters.py')
    for old in ('p1', 'p2'):
        cfg.pop(old, None)
    json.dump(cfg, open(cfg_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
