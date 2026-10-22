"""Turns the large drawings in tools/source_art/ into game-size sprites.

    python3 tools/import_gpt_art.py

Sources (big, transparent PNGs; see docs/THAY_HINH_NHAN_VAT.md):
- <look>_walk_{down,right,up}.png   4 walk frames side by side. Left is
                                    the right row mirrored.
- <name>_face.png                   square dialogue portraits.
- the objects in OBJECTS            1 or 2 states side by side, or 4
                                    animation frames for the storm.

Every drawing is shrunk with the same steps as Lắc/Tím's original art
(box downscale, small palette, 1px dark outline) so it matches the
Ninja Adventure pixel size.
"""
import json
import os

import numpy as np
from PIL import Image, ImageOps

from import_characters import FRAME_H, FRAME_W, HEIGHT, OUT as CHAR_OUT, add_outline, shrink

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'source_art')
ASSETS = os.path.join(ROOT, 'client', 'public', 'assets')

# file -> (output paths per state, box w, box h, colours)
OBJECTS = {
    'lighthouse': (['props/lighthouse.png', 'props/lighthouse_on.png'], 64, 144, 32),
    'watchtower': (['props/tower.png'], 40, 72, 24),
    'log': (['props/log.png'], 48, 24, 20),
    'wreck': (['props/wreck.png'], 56, 40, 24),
    'radio_station': (['props/station.png', 'props/station_on.png'], 32, 28, 24),
    'lens': (['props/lens.png'], 16, 16, 12),
    'lamp': (['boss/lamp0.png', 'boss/lamp1.png'], 64, 64, 32),
    'rescue_boat': (['boss/boat.png'], 24, 40, 20),
    'sea_rock': (['boss/searock.png'], 24, 20, 16),
    'mast': (['boss/mast.png'], 48, 15, 16),
}
STORM_FRAMES = 4
STORM_BOX = (128, 96)
FACES = ['captain', 'keeper', 'pip', 'storm']
PORTRAIT = 190


def load(name):
    return Image.open(os.path.join(SRC, name)).convert('RGBA')


def hard_alpha(img):
    a = np.array(img)
    a[..., 3] = np.where(a[..., 3] > 128, 255, 0)
    return Image.fromarray(a)


def segments(img, n=None, gap=12):
    """Split a strip of drawings at the empty columns between them."""
    if n and n > 1 and not _gaps(img, gap)[n - 1:]:
        w = img.size[0] / n  # drawings touch: equal cells
        return [img.crop((round(i * w), 0, round((i + 1) * w), img.size[1])) for i in range(n)]
    return [img.crop((x0, 0, x1, img.size[1])) for x0, x1 in _gaps(img, gap)]


def _gaps(img, gap):
    col = (np.array(img)[..., 3] > 128).sum(0) > 2
    segs, s = [], None
    for x, v in enumerate(col):
        if v and s is None:
            s = x
        if not v and s is not None:
            segs.append([s, x])
            s = None
    if s is not None:
        segs.append([s, len(col)])
    out = []
    for g in segs:
        if out and g[0] - out[-1][1] < gap:
            out[-1][1] = g[1]
        else:
            out.append(g)
    return [tuple(g) for g in out if g[1] - g[0] > 20]


def quantize(img, n):
    """Small palette built from the visible pixels only, so the empty
    background does not use up colours (white shirts, glowing eyes stay)."""
    a = np.array(img)
    solid = a[..., 3] > 0
    px = a[solid][:, :3]
    if len(px) == 0:
        return img
    pal = Image.fromarray(px[None]).quantize(colors=n, method=Image.Quantize.MEDIANCUT, kmeans=4, dither=Image.Dither.NONE)
    a[solid, :3] = np.array(pal.convert('RGB'))[0]
    return Image.fromarray(a)


def legs_from(frame, other):
    """Upper body of `frame` on the mirrored legs of `other` (opposite step)."""
    a, b = np.array(frame), np.array(ImageOps.mirror(other))
    rows = np.nonzero(a[..., 3].any(1))[0]
    hip = rows.min() + int((rows.max() - rows.min()) * 0.66)
    out = a.copy()
    out[hip:] = b[hip:]
    return Image.fromarray(out)


def shrink_by(img, scale):
    return shrink(img, max(1, round(img.size[1] * scale)))


def finish(imgs, colours):
    """Quantize several same-size images with one shared palette, then outline."""
    w, h = imgs[0].size
    strip = Image.new('RGBA', (w * len(imgs), h))
    for i, im in enumerate(imgs):
        strip.alpha_composite(im, (i * w, 0))
    strip = add_outline(quantize(strip, colours))
    return [strip.crop((i * w, 0, (i + 1) * w, h)) for i in range(len(imgs))]


