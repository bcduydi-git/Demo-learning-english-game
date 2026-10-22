"""Builds the game's art from the CC0 "Ninja Adventure" pack (Pixel-boy).

    npm run art            (python3 tools/build_art.py)

- tools/vendor/ninja-adventure/  : the original pack files we use (CC0)
- tools/map_gen.py               : island layout (collision + object places)
- tools/gen_art.py               : drawing helpers for the few things the
                                   pack does not have (lighthouse, watchtower,
                                   log, parrot face...). They are drawn in the
                                   pack's palette with its black outline.

Output: client/public/assets/ (same file names the game already loads).
Hand-made character art in assets/characters/ is never overwritten unless
you pass --characters.
"""
import json
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import map_gen
import gen_art as GA

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENDOR = os.path.join(ROOT, 'tools', 'vendor', 'ninja-adventure')
OUT = os.path.join(ROOT, 'client', 'public', 'assets')
T = 16

TS = Image.open(os.path.join(VENDOR, 'tileset.png')).convert('RGBA')


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


# palette sampled from the pack
C = {k: hexc(v) for k, v in dict(
    ink='020202',
    sand='ffad5d', sandL='ffcb8d', sandD='f29b4a', fringe='e8642c', fringe2='c84a22',
    water='72c4e6', waterM='43b1de', waterD='367c98', waterL='96dbea',
    grass='73ad28', grass2='5a9e2b', grassD='4a952d', grassDD='387d2d', grassY='c4bc39',
    dirt='bf5f29', dirt2='b64e20', dirtD='8c3b1a',
    earth='c15326', earthD='9e2919', earthM='af3e20',
    wood='e08a3c', woodD='a8572a', woodL='f5b264', cream='ffe1b0', creamD='e8b884',
    white='f7f1e3', white2='d8cdb9', red='c8392b', red2='8f2a1f', glass='ffe07a', glass2='f5a53a',
    stone='9a8f86', stoneD='6e625c', stoneL='c7bdb3',
).items()}


def save(img, name):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)


def rect(x, y, w, h):
    return TS.crop((x, y, x + w, y + h))


def tile(c, r, w=1, h=1):
    return rect(c * T, r * T, w * T, h * T)


def trim(img):
    bb = img.getbbox()
    return img.crop(bb) if bb else img


def outline(img, color=None):
    return GA.outline(img, color or C['ink'])


