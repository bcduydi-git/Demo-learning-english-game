"""Procedural pixel art for Beacon Isle (placeholder art, original, free to use).

Run:  npm run art   (or python3 tools/gen_art.py)
Writes PNGs into client/public/assets/. Every sprite is a separate file so it
can be replaced by hand-made / AI-made art with the same size.
"""
import json
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import map_gen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'client', 'public', 'assets')
T = 16


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


P = {k: hexc(v) for k, v in dict(
    outline='2a1f2d', deep='1d4b73', deep2='245a85', wave='4b8fbf', wave2='7cc0e3', foam='eaf7ff',
    shallow='3fb0b8', sand='ecd29a', sand2='dcbc7c', sand3='c49e5c', sandL='f6e6bc', wet='c9a86a',
    grass='5d9c3f', grass2='4a8534', grass3='3a6e2b', grassL='7fbd4c', grassL2='9fd35e',
    dirt='b2885a', dirt2='96703f', dirt3='7c5a32', dirtL='caa575',
    rock='8a8c96', rock2='6b6d79', rock3='4f505c', rockL='b4b6be',
    wood='94602e', wood2='744820', wood3='553214', woodL='b98146',
    leaf='3c7f3e', leaf2='2d6533', leaf3='204a28', leafL='5ea64f', leafL2='80c463',
    palm='4b9a45', palmL='79c75a', palm2='34723a', trunk='a8794a', trunk2='83592f',
    white='f3efe4', white2='d6d0c2', red='c9473d', red2='97302b', glass='ffe7a0', glass2='f4b860',
    roof='a8473a', roof2='7f3329', roofL='c96a50', wall='e2cfa6', wall2='c4ad84', wall3='a08a63',
    skin='f2c49b', skin2='d79f76', skin3='b37b58', hair1='3b2a2a', hair1L='5a4038', hair2='8a5a33', hair2L='b07b45',
    jacket1='e07a2f', jacket1D='b1541f', jacket1L='f39b4f', jacket2='2f9c9a', jacket2D='1f7270', jacket2L='4fc1bc',
    pants='3c4a6b', pants2='2c3550', boot='4a3426', eye='2a1f2d', eyeW='ffffff', blush='e89a86',
    pipR='d83a34', pipR2='a52a26', pipY='f2c94c', pipB='3a7bd5', pipG='5cb85c', beak='f0e2c0', beak2='3a3030',
    black='0e0b14', gold='f2c14e', gold2='c8902e', metal='9aa3ad', metal2='6c7580', metalL='cfd6dd',
    purple='5b3f78', purple2='3d2a55', cloud='4a4f6a', cloud2='353a52', cloudL='6d7393', eyeglow='ffe26b',
    green='4caf50', blue='3b82f6', yellow='facc15', coat='b5352d', coat2='86241f', coatL='d65a4a', hat='1f2a44', hatL='34446a',
).items()}

rng = random.Random(42)


def save(img, name):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)


def new(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def outline(img, color=P['outline'], inner=False):
    """Add a 1px outline around the opaque area (pixel-art look)."""
    a = img.split()[3]
    grown = a.filter(ImageFilter.MaxFilter(3))
    arr = np.array(img)
    ga = np.array(grown)
    oa = np.array(a)
    mask = (ga > 0) & (oa == 0)
    # only 4-neighbour outline looks cleaner: remove pure diagonals
    al = oa > 0
    n4 = np.zeros_like(al)
    n4[1:, :] |= al[:-1, :]
    n4[:-1, :] |= al[1:, :]
    n4[:, 1:] |= al[:, :-1]
    n4[:, :-1] |= al[:, 1:]
    mask &= n4
    arr[mask] = color
    return Image.fromarray(arr)


def shadow(d, cx, cy, rx, ry, alpha=70):
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(20, 15, 30, alpha))


def value_noise(w, h, cell, seed):
    r = np.random.RandomState(seed)
    gw, gh = w // cell + 2, h // cell + 2
    grid = r.rand(gh, gw).astype(np.float32)
    im = Image.fromarray((grid * 255).astype(np.uint8), 'L').resize((gw * cell, gh * cell), Image.BICUBIC)
    return np.array(im, dtype=np.float32)[:h, :w] / 255.0