def fit_states(parts, bw, bh, colours, pad=1):
    """Shrink every state with one scale so they line up, feet on the bottom row."""
    parts = [hard_alpha(p) for p in parts]  # faint specks must not widen the box
    boxes = [p.getbbox() for p in parts]
    left = min(b[0] for b in boxes)
    right = max(b[2] for b in boxes)
    top = min(b[1] for b in boxes)
    bot = max(b[3] for b in boxes)
    scale = min((bw - 2 * pad) / (right - left), (bh - pad) / (bot - top))
    out = []
    for p in parts:
        small = shrink_by(p.crop((left, top, right, bot)), scale)
        frame = Image.new('RGBA', (bw, bh))
        frame.alpha_composite(small, ((bw - small.size[0]) // 2, bh - small.size[1]))
        out.append(frame)
    return finish(out, colours)


def objects():
    for name, (paths, bw, bh, colours) in OBJECTS.items():
        parts = segments(load(f'{name}.png'), len(paths))
        assert len(parts) == len(paths), (name, len(parts))
        for img, path in zip(fit_states(parts, bw, bh, colours), paths):
            img.save(os.path.join(ASSETS, path))
        print('object', name, '->', ', '.join(paths))
    frames = fit_states(segments(load('storm.png'), STORM_FRAMES), *STORM_BOX, 24)
    sheet = Image.new('RGBA', (STORM_BOX[0] * STORM_FRAMES, STORM_BOX[1]))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (i * STORM_BOX[0], 0))
    sheet.save(os.path.join(ASSETS, 'boss', 'storm.png'))
    print('storm', STORM_FRAMES, 'frames')


def faces():
    for name in FACES:
        im = load(f'{name}_face.png')
        x0, y0, x1, y1 = im.getbbox()
        side = max(x1 - x0, y1 - y0)
        sq = Image.new('RGBA', (side, side))
        sq.alpha_composite(im.crop((x0, y0, x1, y1)), ((side - (x1 - x0)) // 2, side - (y1 - y0)))
        sq.resize((PORTRAIT, PORTRAIT), Image.LANCZOS).save(os.path.join(ASSETS, 'portraits', f'{name}.png'))
        print('portrait', name)


def anchor_x(img):
    """Centre of the head, so the body does not slide sideways between frames."""
    a = np.array(img)[..., 3] > 0
    rows = np.nonzero(a.any(1))[0]
    head = a[rows.min():rows.min() + max(1, (rows.max() - rows.min()) // 4)]
    cols = np.nonzero(head.any(0))[0]
    return (cols.min() + cols.max() + 1) / 2


def walk(look):
    rows = {}
    for facing in ('down', 'right', 'up'):
        parts = [hard_alpha(p) for p in segments(load(f'{look}_walk_{facing}.png'), 4)]
        assert len(parts) == 4, (look, facing, len(parts))
        stand = parts[0].getbbox()
        scale = HEIGHT / (stand[3] - stand[1])  # standing frame = HEIGHT pixels
        frames = []
        for p in parts:
            bb = p.getbbox()
            small = shrink_by(p.crop(bb), scale)
            frame = Image.new('RGBA', (FRAME_W, FRAME_H))
            x = min(max(0, round(FRAME_W / 2 - anchor_x(small))), FRAME_W - small.size[0])
            frame.alpha_composite(small, (x, FRAME_H - small.size[1]))
            frames.append(frame)
        if facing != 'right':  # front/back: make sure the two steps use opposite feet
            frames[3] = legs_from(frames[3], frames[1])
        rows[facing] = frames
    rows['left'] = [ImageOps.mirror(f) for f in rows['right']]
    order = ['down', 'left', 'right', 'up']
    cells = finish([f for d in order for f in rows[d]], 32)
    sheet = Image.new('RGBA', (FRAME_W * 4, FRAME_H * 4))
    for i, c in enumerate(cells):
        sheet.alpha_composite(c, ((i % 4) * FRAME_W, (i // 4) * FRAME_H))
    sheet.save(os.path.join(CHAR_OUT, look, 'walk.png'))
    print('walk', look)


def main():
    for look in ('lac', 'tim'):
        if os.path.exists(os.path.join(SRC, f'{look}_walk_down.png')):
            walk(look)
    faces()
    objects()
    cfg_path = os.path.join(CHAR_OUT, 'config.json')
    cfg = json.load(open(cfg_path, encoding='utf-8'))
    cfg['_help'] = ('Nhân vật: mỗi thư mục (lac, tim) có walk.png = lưới 4 hàng (xuống, trái, phải, lên) x 4 khung bước đi, '
                    'và portrait.png = chân dung vuông. frameWidth/frameHeight = kích thước MỘT khung. '
                    'Tạo lại: python3 tools/import_characters.py (chân dung) rồi python3 tools/import_gpt_art.py (bước đi, NPC, đồ vật)')
    json.dump(cfg, open(cfg_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