# ------------------------------------------------------------------ ground
def render_ground(m):
    W, H = m['w'], m['h']
    PW, PH = W * T, H * T
    ground = m['ground']

    def tile_field(chars):
        f = np.zeros((H, W), np.float32)
        for y in range(H):
            for x in range(W):
                if ground[y][x] in chars:
                    f[y, x] = 1.0
        im = Image.fromarray((f * 255).astype(np.uint8), 'L').resize((PW, PH), Image.BILINEAR)
        return np.array(im, dtype=np.float32) / 255.0

    n1 = GA.value_noise(PW, PH, 6, 1)
    n2 = GA.value_noise(PW, PH, 3, 2)
    n3 = GA.value_noise(PW, PH, 24, 3)
    fine = np.random.RandomState(5).rand(PH, PW)

    land = (tile_field('."h:#=W%') + (n1 - 0.5) * 0.4) > 0.5
    grass = ((tile_field('"h:') + (n1 - 0.5) * 0.45) > 0.5) & land
    path = ((tile_field(':') + (n2 - 0.5) * 0.35) > 0.55) & land
    hedge = (tile_field('h') > 0.4) & land

    img = np.zeros((PH, PW, 4), np.uint8)

    def paint(mask, color):
        img[mask] = color

    def texture(mask, tile_img):
        """fill a mask with a repeating 16x16 pack tile"""
        t = np.array(tile_img)
        ys, xs = np.nonzero(mask)
        img[ys, xs] = t[ys % T, xs % T]

    def ring(mask, steps=1):
        m = Image.fromarray((mask * 255).astype(np.uint8), 'L')
        inner = np.array(m.filter(ImageFilter.MinFilter(1 + 2 * steps))) > 0
        return mask & ~inner

    # sand: flat pack colour, soft lighter patches, a few dark grains
    paint(land, C['sand'])
    paint(land & (fine > 0.993), C['sandD'])
    paint(land & (fine < 0.004), C['sandL'])
    # red fringe where sand meets the sea (like the pack's pond edge)
    sand_edge = ring(land, 1)
    jag = (n2 > 0.45) | (fine > 0.8)
    paint(sand_edge & jag & ~grass, C['fringe'])
    paint(ring(land, 2) & ~ring(land, 1) & (fine > 0.75) & ~grass, C['fringe'])

    # grass: the pack's grass tiles
    texture(grass, tile(22, 11))
    texture(grass & (n3 > 0.8), tile(23, 11))
    texture(hedge, tile(23, 11))
    gedge = ring(grass, 1)
    paint(gedge, C['grassDD'])
    # little tufts sticking out over the sand
    gm = Image.fromarray((grass * 255).astype(np.uint8), 'L')
    grown = np.array(gm.filter(ImageFilter.MaxFilter(3))) > 0
    tufts = grown & ~grass & land & (n2 > 0.62)
    paint(tufts, C['grassDD'])

    # paths: the pack's dirt texture with a dark lip
    texture(path, tile(23, 16))
    paint(ring(path, 1), C['dirtD'])

    # sea: transparent (animated water below) + pack-style rim bands
    water = ~land
    lm = Image.fromarray((land * 255).astype(np.uint8), 'L')
    d1 = np.array(lm.filter(ImageFilter.MaxFilter(3))) > 0
    d3 = np.array(lm.filter(ImageFilter.MaxFilter(7))) > 0
    d6 = np.array(lm.filter(ImageFilter.MaxFilter(13))) > 0
    paint(water & d6, (*C['waterM'][:3], 110))
    paint(water & d3, C['waterM'])
    paint(water & d1, C['waterD'])

    out = Image.fromarray(img, 'RGBA')

    # tile layers: cliff band, dock, interior
    face = rect(208, 272, 16, 16)
    face_l = rect(176, 272, 16, 16)
    face_r = rect(240, 272, 16, 16)
    lip = rect(208, 256, 16, 16)
    for y in range(H):
        for x in range(W):
            c = ground[y][x]
            X, Y = x * T, y * T
            below = ground[y + 1][x] if y + 1 < H else '~'
            left = ground[y][x - 1] if x > 0 else '~'
            right = ground[y][x + 1] if x + 1 < W else '~'
            if c == '#':
                if below != '#':
                    t = face
                    if left == ':':
                        t = face_l
                    elif right == ':':
                        t = face_r
                    out.paste(t, (X, Y), t)
                else:
                    out.paste(lip, (X, Y), lip)
            elif c == '=' and x < 60:  # dock planks
                pl = tile(25, 8)
                out.paste(pl, (X, Y), pl)
    draw_interior(out, m)
    sprinkle(out, m)
    return out