# ----------------------------------------------------------------- ground
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

    n1 = value_noise(PW, PH, 6, 1)
    n2 = value_noise(PW, PH, 3, 2)
    n3 = value_noise(PW, PH, 20, 3)
    fine = np.random.RandomState(5).rand(PH, PW)

    landf = tile_field('."h:#=W%')
    land = (landf + (n1 - 0.5) * 0.45) > 0.5
    grassf = tile_field('"h:')
    grass = ((grassf + (n1 - 0.5) * 0.55 + (n2 - 0.5) * 0.2) > 0.5) & land
    pathf = tile_field(':')
    path = ((pathf + (n2 - 0.5) * 0.5) > 0.55) & land
    hedgef = tile_field('h')
    hedge = (hedgef > 0.35) & land

    img = np.zeros((PH, PW, 4), np.uint8)

    def paint(mask, color):
        img[mask] = color

    # sand with speckles
    paint(land, P['sand'])
    paint(land & (n3 > 0.68), hexc('e4c98f'))
    paint(land & (n3 < 0.22), hexc('f0dba8'))
    paint(land & (fine > 0.992), P['sand3'])
    paint(land & (fine < 0.008), P['sandL'])
    # wet sand near water
    lm = Image.fromarray((land * 255).astype(np.uint8), 'L')
    blur_land = np.array(lm.filter(ImageFilter.GaussianBlur(5)), np.float32) / 255
    paint(land & (blur_land < 0.66) & ~grass, P['wet'])

    # grass with 3 tones
    paint(grass, P['grass'])
    paint(grass & (n3 > 0.66), P['grass2'])
    paint(grass & (n3 < 0.24), P['grassL'])
    paint(grass & (fine > 0.975), P['grass2'])
    paint(grass & (fine < 0.015), P['grassL2'])
    # grass edge (darker rim where grass meets sand)
    gm = Image.fromarray((grass * 255).astype(np.uint8), 'L')
    g_in = np.array(gm.filter(ImageFilter.MinFilter(3))) > 0
    paint(grass & ~g_in, P['grass3'])
    paint(hedge, P['grass3'])

    # paths
    paint(path, P['dirt'])
    paint(path & (n2 > 0.65), P['dirtL'])
    paint(path & (fine > 0.975), P['dirt2'])
    pm = Image.fromarray((path * 255).astype(np.uint8), 'L')
    p_in = np.array(pm.filter(ImageFilter.MinFilter(3))) > 0
    paint(path & ~p_in, P['dirt2'])

    # water: shallow tint + foam (alpha so the animated water shows through)
    water = ~land
    shallow_a = np.clip((blur_land - 0.02) * 2.6, 0, 1)
    sh = water & (shallow_a > 0.02)
    col = np.array(P['shallow'][:3], np.float32)
    img[sh, 0:3] = col
    img[sh, 3] = (shallow_a[sh] * 200).astype(np.uint8)
    foam_band = water & (blur_land > 0.36) & (blur_land < 0.5 + (n2 - 0.5) * 0.15)
    img[foam_band] = P['foam']
    foam2 = water & (blur_land > 0.2) & (blur_land < 0.24) & (n1 > 0.55)
    img[foam2] = (234, 247, 255, 150)

    # tile-based layers (cliffs, interior, dock, void)
    out = Image.fromarray(img, 'RGBA')
    d = ImageDraw.Draw(out)
    for y in range(H):
        for x in range(W):
            c = ground[y][x]
            X, Y = x * T, y * T
            below = ground[y + 1][x] if y + 1 < H else '~'
            above = ground[y - 1][x] if y > 0 else '~'
            if c == '#':
                if below != '#':  # cliff face
                    d.rectangle([X, Y, X + 15, Y + 15], fill=P['rock2'])
                    for i in range(0, 16, 4):
                        off = (x * 7 + i) % 5
                        d.line([X + i + off % 3, Y + 2, X + i + off % 3, Y + 13], fill=P['rock3'])
                    d.line([X, Y, X + 15, Y], fill=P['rockL'])
                    d.rectangle([X, Y + 14, X + 15, Y + 15], fill=P['rock3'])
                    # shadow on the ground below
                    d.rectangle([X, Y + 16, X + 15, Y + 18], fill=(40, 30, 40, 70))
                else:  # cliff top: grass lip over rock
                    d.rectangle([X, Y, X + 15, Y + 15], fill=P['rock'])
                    for k in range(5):
                        rx, ry = X + rng.randint(1, 13), Y + rng.randint(3, 13)
                        d.rectangle([rx, ry, rx + 1, ry], fill=P['rockL'])
                        d.point((rx, ry + 1), fill=P['rock2'])
                    if above not in '#':
                        d.rectangle([X, Y, X + 15, Y + 4], fill=P['grass2'])
                        for i in range(0, 16, 3):
                            d.point((X + i, Y + 5), fill=P['grass3'])
                            d.point((X + i + 1, Y + 5 + (i % 2)), fill=P['grass3'])
            elif c == '=' and not (60 <= x):  # dock planks over water
                d.rectangle([X, Y + 1, X + 15, Y + 14], fill=P['wood'])
                for i in range(0, 16, 4):
                    d.line([X + i, Y + 1, X + i, Y + 14], fill=P['wood2'])
                d.line([X, Y + 14, X + 15, Y + 14], fill=P['wood3'])
                d.line([X, Y + 15, X + 15, Y + 15], fill=(20, 40, 70, 120))
                if x % 2 == 0:
                    d.rectangle([X + 1, Y + 13, X + 3, Y + 17], fill=P['wood3'])
            elif c == '=':  # interior floor
                d.rectangle([X, Y, X + 15, Y + 15], fill=P['woodL'])
                d.line([X, Y + 7, X + 15, Y + 7], fill=P['wood'])
                d.line([X, Y + 15, X + 15, Y + 15], fill=P['wood'])
                sx = (x * 5 + y * 3) % 16
                d.line([X + sx, Y, X + sx, Y + 6], fill=P['wood'])
                d.line([X + (sx + 8) % 16, Y + 8, X + (sx + 8) % 16, Y + 14], fill=P['wood'])
            elif c == 'W':
                if below == '=' or below == '%' and above == 'W':
                    # wall face
                    d.rectangle([X, Y, X + 15, Y + 15], fill=P['wall'])
                    d.rectangle([X, Y + 9, X + 15, Y + 15], fill=P['wood'])
                    d.line([X, Y + 9, X + 15, Y + 9], fill=P['woodL'])
                    d.line([X, Y + 15, X + 15, Y + 15], fill=P['wood3'])
                    for i in range(2, 16, 5):
                        d.line([X + i, Y + 1, X + i, Y + 7], fill=P['wall2'])
                else:
                    d.rectangle([X, Y, X + 15, Y + 15], fill=P['wood3'])
                    d.rectangle([X, Y, X + 15, Y + 1], fill=P['wood2'])
            elif c == '%':
                d.rectangle([X, Y, X + 15, Y + 15], fill=P['black'])

    # small decorations on grass / sand (flowers, shells, starfish, pebbles)
    grid = m['grid']
    for y in range(H):
        for x in range(W):
            c = ground[y][x]
            if grid[y][x] in 'TotB':
                continue
            X, Y = x * T + rng.randint(2, 12), y * T + rng.randint(2, 12)
            r = rng.random()
            if c == '"':
                if r < 0.08:  # tuft
                    d.point((X, Y), fill=P['grass3'])
                    d.point((X + 2, Y), fill=P['grass3'])
                    d.point((X + 1, Y - 1), fill=P['grassL2'])
                    d.point((X - 1, Y - 1), fill=P['grassL'])
                    d.point((X + 3, Y - 1), fill=P['grassL'])
                elif r < 0.11:  # flower
                    col = rng.choice([P['white'], P['yellow'], (230, 110, 140, 255), (170, 140, 230, 255)])
                    d.point((X, Y - 1), fill=col)
                    d.point((X - 1, Y), fill=col)
                    d.point((X + 1, Y), fill=col)
                    d.point((X, Y + 1), fill=col)
                    d.point((X, Y), fill=P['yellow'])
            elif c == '.' and y > 40:
                if r < 0.025:  # shell
                    d.point((X, Y), fill=P['white'])
                    d.point((X + 1, Y), fill=(240, 190, 180, 255))
                    d.point((X, Y + 1), fill=P['white2'])
                elif r < 0.035:  # starfish
                    col = (230, 120, 80, 255)
                    for dx, dy in ((0, -2), (-2, 0), (2, 0), (-1, 2), (1, 2), (0, 0), (0, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)):
                        d.point((X + dx, Y + dy), fill=col)
            elif c == ':' and r < 0.05:
                d.point((X, Y), fill=P['dirt3'])
                d.point((X + 1, Y), fill=P['dirtL'])
    return out


def render_water():
    # 64x64 tileable deep-water texture, two frames for shimmering
    frames = []
    for f in range(2):
        im = new(64, 64)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 63, 63], fill=P['deep'])
        r = random.Random(100 + f)
        n = value_noise(64 + 32, 64 + 32, 16, 9)
        arr = np.array(im)
        dark = n[:64, :64] > 0.6
        arr[dark] = P['deep2']
        im = Image.fromarray(arr)
        d = ImageDraw.Draw(im)
        for _ in range(7):
            x, y = r.randint(0, 63), r.randint(0, 63)
            ln = r.randint(3, 6)
            for i in range(ln):
                yy = y + (1 if i in (0, ln - 1) else 0)
                d.point(((x + i) % 64, yy % 64), fill=P['wave'])
            if r.random() < 0.4:
                d.point(((x + 1) % 64, (y - 1) % 64), fill=P['wave2'])
        frames.append(im)
    sheet = new(128, 64)
    sheet.paste(frames[0], (0, 0))
    sheet.paste(frames[1], (64, 0))
    save(frames[0], 'water0.png')
    save(frames[1], 'water1.png')


# ----------------------------------------------------------------- props
def tree(v):
    im = new(32, 40)
    d = ImageDraw.Draw(im)
    shadow(d, 16, 36, 11, 3)
    d.rectangle([13, 24, 18, 36], fill=P['wood2'])
    d.rectangle([13, 24, 14, 36], fill=P['wood'])
    d.point((17, 30), fill=P['wood3'])
    leaf = [P['leaf'], P['leaf2'], P['leafL'], P['leafL2']] if v == 0 else [(70, 130, 60, 255), (50, 100, 50, 255), (110, 165, 70, 255), (145, 195, 90, 255)]
    d.ellipse([3, 4, 29, 28], fill=leaf[1])
    d.ellipse([4, 2, 26, 24], fill=leaf[0])
    d.ellipse([7, 3, 20, 15], fill=leaf[2])
    d.ellipse([9, 4, 15, 9], fill=leaf[3])
    d.ellipse([18, 12, 27, 22], fill=leaf[0])
    d.ellipse([20, 13, 24, 16], fill=leaf[2])
    for _ in range(8):
        x, y = rng.randint(6, 25), rng.randint(8, 25)
        d.point((x, y), fill=leaf[1])
    if v == 1:
        for (x, y) in ((10, 12), (20, 18), (14, 20)):
            d.point((x, y), fill=P['red'])
    return outline(im)


def palm(v):
    im = new(32, 48)
    d = ImageDraw.Draw(im)
    shadow(d, 16, 44, 9, 3)
    # curved trunk
    bend = 1 if v == 0 else -1
    for i in range(30):
        y = 44 - i
        x = 16 + int(bend * (i / 30) ** 2 * 6)
        d.rectangle([x - 2, y, x + 1, y], fill=P['trunk'] if (i // 3) % 2 == 0 else P['trunk2'])
        d.point((x - 2, y), fill=P['trunk2'])
    tx, ty = 16 + bend * 6, 14
    # fronds
    for ang in (-160, -120, -60, -20, 200, 90):
        a = math.radians(ang)
        for j in range(13):
            x = tx + math.cos(a) * j
            y = ty + math.sin(a) * j * 0.7 + (j * j) * 0.06
            d.ellipse([x - 2, y - 1, x + 2, y + 2], fill=P['palm'])
            if j % 3 == 0:
                d.point((x, y - 1), fill=P['palmL'])
    d.ellipse([tx - 3, ty - 2, tx + 3, ty + 3], fill=P['palm2'])
    d.ellipse([tx - 2, ty + 1, tx, ty + 3], fill=(120, 80, 40, 255))
    d.ellipse([tx + 1, ty + 1, tx + 3, ty + 3], fill=(120, 80, 40, 255))
    return outline(im)


def rock(v):
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    shadow(d, 8, 13, 7, 2)
    d.ellipse([1, 4, 15, 14], fill=P['rock2'])
    d.ellipse([2, 3, 13, 12], fill=P['rock'])
    d.ellipse([4, 4, 8, 7], fill=P['rockL'])
    if v == 1:
        d.ellipse([2, 3, 9, 7], fill=P['grassL'])
        d.point((10, 4), fill=P['grass'])
    return outline(im)


def hedge(v):
    im = new(16, 24)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 10, 15, 23], fill=P['leaf3'])
    d.ellipse([-2, 2, 17, 20], fill=P['leaf2'])
    d.ellipse([0, 1, 13, 13], fill=P['leaf'])
    d.ellipse([3, 2, 9, 7], fill=P['leafL'])
    r = random.Random(v * 13 + 1)
    for _ in range(6):
        x, y = r.randint(1, 14), r.randint(5, 20)
        d.point((x, y), fill=P['leaf3'] if y > 10 else P['leafL'])
    if v == 1:
        d.point((5, 12), fill=P['white'])
        d.point((11, 8), fill=(230, 110, 140, 255))
    return im  # no outline: hedges merge into walls


def thorns():
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    d.ellipse([1, 5, 15, 15], fill=(110, 40, 60, 140))
    for (x, y) in ((3, 12), (6, 7), (10, 9), (12, 13), (8, 13), (5, 10)):
        d.line([x, y, x - 1, y - 3], fill=(160, 60, 70, 255))
        d.line([x, y, x + 2, y - 2], fill=(200, 90, 90, 255))
    return outline(im, (60, 20, 30, 255))


def crate(opened=False):
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    shadow(d, 8, 14, 7, 2)
    d.rectangle([1, 4, 14, 14], fill=P['wood'])
    d.rectangle([1, 4, 14, 5], fill=P['woodL'])
    d.line([1, 9, 14, 9], fill=P['wood2'])
    d.line([2, 5, 13, 13], fill=P['wood2'])
    d.rectangle([1, 4, 2, 14], fill=P['wood2'])
    d.rectangle([13, 4, 14, 14], fill=P['wood2'])
    if opened:
        d.rectangle([2, 1, 13, 4], fill=P['wood3'])
        d.rectangle([2, 5, 13, 7], fill=P['black'])
    return outline(im)