def draw_interior(out, m):
    """Cottage interior: wooden floor and a cream frame, in the pack's style."""
    ground = m['ground']
    xs = [x for y, row in enumerate(ground) for x, c in enumerate(row) if c in 'W=' and x >= 60]
    ys = [y for y, row in enumerate(ground) for x, c in enumerate(row) if c in 'W=' and x >= 60]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    d = ImageDraw.Draw(out)
    d.rectangle([(x0 - 1) * T, (y0 - 2) * T, (x1 + 2) * T - 1, (y1 + 2) * T - 1], fill=(14, 11, 20, 255))
    floor_a, floor_b = rect(16, 496, 16, 16), rect(32, 496, 16, 16)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if ground[y][x] == '=':
                t = floor_a if (x + y) % 2 else floor_b
                out.paste(t, (x * T, y * T))
    # frame: thick cream border with brown inner line and black outline
    L, Tp, R, B = x0 * T + 6, y0 * T + 4, (x1 + 1) * T - 6, (y1 + 1) * T - 6
    d.rounded_rectangle([L - 6, Tp - 14, R + 6, B + 6], 8, fill=C['ink'])
    d.rounded_rectangle([L - 4, Tp - 12, R + 4, B + 4], 7, fill=C['cream'])
    d.rounded_rectangle([L + 3, Tp - 5, R - 3, B - 3], 4, fill=C['woodD'])
    d.rounded_rectangle([L + 4, Tp + 4, R - 4, B - 4], 3, fill=C['ink'])
    # back wall (wood panels) along the top
    for x in range(x0 + 1, x1):
        X = x * T
        d.rectangle([X, Tp - 4, X + 15, Tp + 3], fill=C['woodD'])
        d.line([X, Tp - 4, X, Tp + 3], fill=C['ink'])
    # re-lay the floor inside the frame
    for y in range(y0 + 1, y1):
        for x in range(x0 + 1, x1):
            t = floor_a if (x + y) % 2 else floor_b
            out.paste(t, (x * T, y * T))
    # doorway at the bottom
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if y == y1 and ground[y][x] == '=':
                d.rectangle([x * T + 1, y * T - 4, x * T + 14, y * T + 15], fill=C['ink'])
                out.paste(floor_b, (x * T, y * T - 2))
                d.rectangle([x * T + 2, y * T + 12, x * T + 13, y * T + 15], fill=(60, 40, 30, 255))


def sprinkle(out, m):
    """Small ground details from the pack: flowers, stones, shells."""
    rnd = random.Random(9)
    ground, grid = m['ground'], m['grid']
    flower_a = rect(16, 128, 16, 16)
    flower_b = rect(32, 128, 16, 16)
    tuft = rect(0, 80, 16, 16)
    stones = rect(48, 224, 16, 16)
    shells = rect(48, 192, 16, 16)
    for y in range(m['h']):
        for x in range(m['w']):
            c = ground[y][x]
            if grid[y][x] in 'TotBx':
                continue
            r = rnd.random()
            pos = (x * T, y * T)
            if c == '"':
                if r < 0.03:
                    out.alpha_composite(tuft, pos)
                elif r < 0.05:
                    out.alpha_composite(flower_a if rnd.random() < 0.5 else flower_b, pos)
            elif c == '.' and y > 40:
                if r < 0.02:
                    out.alpha_composite(stones, pos)
                elif r < 0.035:
                    out.alpha_composite(shells, pos)


def water_tiles():
    a, b, c = tile(23, 6), tile(23, 7), tile(23, 9)
    plain = Image.new('RGBA', (16, 16), C['water'])
    for f, layout in enumerate([[plain, a, plain, plain, b, plain, plain, c], [plain, plain, b, plain, plain, a, c, plain]]):
        im = Image.new('RGBA', (64, 64), C['water'])
        rnd = random.Random(3 + f)
        for j in range(4):
            for i in range(4):
                t = layout[(i + j * 4 + rnd.randint(0, 7)) % len(layout)]
                im.paste(t, (i * 16, j * 16))
        save(im, f'water{f}.png')