def wreck():
    im = new(64, 40)
    d = ImageDraw.Draw(im)
    shadow(d, 32, 34, 28, 5)
    # tilted broken hull
    d.polygon([(4, 22), (58, 14), (62, 24), (52, 34), (10, 36)], fill=P['wood2'])
    d.polygon([(4, 22), (58, 14), (59, 18), (6, 26)], fill=P['woodL'])
    for i in range(6):
        x = 10 + i * 8
        d.line([x, 24 - i, x + 2, 35 - i // 2], fill=P['wood3'])
    d.polygon([(40, 22), (50, 20), (52, 30), (42, 32)], fill=P['black'])  # hole
    d.line([42, 24, 48, 28], fill=P['wood3'])
    # broken mast
    d.line([26, 20, 20, 2], fill=P['wood3'], width=3)
    d.line([25, 20, 19, 2], fill=P['wood'], width=1)
    # torn sail
    d.polygon([(20, 4), (34, 8), (28, 16), (22, 14)], fill=P['white2'])
    d.line([20, 4, 34, 8], fill=P['white'])
    d.text((14, 27), '', fill=P['white'])
    # name plate
    d.rectangle([14, 26, 28, 29], fill=P['white2'])
    d.line([16, 27, 26, 27], fill=P['wood3'])
    return outline(im)


def bottle():
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    shadow(d, 8, 13, 5, 2)
    d.rectangle([4, 8, 12, 12], fill=(90, 170, 130, 230))
    d.rectangle([12, 9, 14, 11], fill=(90, 170, 130, 230))
    d.point((15, 10), fill=P['wood'])
    d.rectangle([5, 9, 10, 11], fill=P['white'])
    d.line([5, 8, 11, 8], fill=(170, 230, 200, 255))
    return outline(im)


def log_sprite():
    im = new(48, 24)
    d = ImageDraw.Draw(im)
    shadow(d, 24, 19, 22, 4)
    d.rounded_rectangle([2, 8, 45, 19], 5, fill=P['wood2'])
    d.rounded_rectangle([2, 8, 45, 12], 4, fill=P['wood'])
    for x in range(6, 42, 7):
        d.line([x, 10, x + 3, 17], fill=P['wood3'])
    d.ellipse([38, 7, 47, 19], fill=P['woodL'])
    d.ellipse([40, 10, 45, 16], fill=P['wood'])
    d.point((42, 13), fill=P['wood3'])
    # branch + leaves
    d.line([14, 9, 10, 2], fill=P['wood2'], width=2)
    d.ellipse([5, 0, 13, 6], fill=P['leaf'])
    d.ellipse([22, 3, 30, 9], fill=P['leaf2'])
    return outline(im)


def house(lit=False):
    # footprint 5x4 tiles (80x64) + roof overhang above
    im = new(80, 88)
    d = ImageDraw.Draw(im)
    shadow(d, 40, 84, 38, 5)
    # walls
    d.rectangle([4, 40, 75, 85], fill=P['wall'])
    for y in range(44, 85, 6):
        d.line([4, y, 75, y], fill=P['wall2'])
    d.rectangle([4, 80, 75, 85], fill=P['wall3'])
    # roof
    d.polygon([(0, 44), (40, 6), (80, 44)], fill=P['roof'])
    d.polygon([(0, 44), (40, 6), (40, 12), (8, 44)], fill=P['roofL'])
    for i in range(6):
        y = 14 + i * 6
        half = (y - 6) * 40 / 38
        d.line([40 - half, y, 40 + half, y], fill=P['roof2'])
    d.rectangle([0, 42, 79, 46], fill=P['roof2'])
    # chimney
    d.rectangle([56, 10, 63, 26], fill=P['rock2'])
    d.rectangle([55, 8, 64, 11], fill=P['rock'])
    # door (centre, tile x=2 of 5)
    d.rectangle([33, 60, 46, 85], fill=P['wood2'])
    d.rectangle([34, 61, 45, 85], fill=P['wood'])
    d.line([39, 61, 39, 85], fill=P['wood2'])
    d.point((43, 73), fill=P['gold'])
    # windows
    wcol = P['glass'] if lit else (70, 90, 120, 255)
    for wx in (12, 54):
        d.rectangle([wx, 56, wx + 14, 70], fill=P['wood3'])
        d.rectangle([wx + 2, 58, wx + 12, 68], fill=wcol)
        d.line([wx + 7, 58, wx + 7, 68], fill=P['wood3'])
        d.line([wx + 2, 63, wx + 12, 63], fill=P['wood3'])
        if lit:
            d.point((wx + 4, 60), fill=P['white'])
        d.rectangle([wx - 1, 70, wx + 15, 72], fill=P['wood2'])
    # sign "KEEPER"
    d.rectangle([30, 50, 49, 56], fill=P['wood'])
    d.line([32, 53, 47, 53], fill=P['woodL'])
    return outline(im)


def shed(on=False):
    im = new(48, 60)
    d = ImageDraw.Draw(im)
    shadow(d, 24, 56, 23, 4)
    d.rectangle([2, 22, 45, 57], fill=P['wood2'])
    for x in range(2, 46, 5):
        d.line([x, 22, x, 57], fill=P['wood3'])
    d.polygon([(0, 24), (24, 6), (48, 24)], fill=P['metal2'])
    d.polygon([(0, 24), (24, 6), (24, 10), (6, 24)], fill=P['metal'])
    for i in range(0, 48, 4):
        d.line([i, 24, 24, 6], fill=P['metal2'])
    d.rectangle([0, 22, 47, 25], fill=P['metal2'])
    # open front with generator
    d.rectangle([10, 32, 37, 57], fill=P['black'])
    d.rectangle([13, 40, 34, 56], fill=P['metal'])
    d.rectangle([13, 40, 34, 42], fill=P['metalL'])
    d.ellipse([16, 44, 24, 52], fill=P['metal2'])
    d.ellipse([18, 46, 22, 50], fill=P['metalL'])
    d.rectangle([27, 45, 32, 49], fill=P['green'] if on else P['red2'])
    d.line([30, 40, 30, 34], fill=P['metal2'], width=2)
    # warning sign
    d.polygon([(38, 28), (43, 37), (33, 37)], fill=P['yellow'])
    d.line([38, 31, 38, 34], fill=P['black'])
    return outline(im)


def lighthouse(on=False):
    # footprint 3x5 tiles (48x80) + tower
    im = new(64, 144)
    d = ImageDraw.Draw(im)
    cx = 32
    shadow(d, cx, 139, 26, 5)
    # base building
    d.rectangle([10, 104, 54, 139], fill=P['white2'])
    d.rectangle([10, 104, 54, 107], fill=P['white'])
    d.rectangle([10, 136, 54, 139], fill=P['rock2'])
    # tower (tapered) with stripes
    top, bot = 26, 112
    for y in range(top, bot):
        t = (y - top) / (bot - top)
        half = int(9 + t * 9)
        stripe = ((y - top) // 14) % 2 == 1
        base = P['red'] if stripe else P['white']
        dark = P['red2'] if stripe else P['white2']
        d.line([cx - half, y, cx + half, y], fill=base)
        d.line([cx + half - 4, y, cx + half, y], fill=dark)
        d.point((cx - half, y), fill=dark)
    # windows on the tower
    for wy in (52, 80):
        d.rectangle([cx - 2, wy, cx + 2, wy + 6], fill=P['wood3'])
    # gallery
    d.rectangle([cx - 15, 22, cx + 15, 26], fill=P['rock3'])
    for x in range(cx - 14, cx + 15, 3):
        d.line([x, 17, x, 22], fill=P['rock3'])
    d.line([cx - 15, 17, cx + 15, 17], fill=P['rock3'])
    # lamp room
    glass = P['glass'] if on else (80, 95, 120, 255)
    d.rectangle([cx - 9, 8, cx + 9, 21], fill=glass)
    for x in (cx - 4, cx + 3):
        d.line([x, 8, x, 21], fill=P['rock3'])
    if on:
        d.ellipse([cx - 4, 11, cx + 4, 18], fill=P['white'])
    d.polygon([(cx - 11, 8), (cx, 0), (cx + 11, 8)], fill=P['red2'])
    d.point((cx, 0), fill=P['gold'])
    # door (tile x=1 of 3 -> centre)
    d.rectangle([cx - 6, 118, cx + 6, 139], fill=P['rock3'])
    d.rectangle([cx - 5, 119, cx + 5, 139], fill=P['metal2'])
    d.line([cx, 119, cx, 139], fill=P['rock3'])
    d.rectangle([cx + 7, 124, cx + 10, 129], fill=P['rock3'])  # lock plate
    return outline(im)


def door_glow():
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, 13, 13], fill=(120, 255, 200, 90))
    d.rectangle([5, 5, 10, 10], fill=(180, 255, 220, 200))
    return im


def tower():
    im = new(40, 72)
    d = ImageDraw.Draw(im)
    shadow(d, 20, 68, 16, 3)
    for x in (6, 31):
        d.rectangle([x, 26, x + 3, 68], fill=P['wood2'])
        d.line([x, 26, x, 68], fill=P['wood'])
    d.line([8, 34, 32, 60], fill=P['wood3'], width=2)
    d.line([32, 34, 8, 60], fill=P['wood3'], width=2)
    # ladder
    d.line([16, 30, 16, 68], fill=P['wood'])
    d.line([23, 30, 23, 68], fill=P['wood'])
    for y in range(32, 68, 5):
        d.line([16, y, 23, y], fill=P['woodL'])
    # platform
    d.rectangle([2, 18, 37, 27], fill=P['wood'])
    d.rectangle([2, 18, 37, 20], fill=P['woodL'])
    d.line([2, 27, 37, 27], fill=P['wood3'])
    # railing + roof
    for x in range(3, 38, 6):
        d.line([x, 8, x, 18], fill=P['wood2'])
    d.line([2, 10, 37, 10], fill=P['wood2'])
    d.polygon([(0, 8), (20, 0), (40, 8)], fill=P['roof'])
    d.line([0, 8, 40, 8], fill=P['roof2'])
    return outline(im)


def sign():
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    shadow(d, 8, 14, 5, 2)
    d.rectangle([7, 8, 8, 14], fill=P['wood2'])
    d.rectangle([1, 2, 14, 9], fill=P['wood'])
    d.rectangle([1, 2, 14, 3], fill=P['woodL'])
    d.line([3, 5, 12, 5], fill=P['wood3'])
    d.line([3, 7, 10, 7], fill=P['wood3'])
    return outline(im)


def chest(opened=False):
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    shadow(d, 8, 14, 7, 2)
    d.rectangle([1, 7, 14, 14], fill=P['wood'])
    d.rectangle([1, 12, 14, 14], fill=P['wood2'])
    if opened:
        d.rectangle([1, 2, 14, 5], fill=P['wood2'])
        d.rectangle([2, 6, 13, 8], fill=P['black'])
    else:
        d.rounded_rectangle([1, 3, 14, 8], 2, fill=P['woodL'])
        d.rectangle([7, 6, 8, 9], fill=P['gold'])
    d.line([1, 9, 14, 9], fill=P['gold2'])
    return outline(im)


def lens():
    im = new(16, 16)
    d = ImageDraw.Draw(im)
    d.polygon([(8, 1), (14, 7), (8, 15), (2, 7)], fill=(140, 220, 255, 255))
    d.polygon([(8, 1), (14, 7), (8, 7)], fill=(210, 245, 255, 255))
    d.polygon([(2, 7), (8, 15), (8, 7)], fill=(90, 170, 230, 255))
    d.point((6, 5), fill=P['white'])
    return outline(im, (30, 60, 110, 255))


def desk():
    im = new(32, 28)
    d = ImageDraw.Draw(im)
    shadow(d, 16, 25, 14, 3)
    d.rectangle([1, 8, 30, 14], fill=P['wood'])
    d.rectangle([1, 8, 30, 9], fill=P['woodL'])
    d.rectangle([2, 14, 4, 26], fill=P['wood2'])
    d.rectangle([27, 14, 29, 26], fill=P['wood2'])
    d.rectangle([3, 14, 28, 18], fill=P['wood2'])
    # open journal
    d.polygon([(8, 3), (16, 5), (16, 10), (8, 8)], fill=P['white'])
    d.polygon([(16, 5), (24, 3), (24, 8), (16, 10)], fill=P['white2'])
    for i in range(3):
        d.line([10, 5 + i, 14, 6 + i], fill=P['rock2'])
    # candle
    d.rectangle([26, 2, 27, 8], fill=P['white'])
    d.point((26, 1), fill=P['glass2'])
    return outline(im)


def station(on=False):
    im = new(32, 28)
    d = ImageDraw.Draw(im)
    shadow(d, 16, 25, 14, 3)
    d.rectangle([1, 12, 30, 26], fill=P['wood2'])
    d.rectangle([1, 12, 30, 13], fill=P['wood'])
    # radio box
    d.rectangle([4, 2, 27, 12], fill=P['metal2'])
    d.rectangle([4, 2, 27, 3], fill=P['metal'])
    d.rectangle([6, 5, 15, 10], fill=(40, 60, 50, 255))
    if on:
        d.line([7, 8, 9, 6], fill=P['green'])
        d.line([9, 6, 11, 9], fill=P['green'])
        d.line([11, 9, 14, 6], fill=P['green'])
    d.ellipse([18, 5, 22, 9], fill=P['metalL'])
    d.ellipse([23, 6, 26, 9], fill=P['metalL'])
    d.line([24, 2, 28, -4], fill=P['metal'])
    # headphones
    d.arc([2, 15, 12, 25], 180, 360, fill=P['black'])
    d.rectangle([2, 20, 4, 23], fill=P['black'])
    d.rectangle([10, 20, 12, 23], fill=P['black'])
    return outline(im)


def bed():
    im = new(32, 32)
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, 29, 29], fill=P['wood2'])
    d.rectangle([4, 4, 27, 10], fill=P['white'])
    d.rectangle([4, 11, 27, 28], fill=(80, 110, 170, 255))
    for y in range(13, 28, 4):
        d.line([4, y, 27, y], fill=(100, 135, 195, 255))
    return outline(im)