# ------------------------------------------------------------------ props
def pack_props():
    P = {}
    P['tree0'] = rect(0, 160, 32, 32)            # round tree
    P['tree1'] = rect(96, 160, 32, 32)           # pine
    P['boulder'] = trim(rect(192, 160, 32, 32))
    P['rock0'] = trim(tile(0, 7))
    P['rock1'] = trim(tile(1, 7))
    P['bush'] = trim(tile(0, 6))
    P['plant0'] = trim(rect(208, 128, 16, 16))
    P['plant1'] = trim(rect(208, 144, 16, 16))
    P['hedge0'] = tile(0, 6)
    P['hedge1'] = tile(0, 6)
    P['sign'] = trim(tile(14, 8))
    P['thorns'] = trim(tile(10, 17))
    P['lens'] = trim(tile(8, 12))
    cr = np.array(tile(24, 7))
    waterish = (cr[:, :, 2].astype(int) > cr[:, :, 0].astype(int) + 40)  # blue sea pixels around the crate
    cr[waterish] = (0, 0, 0, 0)
    P['crate'] = trim(Image.fromarray(cr))
    c = P['crate'].copy()
    dd = ImageDraw.Draw(c)
    dd.rectangle([2, 1, c.size[0] - 3, 4], fill=C['ink'])
    P['crate_open'] = c
    P['cottage'] = rect(0, 0, 64, 48)
    lit = P['cottage'].copy()
    dd = ImageDraw.Draw(lit)
    for wx in (6, 46):  # warm light in the windows once the power is on
        dd.rectangle([wx, 31, wx + 10, 39], fill=C['glass'])
        dd.line([wx + 5, 31, wx + 5, 39], fill=C['woodD'])
    P['cottage_lit'] = lit
    P['shed'] = rect(256, 0, 48, 32)
    on = P['shed'].copy()
    dd = ImageDraw.Draw(on)
    dd.ellipse([19, 19, 28, 28], fill=C['glass'])
    P['shed_on'] = on
    ch = Image.open(os.path.join(VENDOR, 'items', 'little-treasure-chest.png')).convert('RGBA')
    P['chest'] = trim(ch.crop((0, 0, 16, 16)))
    P['chest_open'] = trim(ch.crop((16, 0, 32, 16)))
    P['bottle'] = Image.open(os.path.join(VENDOR, 'items', 'water-pot.png')).convert('RGBA')
    # interior furniture
    P['shelf'] = rect(160, 592, 32, 32)
    P['iplant'] = rect(0, 592, 16, 32)
    P['rug'] = rect(112, 592, 48, 48)
    desk = Image.new('RGBA', (32, 24))
    table = rect(208, 624, 32, 16)
    desk.alpha_composite(table, (0, 8))
    book = trim(rect(48, 624, 16, 16))
    desk.alpha_composite(book, (8, 6))
    P['desk'] = desk
    P['bed'] = rect(64, 592, 32, 32)
    for k, v in P.items():
        save(v, f'props/{k}.png')
    return P