def shelf():
    im = new(32, 32)
    d = ImageDraw.Draw(im)
    d.rectangle([2, 0, 29, 30], fill=P['wood2'])
    for y in (9, 19):
        d.rectangle([3, y, 28, y + 1], fill=P['wood'])
    cols = [P['red'], P['blue'], P['green'], P['yellow'], P['purple'], P['white2']]
    for row, y in enumerate((2, 12, 22)):
        x = 4
        while x < 27:
            w = rng.randint(2, 3)
            d.rectangle([x, y + rng.randint(0, 1), x + w - 1, y + 6], fill=rng.choice(cols))
            x += w + 1
    return outline(im)


def rug():
    im = new(48, 32)
    d = ImageDraw.Draw(im)
    d.ellipse([0, 2, 47, 29], fill=P['red2'])
    d.ellipse([4, 5, 43, 26], fill=P['red'])
    d.ellipse([12, 10, 35, 21], fill=P['gold2'])
    return im


def pip_sheet():
    # 4 frames 16x16: idle0, idle1 (blink/bob), fly0, fly1
    sheet = new(64, 16)
    for f in range(4):
        im = new(16, 16)
        d = ImageDraw.Draw(im)
        fly = f >= 2
        bob = 1 if f == 1 else 0
        if not fly:
            shadow(d, 8, 15, 4, 1)
        y0 = 2 + bob - (2 if fly else 0)
        # tail
        d.polygon([(6, y0 + 9), (3, y0 + 14), (7, y0 + 12)], fill=P['pipB'])
        # body
        d.ellipse([4, y0 + 4, 11, y0 + 12], fill=P['pipR'])
        d.ellipse([5, y0 + 8, 10, y0 + 12], fill=P['pipR2'])
        # head
        d.ellipse([6, y0, 12, y0 + 6], fill=P['pipR'])
        d.point((10, y0 + 2), fill=P['white'])
        d.point((10, y0 + 2) if f != 1 else (10, y0 + 3), fill=P['eye'])
        d.polygon([(12, y0 + 2), (14, y0 + 3), (12, y0 + 5)], fill=P['beak'])
        d.point((12, y0 + 4), fill=P['beak2'])
        # wing
        if fly:
            if f == 2:
                d.polygon([(6, y0 + 6), (1, y0 + 1), (9, y0 + 7)], fill=P['pipY'])
                d.polygon([(4, y0 + 4), (0, y0 + 2), (6, y0 + 6)], fill=P['pipB'])
            else:
                d.polygon([(6, y0 + 7), (1, y0 + 12), (9, y0 + 8)], fill=P['pipY'])
                d.polygon([(4, y0 + 9), (0, y0 + 12), (6, y0 + 8)], fill=P['pipB'])
        else:
            d.ellipse([5, y0 + 6, 9, y0 + 10], fill=P['pipY'])
            d.point((6, y0 + 10), fill=P['pipB'])
            d.line([7, y0 + 12, 7, y0 + 13], fill=P['beak2'])
            d.line([9, y0 + 12, 9, y0 + 13], fill=P['beak2'])
        sheet.paste(outline(im), (f * 16, 0))
    return sheet


def gull_sheet():
    sheet = new(32, 16)
    for f in range(2):
        im = new(16, 16)
        d = ImageDraw.Draw(im)
        if f == 0:
            d.line([2, 6, 7, 9], fill=P['white'], width=1)
            d.line([8, 9, 13, 6], fill=P['white'], width=1)
            d.line([3, 6, 7, 8], fill=P['white2'])
        else:
            d.line([2, 10, 7, 8], fill=P['white'], width=1)
            d.line([8, 8, 13, 10], fill=P['white'], width=1)
        d.rectangle([7, 8, 8, 9], fill=P['white'])
        sheet.paste(im, (f * 16, 0))
    return sheet