def custom_props():
    """Things the pack does not have, drawn in its palette with black outlines."""
    ink = C['ink']

    # lighthouse
    for on in (0, 1):
        im = GA.new(64, 144)
        d = ImageDraw.Draw(im)
        cx = 32
        GA.shadow(d, cx, 139, 26, 5)
        d.rectangle([10, 104, 54, 139], fill=C['white2'])
        d.rectangle([10, 104, 54, 108], fill=C['white'])
        for y in range(112, 136, 8):
            d.line([12, y, 52, y], fill=C['stoneL'])
        d.rectangle([10, 134, 54, 139], fill=C['stone'])
        top, bot = 26, 110
        for y in range(top, bot):
            t = (y - top) / (bot - top)
            half = int(9 + t * 9)
            stripe = ((y - top) // 14) % 2 == 1
            base = C['red'] if stripe else C['white']
            dark = C['red2'] if stripe else C['white2']
            d.line([cx - half, y, cx + half, y], fill=base)
            d.line([cx + half - 5, y, cx + half, y], fill=dark)
        for wy in (50, 78):
            d.rectangle([cx - 2, wy, cx + 2, wy + 6], fill=C['woodD'])
        d.rectangle([cx - 15, 21, cx + 15, 26], fill=C['stoneD'])
        for x in range(cx - 14, cx + 15, 4):
            d.line([x, 16, x, 21], fill=C['stoneD'])
        d.line([cx - 15, 16, cx + 15, 16], fill=C['stoneD'])
        d.rectangle([cx - 9, 7, cx + 9, 20], fill=C['glass'] if on else (88, 112, 140, 255))
        for x in (cx - 4, cx + 3):
            d.line([x, 7, x, 20], fill=C['stoneD'])
        if on:
            d.ellipse([cx - 4, 10, cx + 4, 17], fill=C['white'])
        d.polygon([(cx - 11, 7), (cx, 0), (cx + 11, 7)], fill=C['red2'])
        d.rectangle([cx - 6, 118, cx + 6, 139], fill=C['stoneD'])
        d.rectangle([cx - 5, 119, cx + 5, 139], fill=C['woodD'])
        d.line([cx, 119, cx, 139], fill=C['ink'])
        d.rectangle([cx + 7, 124, cx + 10, 129], fill=C['stoneD'])
        save(outline(im), 'props/lighthouse_on.png' if on else 'props/lighthouse.png')

    # watchtower (wood, pack colours)
    im = GA.new(40, 72)
    d = ImageDraw.Draw(im)
    GA.shadow(d, 20, 68, 16, 3)
    for x in (6, 31):
        d.rectangle([x, 26, x + 3, 68], fill=C['woodD'])
        d.line([x + 1, 26, x + 1, 68], fill=C['wood'])
    d.line([8, 34, 32, 60], fill=C['woodD'], width=2)
    d.line([32, 34, 8, 60], fill=C['woodD'], width=2)
    d.line([16, 30, 16, 68], fill=C['wood'])
    d.line([23, 30, 23, 68], fill=C['wood'])
    for y in range(32, 68, 5):
        d.line([16, y, 23, y], fill=C['woodL'])
    d.rectangle([2, 18, 37, 27], fill=C['wood'])
    d.rectangle([2, 18, 37, 20], fill=C['woodL'])
    d.line([2, 27, 37, 27], fill=C['woodD'])
    for x in range(3, 38, 6):
        d.line([x, 8, x, 18], fill=C['woodD'])
    d.line([2, 10, 37, 10], fill=C['woodD'])
    d.polygon([(0, 8), (20, 0), (40, 8)], fill=C['earth'])
    d.line([0, 8, 40, 8], fill=C['earthD'])
    save(outline(im), 'props/tower.png')

    # fallen log
    im = GA.new(48, 24)
    d = ImageDraw.Draw(im)
    GA.shadow(d, 24, 19, 22, 4)
    d.rounded_rectangle([2, 7, 45, 19], 5, fill=C['earthM'])
    d.rounded_rectangle([2, 7, 45, 11], 4, fill=C['earth'])
    for x in range(6, 40, 7):
        d.line([x, 10, x + 3, 17], fill=C['earthD'])
    d.ellipse([37, 6, 47, 19], fill=C['woodL'])
    d.ellipse([39, 9, 45, 16], fill=C['wood'])
    d.point((42, 12), fill=C['woodD'])
    d.line([14, 8, 10, 1], fill=C['earthD'], width=2)
    d.ellipse([4, 0, 13, 6], fill=C['grass'])
    d.ellipse([22, 2, 31, 9], fill=C['grass2'])
    save(outline(im), 'props/log.png')

    # shipwreck: the pack's rowboat, tilted, with a broken mast
    boat = rect(400, 160, 48, 16)
    im = GA.new(56, 40)
    d = ImageDraw.Draw(im)
    GA.shadow(d, 28, 35, 25, 4)
    im.alpha_composite(boat.rotate(-8, expand=True, resample=Image.NEAREST), (3, 16))
    d = ImageDraw.Draw(im)
    d.line([24, 22, 18, 3], fill=C['woodD'], width=3)
    d.polygon([(19, 5), (32, 9), (26, 17), (21, 14)], fill=C['white'])
    d.line([19, 5, 32, 9], fill=C['white2'])
    save(outline(im), 'props/wreck.png')

    # door glow and the radio station
    im = GA.new(16, 16)
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, 13, 13], fill=(120, 255, 200, 90))
    d.rectangle([5, 5, 10, 10], fill=(180, 255, 220, 200))
    save(im, 'props/door_glow.png')
    for on in (0, 1):
        im = GA.new(32, 28)
        im.alpha_composite(rect(208, 624, 32, 16), (0, 12))
        d = ImageDraw.Draw(im)
        d.rectangle([5, 2, 26, 13], fill=C['stoneD'])
        d.rectangle([5, 2, 26, 3], fill=C['stone'])
        d.rectangle([7, 5, 15, 11], fill=(40, 60, 50, 255))
        if on:
            d.line([8, 9, 10, 6], fill=(110, 230, 120, 255))
            d.line([10, 6, 12, 10], fill=(110, 230, 120, 255))
            d.line([12, 10, 14, 7], fill=(110, 230, 120, 255))
        d.ellipse([18, 5, 22, 9], fill=C['stoneL'])
        d.ellipse([22, 7, 25, 10], fill=C['stoneL'])
        d.line([24, 2, 28, -4], fill=C['stone'])
        save(outline(im), 'props/station_on.png' if on else 'props/station.png')


# ------------------------------------------------------------------ characters
def pack_character(src):
    """Pack sheets: 4 columns (down, up, left, right) x rows of walk frames.
    The game uses rows (down, left, right, up) x 4 frames."""
    im = Image.open(os.path.join(VENDOR, 'characters', src)).convert('RGBA')
    out = Image.new('RGBA', (64, 64))
    for row, col in enumerate([0, 2, 3, 1]):
        for f in range(4):
            out.paste(im.crop((col * 16, f * 16, col * 16 + 16, f * 16 + 16)), (f * 16, row * 16))
    return out


def faceset(src):
    return Image.open(os.path.join(VENDOR, 'faceset', src)).convert('RGBA')


def small_portraits():
    """38x38 portraits in the facesets' style for characters the pack lacks."""
    def base():
        im = Image.new('RGBA', (38, 38), (18, 16, 26, 255))
        return im, ImageDraw.Draw(im)

    # Pip the parrot
    im, d = base()
    d.polygon([(10, 30), (6, 38), (16, 38)], fill=(60, 120, 220, 255))
    d.ellipse([7, 17, 27, 40], fill=(214, 58, 52, 255))
    d.ellipse([9, 26, 19, 38], fill=(242, 201, 76, 255))
    d.ellipse([11, 4, 31, 24], fill=(214, 58, 52, 255))
    d.ellipse([20, 9, 27, 16], fill=C['white'])
    d.rectangle([23, 11, 25, 14], fill=C['ink'])
    d.point((23, 11), fill=C['white'])
    d.polygon([(29, 12), (37, 15), (33, 22), (28, 19)], fill=(240, 226, 192, 255))
    d.polygon([(28, 19), (33, 22), (30, 24)], fill=(58, 48, 48, 255))
    d.polygon([(14, 6), (12, 0), (18, 5)], fill=(242, 201, 76, 255))
    save(outline(im), 'portraits/pip.png')

    # Eleanor (only a voice on the radio): an old radio with her photo
    im, d = base()
    d.rounded_rectangle([3, 13, 35, 35], 3, fill=C['wood'])
    d.rounded_rectangle([3, 13, 35, 16], 2, fill=C['woodL'])
    d.rectangle([7, 19, 20, 32], fill=C['woodD'])
    for y in range(21, 31, 3):
        d.line([8, y, 19, y], fill=C['earthD'])
    d.ellipse([24, 19, 31, 26], fill=C['stoneL'])
    d.rectangle([23, 28, 32, 31], fill=(40, 60, 50, 255))
    d.line([29, 13, 36, 2], fill=C['stone'])
    d.rectangle([8, 2, 20, 13], fill=C['white'])
    d.rectangle([9, 3, 19, 11], fill=(176, 150, 120, 255))
    d.ellipse([12, 4, 16, 8], fill=(110, 90, 75, 255))
    d.rectangle([11, 8, 17, 11], fill=(95, 75, 65, 255))
    save(outline(im), 'portraits/keeper.png')

    # the Storm
    im, d = base()
    for (x, y, r) in ((12, 22, 11), (25, 19, 12), (19, 13, 10), (29, 28, 8)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=(53, 58, 82, 255))
    for (x, y, r) in ((18, 12, 7), (26, 16, 8)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=(74, 79, 106, 255))
    d.polygon([(10, 20), (17, 18), (16, 23)], fill=(255, 226, 107, 255))
    d.polygon([(28, 18), (21, 18), (23, 23)], fill=(255, 226, 107, 255))
    d.arc([12, 24, 27, 33], 200, 340, fill=(255, 226, 107, 255), width=2)
    save(outline(im), 'portraits/storm.png')