# ----------------------------------------------------------------- characters
def character_sheet(kind):
    """32x32 frames, rows: down, left, right, up; cols: walk 0..3 (0 & 2 = stand)."""
    if kind == 'p1':
        jac, jacD, jacL = P['jacket1'], P['jacket1D'], P['jacket1L']
        hair, hairL = P['hair1'], P['hair1L']
    else:
        jac, jacD, jacL = P['jacket2'], P['jacket2D'], P['jacket2L']
        hair, hairL = P['hair2'], P['hair2L']
    sheet = new(128, 128)
    for row, facing in enumerate(['down', 'left', 'right', 'up']):
        for col in range(4):
            im = new(32, 32)
            d = ImageDraw.Draw(im)
            step = [0, 1, 0, -1][col]
            bob = 0 if col in (0, 2) else -1
            shadow(d, 16, 29, 7, 2, 80)
            cx = 16
            top = 6 + bob
            # legs
            if facing in ('down', 'up'):
                ly = 22 + bob
                d.rectangle([cx - 4, ly, cx - 1, 28 - (1 if step == 1 else 0)], fill=P['pants'])
                d.rectangle([cx + 1, ly, cx + 4, 28 - (1 if step == -1 else 0)], fill=P['pants'])
                d.rectangle([cx - 4, 27 - (1 if step == 1 else 0), cx - 1, 28 - (1 if step == 1 else 0)], fill=P['boot'])
                d.rectangle([cx + 1, 27 - (1 if step == -1 else 0), cx + 4, 28 - (1 if step == -1 else 0)], fill=P['boot'])
            else:
                ly = 22 + bob
                fx = 1 if facing == 'right' else -1
                d.rectangle([cx - 2 + step * 2 * fx, ly, cx + 1 + step * 2 * fx, 28], fill=P['pants'])
                d.rectangle([cx - 2 - step * 2 * fx, ly, cx + 1 - step * 2 * fx, 28], fill=P['pants2'])
                d.rectangle([cx - 2 + step * 2 * fx, 27, cx + 2 + step * 2 * fx, 28], fill=P['boot'])
            # body / jacket
            d.rounded_rectangle([cx - 6, top + 10, cx + 5, top + 17], 2, fill=jac)
            d.rectangle([cx - 6, top + 15, cx + 5, top + 17], fill=jacD)
            if facing == 'down':
                d.line([cx, top + 10, cx, top + 17], fill=jacD)
                d.rectangle([cx - 2, top + 10, cx + 1, top + 11], fill=P['white'])
            # arms
            sw = step if facing in ('down', 'up') else 0
            if facing in ('down', 'up'):
                d.rectangle([cx - 8, top + 10 + sw, cx - 7, top + 16 + sw], fill=jacL)
                d.rectangle([cx + 6, top + 10 - sw, cx + 7, top + 16 - sw], fill=jac)
                d.point((cx - 8, top + 17 + sw), fill=P['skin'])
                d.point((cx + 7, top + 17 - sw), fill=P['skin'])
            else:
                fx = 1 if facing == 'right' else -1
                ax = cx - 1 - step * 2 * fx
                d.rectangle([ax, top + 11, ax + 2, top + 16], fill=jacL)
                d.point((ax + 1, top + 17), fill=P['skin'])
            # head
            d.rounded_rectangle([cx - 6, top - 2, cx + 5, top + 9], 4, fill=P['skin'])
            if facing == 'down':
                d.rectangle([cx - 4, top + 3, cx - 3, top + 5], fill=P['eye'])
                d.rectangle([cx + 2, top + 3, cx + 3, top + 5], fill=P['eye'])
                d.point((cx - 4, top + 3), fill=P['eyeW'])
                d.point((cx + 2, top + 3), fill=P['eyeW'])
                d.point((cx - 5, top + 6), fill=P['blush'])
                d.point((cx + 4, top + 6), fill=P['blush'])
                d.line([cx - 1, top + 7, cx, top + 7], fill=P['skin3'])
            elif facing in ('left', 'right'):
                fx = 1 if facing == 'right' else -1
                ex = cx + 3 * fx - (1 if fx < 0 else 0)
                d.rectangle([ex, top + 3, ex + 1, top + 5], fill=P['eye'])
                d.point((cx + 5 * fx - (0 if fx > 0 else 1), top + 6), fill=P['skin2'])
            # hair
            if kind == 'p1':
                d.rounded_rectangle([cx - 7, top - 4, cx + 6, top + 2], 3, fill=hair)
                if facing == 'down':
                    d.rectangle([cx - 7, top - 1, cx - 5, top + 6], fill=hair)
                    d.rectangle([cx + 4, top - 1, cx + 6, top + 6], fill=hair)
                    d.polygon([(cx - 3, top + 1), (cx + 1, top + 1), (cx - 1, top + 3)], fill=hair)
                elif facing == 'up':
                    d.rectangle([cx - 7, top - 3, cx + 6, top + 8], fill=hair)
                    d.rectangle([cx - 2, top + 8, cx + 1, top + 11], fill=hair)  # ponytail
                else:
                    fx = 1 if facing == 'right' else -1
                    bx = cx - 6 if fx > 0 else cx + 2
                    d.rectangle([bx, top - 2, bx + 4, top + 7], fill=hair)
                    d.rectangle([bx + (-2 if fx > 0 else 4), top + 3, bx + (0 if fx > 0 else 6), top + 9], fill=hair)
                d.line([cx - 5, top - 3, cx + 2, top - 3], fill=hairL)
            else:
                d.rounded_rectangle([cx - 7, top - 4, cx + 6, top + 1], 3, fill=hair)
                if facing == 'down':
                    d.polygon([(cx - 6, top), (cx - 2, top), (cx - 5, top + 3)], fill=hair)
                    d.polygon([(cx + 1, top), (cx + 5, top), (cx + 4, top + 3)], fill=hair)
                elif facing == 'up':
                    d.rectangle([cx - 7, top - 3, cx + 6, top + 6], fill=hair)
                else:
                    fx = 1 if facing == 'right' else -1
                    bx = cx - 6 if fx > 0 else cx + 1
                    d.rectangle([bx, top - 2, bx + 5, top + 5], fill=hair)
                d.line([cx - 4, top - 3, cx + 3, top - 3], fill=hairL)
                # headphones
                if facing in ('down', 'up'):
                    d.rectangle([cx - 8, top + 2, cx - 6, top + 6], fill=P['black'])
                    d.rectangle([cx + 5, top + 2, cx + 7, top + 6], fill=P['black'])
                else:
                    fx = 1 if facing == 'right' else -1
                    hx = cx - 2 if fx > 0 else cx - 1
                    d.rectangle([hx, top + 2, hx + 2, top + 6], fill=P['black'])
                d.arc([cx - 7, top - 6, cx + 6, top + 4], 180, 360, fill=P['black'])
            # role accessory
            if kind == 'p1' and facing != 'up':
                lx = cx + (7 if facing != 'left' else -9)
                d.rectangle([lx, top + 14, lx + 2, top + 17], fill=P['glass'])
                d.point((lx + 1, top + 13), fill=P['metal2'])
            if kind == 'p2' and facing == 'up':
                d.rectangle([cx - 3, top + 10, cx + 2, top + 16], fill=P['metal2'])
                d.line([cx + 2, top + 10, cx + 4, top + 5], fill=P['metal'])
            sheet.paste(outline(im), (col * 32, row * 32))
    return sheet