def pip_sheet():
    """Pip in the game world: the pack's red bird (monster 9), flying frames."""
    im = Image.open(os.path.join(VENDOR, 'monsters', '9.png')).convert('RGBA')
    sheet = Image.new('RGBA', (64, 16))
    # frames 0-1: hover (down-facing col 0, rows 0 and 1); 2-3: same (flapping)
    for i, (col, row) in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
        sheet.paste(im.crop((col * 16, row * 16, col * 16 + 16, row * 16 + 16)), (i * 16, 0))
    save(sheet, 'npc/pip.png')


def main():
    m = map_gen.build()
    with open(os.path.join(OUT, 'map.json'), 'w') as f:
        json.dump(m, f)
    # gen_art draws the remaining props in the pack's style
    GA.P['outline'] = C['ink']
    GA.outline.__defaults__ = (C['ink'], False)
    save(render_ground(m), 'ground.png')
    water_tiles()
    pack_props()
    custom_props()
    pip_sheet()
    small_portraits()
    save(GA.gull_sheet(), 'npc/gull.png')
    save(faceset('14.png'), 'portraits/captain.png')
    # the players' characters (Lắc, Tím) come from tools/import_characters.py
    GA.boss_sprites()
    GA.ui_bits()
    # the drawn art in tools/source_art replaces the placeholders above
    import import_gpt_art
    import_gpt_art.main()
    title_background()
    print('art written to', OUT)




def title_background():
    """A scenic crop of the island (lighthouse lit, evening) for the title screen."""
    m = json.load(open(os.path.join(OUT, 'map.json')))
    ground = Image.open(os.path.join(OUT, 'ground.png')).convert('RGBA')
    water = Image.open(os.path.join(OUT, 'water0.png')).convert('RGBA')
    full = Image.new('RGBA', ground.size)
    for y in range(0, ground.size[1], 64):
        for x in range(0, ground.size[0], 64):
            full.paste(water, (x, y))
    full.alpha_composite(ground)
    sprites = []
    keys = {'tree': 'tree0', 'pine': 'tree1', 'boulder': 'boulder', 'bush': 'bush'}
    for d in m['deco']:
        key = keys.get(d['type']) or (f"plant{d.get('v', 0)}" if d['type'] == 'plant' else f"rock{d.get('v', 0)}")
        im = Image.open(os.path.join(OUT, 'props', key + '.png')).convert('RGBA')
        wide = d['type'] in keys and d['type'] != 'bush'
        cx = (d['x'] + 1) * T if wide else d['x'] * T + 8
        sprites.append(((d['y'] + 1) * T, im, cx - im.size[0] // 2, (d['y'] + 1) * T - im.size[1]))
    o = {g['id']: g for g in m['objects']}
    for key, ox, oy, anchor in [('lighthouse_on', o['lighthouse']['x'] * T + 8, (o['lighthouse']['y'] + 1) * T, 'c'),
                                ('cottage_lit', o['cottage']['x'] * T, (o['cottage']['y'] + 1) * T, 'l'),
                                ('tower', o['tower']['x'] * T, (o['tower']['y'] + 1) * T, 'c'),
                                ('shed_on', o['shed']['x'] * T, (o['shed']['y'] + 1) * T, 'l')]:
        im = Image.open(os.path.join(OUT, 'props', key + '.png')).convert('RGBA')
        x = ox - im.size[0] // 2 if anchor == 'c' else ox
        sprites.append((oy, im, x, oy - im.size[1]))
    for y in range(m['h']):
        for x in range(m['w']):
            if m['grid'][y][x] == 't':
                im = Image.open(os.path.join(OUT, 'props', 'hedge0.png')).convert('RGBA')
                sprites.append(((y + 1) * T, im, x * T, y * T))
    for _, im, x, y in sorted(sprites, key=lambda s: s[0]):
        full.alpha_composite(im, (int(x), int(y)))
    crop = full.crop((12 * T, 0, 52 * T, 26 * T))
    # evening light
    arr = np.array(crop).astype(np.float32)
    arr[:, :, 0] *= 0.95
    arr[:, :, 1] *= 0.86
    arr[:, :, 2] *= 0.92
    crop = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    save(crop, 'title_bg.png')


if __name__ == '__main__':
    if '--title-only' in sys.argv:
        title_background()
    else:
        main()