# ----------------------------------------------------------------- portraits
def portrait_person(kind):
    S = 96
    im = new(S, S)
    d = ImageDraw.Draw(im)
    if kind == 'p1':
        jac, jacD, jacL, hair, hairL = P['jacket1'], P['jacket1D'], P['jacket1L'], P['hair1'], P['hair1L']
    elif kind == 'p2':
        jac, jacD, jacL, hair, hairL = P['jacket2'], P['jacket2D'], P['jacket2L'], P['hair2'], P['hair2L']
    else:  # captain
        jac, jacD, jacL, hair, hairL = P['coat'], P['coat2'], P['coatL'], (200, 200, 205, 255), (235, 235, 240, 255)
    # shoulders
    d.rounded_rectangle([14, 70, 82, 110], 14, fill=jac)
    d.rounded_rectangle([14, 86, 82, 110], 10, fill=jacD)
    d.polygon([(38, 70), (48, 84), (58, 70)], fill=P['white'] if kind != 'captain' else P['hat'])
    d.line([48, 84, 48, 96], fill=jacD)
    d.rectangle([24, 74, 30, 96], fill=jacL)
    # neck
    d.rectangle([41, 60, 55, 72], fill=P['skin2'])
    # back hair
    if kind == 'p1':
        d.rounded_rectangle([20, 14, 76, 74], 22, fill=hair)
    elif kind == 'captain':
        d.rounded_rectangle([24, 22, 72, 66], 18, fill=hair)
    # face
    d.rounded_rectangle([26, 20, 70, 66], 18, fill=P['skin'])
    d.rounded_rectangle([26, 46, 70, 66], 16, fill=P['skin'])
    d.polygon([(64, 30), (70, 40), (68, 58), (60, 64)], fill=P['skin2'])
    # ears
    d.ellipse([22, 38, 30, 50], fill=P['skin2'])
    d.ellipse([66, 38, 74, 50], fill=P['skin2'])
    # eyes
    for ex in (36, 54):
        d.rounded_rectangle([ex, 38, ex + 7, 48], 2, fill=P['eye'])
        d.rectangle([ex + 1, 39, ex + 3, 41], fill=P['eyeW'])
        d.point((ex + 5, 45), fill=P['eyeW'])
        d.line([ex - 1, 34, ex + 7, 33], fill=hair if kind != 'captain' else P['rock2'], width=2)
    # blush, nose, mouth
    d.ellipse([31, 50, 37, 54], fill=P['blush'])
    d.ellipse([60, 50, 66, 54], fill=P['blush'])
    d.line([48, 48, 47, 52], fill=P['skin3'])
    d.line([43, 57, 52, 57], fill=P['skin3'])
    d.point((42, 56), fill=P['skin3'])
    d.point((53, 56), fill=P['skin3'])
    # front hair
    if kind == 'p1':
        d.rounded_rectangle([22, 10, 74, 34], 14, fill=hair)
        d.polygon([(30, 30), (44, 22), (40, 38)], fill=hair)
        d.polygon([(50, 22), (66, 28), (70, 44), (60, 30)], fill=hair)
        d.rectangle([20, 30, 28, 70], fill=hair)
        d.rectangle([68, 30, 76, 70], fill=hair)
        d.arc([28, 12, 60, 30], 200, 300, fill=hairL, width=2)
        # lantern glint clip
        d.ellipse([62, 12, 70, 20], fill=P['glass'])
    elif kind == 'p2':
        d.rounded_rectangle([22, 10, 74, 30], 12, fill=hair)
        for x0 in (26, 36, 48, 58):
            d.polygon([(x0, 26), (x0 + 10, 26), (x0 + 4, 36)], fill=hair)
        d.arc([30, 12, 62, 26], 200, 300, fill=hairL, width=2)
        # headphones
        d.arc([16, 6, 80, 60], 190, 350, fill=P['black'], width=4)
        d.rounded_rectangle([14, 34, 26, 54], 4, fill=P['black'])
        d.rounded_rectangle([70, 34, 82, 54], 4, fill=P['black'])
        d.rectangle([17, 38, 23, 50], fill=P['jacket2D'])
        d.rectangle([73, 38, 79, 50], fill=P['jacket2D'])
    else:
        # captain hat
        d.rounded_rectangle([20, 10, 76, 28], 8, fill=P['hat'])
        d.rectangle([18, 24, 78, 30], fill=P['hatL'])
        d.ellipse([42, 13, 54, 23], fill=P['gold'])
        d.rectangle([22, 28, 30, 50], fill=hair)
        d.rectangle([66, 28, 74, 50], fill=hair)
        d.rectangle([60, 74, 66, 80], fill=P['gold'])
        d.rectangle([60, 84, 66, 90], fill=P['gold'])
    return outline(im)


def portrait_pip():
    S = 96
    im = new(S, S)
    d = ImageDraw.Draw(im)
    d.polygon([(40, 70), (30, 96), (52, 96)], fill=P['pipB'])
    d.ellipse([22, 40, 70, 96], fill=P['pipR'])
    d.ellipse([28, 64, 66, 98], fill=P['pipR2'])
    d.ellipse([20, 58, 44, 92], fill=P['pipY'])
    d.ellipse([18, 72, 40, 94], fill=P['pipB'])
    d.ellipse([28, 12, 74, 56], fill=P['pipR'])
    d.ellipse([34, 16, 52, 30], fill=(235, 90, 80, 255))
    # eye patch + eye
    d.ellipse([50, 22, 66, 38], fill=P['white'])
    d.ellipse([55, 26, 63, 35], fill=P['eye'])
    d.point((57, 28), fill=P['eyeW'])
    d.point((58, 28), fill=P['eyeW'])
    # beak
    d.polygon([(66, 30), (86, 36), (80, 52), (68, 46)], fill=P['beak'])
    d.polygon([(68, 44), (80, 50), (76, 56), (68, 50)], fill=P['beak2'])
    d.line([70, 34, 82, 38], fill=(255, 250, 230, 255))
    # head feathers
    d.polygon([(38, 14), (32, 2), (46, 12)], fill=P['pipR'])
    d.polygon([(46, 12), (46, 0), (54, 12)], fill=P['pipY'])
    return outline(im)


def portrait_keeper():
    # the keeper is only a voice on the radio: an old radio with a photo
    S = 96
    im = new(S, S)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([10, 30, 86, 88], 8, fill=P['wood'])
    d.rounded_rectangle([10, 30, 86, 36], 6, fill=P['woodL'])
    d.rounded_rectangle([18, 42, 52, 80], 4, fill=P['wood3'])
    for y in range(46, 78, 4):
        d.line([20, y, 50, y], fill=P['wood2'])
    d.ellipse([60, 46, 76, 62], fill=P['metalL'])
    d.ellipse([64, 50, 72, 58], fill=P['metal2'])
    d.rectangle([58, 68, 78, 74], fill=(40, 60, 50, 255))
    d.line([60, 71, 76, 71], fill=P['green'])
    d.line([70, 30, 88, 4], fill=P['metal'], width=2)
    # photo pinned on top
    d.rectangle([22, 6, 50, 34], fill=P['white'])
    d.rectangle([25, 9, 47, 29], fill=(180, 160, 130, 255))
    d.ellipse([31, 12, 41, 22], fill=(120, 100, 80, 255))
    d.rectangle([29, 21, 43, 29], fill=(100, 80, 70, 255))
    return outline(im)


def portrait_storm():
    S = 96
    im = new(S, S)
    d = ImageDraw.Draw(im)
    for (x, y, r) in ((30, 50, 26), (60, 44, 30), (46, 30, 24), (70, 66, 20), (24, 70, 18)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['cloud2'])
    for (x, y, r) in ((44, 28, 18), (62, 38, 20), (30, 46, 16)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['cloud'])
    d.ellipse([34, 24, 50, 34], fill=P['cloudL'])
    # eyes
    d.polygon([(30, 50), (44, 46), (42, 56)], fill=P['eyeglow'])
    d.polygon([(66, 46), (52, 46), (56, 56)], fill=P['eyeglow'])
    d.arc([34, 58, 64, 78], 200, 340, fill=P['eyeglow'], width=3)
    d.line([70, 70, 64, 84], fill=P['eyeglow'], width=2)
    d.line([64, 84, 70, 86], fill=P['eyeglow'], width=2)
    return outline(im, P['black'])


# ----------------------------------------------------------------- boss / finale
def boss_sprites():
    # big storm (128x96)
    im = new(128, 96)
    d = ImageDraw.Draw(im)
    for (x, y, r) in ((30, 54, 28), (64, 44, 36), (98, 54, 28), (46, 66, 24), (84, 68, 24)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['cloud2'])
    for (x, y, r) in ((52, 34, 22), (78, 38, 24), (36, 46, 16)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['cloud'])
    d.ellipse([46, 18, 66, 30], fill=P['cloudL'])
    d.polygon([(38, 52), (56, 48), (54, 60)], fill=P['eyeglow'])
    d.polygon([(90, 52), (72, 48), (74, 60)], fill=P['eyeglow'])
    d.arc([44, 62, 84, 86], 200, 340, fill=P['eyeglow'], width=3)
    save(outline(im, P['black']), 'boss/storm.png')
    # lamp (64x64)
    for on in (0, 1):
        im = new(64, 64)
        d = ImageDraw.Draw(im)
        d.rectangle([14, 44, 49, 62], fill=P['metal2'])
        d.rectangle([14, 44, 49, 46], fill=P['metalL'])
        d.polygon([(18, 44), (46, 44), (40, 14), (24, 14)], fill=P['glass'] if on else (90, 110, 140, 255))
        d.polygon([(24, 14), (40, 14), (36, 8), (28, 8)], fill=P['metal2'])
        if on:
            d.ellipse([24, 22, 40, 38], fill=P['white'])
        d.line([32, 14, 32, 44], fill=P['metal2'])
        save(outline(im), f'boss/lamp{on}.png')
    # boat 24x40 (top view)
    im = new(24, 40)
    d = ImageDraw.Draw(im)
    d.polygon([(12, 0), (22, 12), (21, 37), (3, 37), (2, 12)], fill=P['white'])
    d.polygon([(12, 0), (22, 12), (21, 37), (12, 37)], fill=P['white2'])
    d.rectangle([5, 14, 18, 26], fill=P['red'])
    d.rectangle([7, 16, 16, 22], fill=(120, 170, 220, 255))
    d.rectangle([4, 34, 19, 37], fill=P['red2'])
    d.ellipse([10, 4, 14, 8], fill=P['gold'])
    save(outline(im), 'boss/boat.png')
    # sea rock
    im = new(24, 20)
    d = ImageDraw.Draw(im)
    d.ellipse([1, 4, 23, 19], fill=P['rock3'])
    d.ellipse([3, 2, 19, 15], fill=P['rock2'])
    d.ellipse([5, 3, 11, 8], fill=P['rock'])
    d.arc([0, 10, 24, 22], 20, 160, fill=P['foam'])
    save(outline(im), 'boss/searock.png')
    # drifting mast
    im = new(48, 12)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([1, 3, 46, 9], 3, fill=P['wood2'])
    d.line([2, 4, 45, 4], fill=P['woodL'])
    d.polygon([(10, 3), (20, 0), (24, 3)], fill=P['white2'])
    save(outline(im), 'boss/mast.png')


def ui_bits():
    # key prompt bubble
    im = new(14, 14)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, 13, 11], 3, fill=P['white'])
    d.polygon([(5, 11), (8, 11), (6, 13)], fill=P['white'])
    d.text((4, 0), 'E', fill=P['outline'])
    save(outline(im), 'ui/prompt.png')
    im = new(8, 8)
    d = ImageDraw.Draw(im)
    d.point([(1, 0), (2, 0), (5, 0), (6, 0)], fill=P['red'])
    d.rectangle([0, 1, 7, 3], fill=P['red'])
    d.polygon([(0, 3), (7, 3), (4, 7), (3, 7)], fill=P['red'])
    d.point((1, 1), fill=P['white'])
    save(im, 'ui/heart.png')
    im = new(4, 4)
    ImageDraw.Draw(im).rectangle([0, 0, 3, 3], fill=(255, 255, 255, 255))
    save(im, 'ui/dot.png')
    im = new(8, 8)
    ImageDraw.Draw(im).ellipse([0, 0, 7, 7], fill=(255, 255, 255, 255))
    save(im, 'ui/soft.png')


def main():
    m = map_gen.build()
    with open(os.path.join(OUT, 'map.json'), 'w') as f:
        json.dump(m, f)
    save(render_ground(m), 'ground.png')
    render_water()
    for v in (0, 1):
        save(tree(v), f'props/tree{v}.png')
        save(palm(v), f'props/palm{v}.png')
        save(rock(v), f'props/rock{v}.png')
        save(hedge(v), f'props/hedge{v}.png')
    save(thorns(), 'props/thorns.png')
    save(crate(False), 'props/crate.png')
    save(crate(True), 'props/crate_open.png')
    save(wreck(), 'props/wreck.png')
    save(bottle(), 'props/bottle.png')
    save(log_sprite(), 'props/log.png')
    save(house(False), 'props/cottage.png')
    save(house(True), 'props/cottage_lit.png')
    save(shed(False), 'props/shed.png')
    save(shed(True), 'props/shed_on.png')
    save(lighthouse(False), 'props/lighthouse.png')
    save(lighthouse(True), 'props/lighthouse_on.png')
    save(door_glow(), 'props/door_glow.png')
    save(tower(), 'props/tower.png')
    save(sign(), 'props/sign.png')
    save(chest(False), 'props/chest.png')
    save(chest(True), 'props/chest_open.png')
    save(lens(), 'props/lens.png')
    save(desk(), 'props/desk.png')
    save(station(False), 'props/station.png')
    save(station(True), 'props/station_on.png')
    save(bed(), 'props/bed.png')
    save(shelf(), 'props/shelf.png')
    save(rug(), 'props/rug.png')
    save(pip_sheet(), 'npc/pip.png')
    save(gull_sheet(), 'npc/gull.png')
    # never overwrite the players' own character art unless asked (--characters)
    force_chars = '--characters' in sys.argv
    for k in ('p1', 'p2'):
        for name, fn in (('walk.png', character_sheet), ('portrait.png', portrait_person)):
            if force_chars or not os.path.exists(os.path.join(OUT, 'characters', k, name)):
                save(fn(k), f'characters/{k}/{name}')
    save(portrait_person('captain'), 'portraits/captain.png')
    save(portrait_pip(), 'portraits/pip.png')
    save(portrait_keeper(), 'portraits/keeper.png')
    save(portrait_storm(), 'portraits/storm.png')
    boss_sprites()
    ui_bits()
    print('art written to', OUT)


if __name__ == '__main__':
    main()
