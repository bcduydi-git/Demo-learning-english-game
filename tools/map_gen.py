"""Builds the island layout (collision grid + object placement).

Output: client/public/assets/map.json
Tile legend (grid characters):
  ~ deep water      , shallow water (blocked)   . sand      " grass
  : dirt path       # cliff / rock wall           = wooden floor (dock, interior)
  W interior wall   % void (outside interior)    B building footprint (blocked)
  t hedge (maze wall, blocked)   T tree trunk (blocked)   x hidden thorn trap (walkable)
  L fallen log (blocked until moved)   o rock (blocked)
"""
import json
import math
import os
import random

W, H = 76, 60
TILE = 16
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'client', 'public', 'assets', 'map.json')

BLOCKED = set('~,#WB%tToL')


def build(seed=7):
    rnd = random.Random(seed)
    g = [['~'] * W for _ in range(H)]

    def inside(x, y):
        return 0 <= x < W and 0 <= y < H

    def ell(cx, cy, rx, ry, ch, only=None, wobble=0.0):
        for y in range(H):
            for x in range(W):
                dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                ang = math.atan2(dy, dx)
                r = 1 + wobble * (math.sin(ang * 5 + cx) * 0.6 + math.sin(ang * 3 + cy) * 0.4)
                if dx * dx + dy * dy <= r * r and (only is None or g[y][x] in only):
                    g[y][x] = ch

    # --- island body ---
    ell(33, 29, 27, 21, '"', wobble=0.05)
    ell(32, 10, 11, 8, '"', wobble=0.06)
    ell(32, 47, 25, 8.5, '"', wobble=0.04)
    ell(12, 26, 11.5, 15, '"', wobble=0.03)
    ell(50, 36, 9, 8, '"', wobble=0.05)
    # east bay
    ell(59, 24, 6.5, 5.5, '~')
    # coastal sand ring
    land = [[g[y][x] != '~' for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if not land[y][x]:
                continue
            near = False
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    xx, yy = x + dx, y + dy
                    if inside(xx, yy) and not land[yy][xx] and abs(dx) + abs(dy) <= 3:
                        near = True
            if near:
                g[y][x] = '.'
    # the beach (south)
    for y in range(41, H):
        for x in range(W):
            if g[y][x] == '"':
                g[y][x] = '.'
    # shallow ring around land (blocked, drawn lighter)
    for y in range(H):
        for x in range(W):
            if g[y][x] != '~':
                continue
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    xx, yy = x + dx, y + dy
                    if inside(xx, yy) and g[yy][xx] in '."':
                        g[y][x] = ','
    # --- cliff separating beach and meadow (gap at x 30..32 holds the log) ---
    for y in (39, 40):
        for x in range(W):
            if g[y][x] in '."':
                g[y][x] = '#'
    for x in (30, 31, 32):
        g[39][x] = ':'
        g[40][x] = 'L'

    # --- Fog Woods maze (west) ---
    mx0, my0 = 3, 14  # top-left wall corner
    CW, CH_ = 5, 7  # cells
    # fill woods block with hedge
    for y in range(my0 - 1, my0 + CH_ * 3 + 2):
        for x in range(mx0 - 1, mx0 + CW * 3 + 3):
            if inside(x, y) and g[y][x] in '."':
                g[y][x] = 't'
    cells = {}
    for cy in range(CH_):
        for cx in range(CW):
            cells[(cx, cy)] = []
    # carve maze with DFS
    stack = [(4, 3)]
    seen = {(4, 3)}
    mrnd = random.Random(11)
    while stack:
        c = stack[-1]
        nbrs = [(c[0] + dx, c[1] + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        nbrs = [n for n in nbrs if n in cells and n not in seen]
        if not nbrs:
            stack.pop()
            continue
        n = mrnd.choice(nbrs)
        cells[c].append(n)
        cells[n].append(c)
        seen.add(n)
        stack.append(n)
    # extra loops so it is not a pure tree
    for a, b in [((1, 1), (2, 1)), ((0, 4), (1, 4)), ((3, 5), (3, 6)), ((2, 2), (2, 3))]:
        if b not in cells[a]:
            cells[a].append(b)
            cells[b].append(a)

    def cell_tiles(cx, cy):
        x = mx0 + 1 + cx * 3
        y = my0 + 1 + cy * 3
        return [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)]

    for (cx, cy), links in cells.items():
        for (x, y) in cell_tiles(cx, cy):
            g[y][x] = '"'
        for (nx, ny) in links:
            if nx > cx:  # open wall to the right
                x = mx0 + 1 + cx * 3 + 2
                y = my0 + 1 + cy * 3
                g[y][x] = g[y + 1][x] = '"'
            if ny > cy:
                x = mx0 + 1 + cx * 3
                y = my0 + 1 + cy * 3 + 2
                g[y][x] = g[y][x + 1] = '"'
    # entrance on the east side of cell (4,3)
    ex = mx0 + 1 + 4 * 3 + 2
    ey = my0 + 1 + 3 * 3
    for x in range(ex, ex + 3):
        g[ey][x] = g[ey + 1][x] = '"'

    # BFS to find the far cell for the lens and the solution path
    from collections import deque
    start = (4, 3)
    prev = {start: None}
    dq = deque([start])
    while dq:
        c = dq.popleft()
        for n in cells[c]:
            if n not in prev:
                prev[n] = c
                dq.append(n)

    def depth(c):
        d = 0
        while prev[c]:
            c = prev[c]
            d += 1
        return d

    goal = max(cells, key=lambda c: (depth(c), -c[0]))
    path = []
    c = goal
    while c:
        path.append(c)
        c = prev[c]
    path.reverse()

    # traps: on the solution path block one lane; on wrong branches block the whole way
    traps = set()

    def lane_trap(c, lane, vertical):
        tiles = cell_tiles(*c)
        # tiles: TL, TR, BL, BR
        if vertical:  # moving vertically, block left or right lane
            pick = [tiles[0], tiles[2]] if lane == 0 else [tiles[1], tiles[3]]
            traps.add(pick[rnd.randint(0, 1)])
        else:
            pick = [tiles[0], tiles[1]] if lane == 0 else [tiles[2], tiles[3]]
            traps.add(pick[rnd.randint(0, 1)])

    for i in range(1, len(path) - 1):
        if i % 2 == 0 or i == len(path) - 2:
            a, b = path[i - 1], path[i]
            vertical = a[0] == b[0]
            lane_trap(b, rnd.randint(0, 1), vertical)
    on_path = set(path)
    for c in path:
        for n in cells[c]:
            if n not in on_path:
                for t in cell_tiles(*n):
                    if rnd.random() < 0.5:
                        traps.add(t)
    for (x, y) in traps:
        g[y][x] = 'x'
    gx, gy = cell_tiles(*goal)[0]

    # --- paths ---
    def path_line(x0, y0, x1, y1):
        x, y = x0, y0
        while (x, y) != (x1, y1):
            if g[y][x] in '."':
                g[y][x] = ':'
            if x != x1 and (y == y1 or rnd.random() < 0.5):
                x += 1 if x1 > x else -1
            else:
                y += 1 if y1 > y else -1
        if g[y][x] in '."':
            g[y][x] = ':'

    path_line(31, 38, 31, 33)
    path_line(31, 33, 32, 12)
    path_line(31, 33, 26, 31)
    path_line(31, 33, 45, 34)
    path_line(31, 26, 21, 25)
    for x in range(20, 24):
        g[24][x] = g[25][x] = ':' if g[24][x] in '"' else g[24][x]

    # --- buildings (footprints) ---
    def block(x0, y0, x1, y1, ch='B'):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                g[y][x] = ch

    block(24, 28, 27, 30)  # cottage (64x48 sprite, door between x=25 and 26)
    block(44, 32, 46, 33)  # generator hut (48x32)
    block(31, 5, 33, 9)    # lighthouse
    block(23, 21, 24, 22)  # watchtower legs
    for x in (25, 26):
        g[31][x] = ':'
    g[34][45] = ':'
    g[10][32] = ':'
    # dock in the east bay
    for x in range(52, 56):
        g[25][x] = '='

    # --- cottage interior (off-island): 1-tile frame around a wooden floor ---
    ix0, iy0, ix1, iy1 = 64, 3, 74, 10
    block(ix0 - 1, iy0 - 2, ix1 + 1, iy1 + 1, '%')
    block(ix0, iy0, ix1, iy1, 'W')
    block(ix0 + 1, iy0 + 1, ix1 - 1, iy1 - 1, '=')
    g[iy1][69] = '='  # doorway tile (exit trigger)

    # ground types before decoration (used by the art generator)
    base = [row[:] for row in g]

    # --- decoration objects (trees, bushes, rocks) ---
    objects = []

    def place(kind, x, y, **kw):
        objects.append(dict(type=kind, x=x, y=y, **kw))

    reserved = set()
    for (x, y) in [(29, 46), (34, 47), (25, 31), (26, 31), (45, 34), (32, 10), (22, 24), (40, 46), (16, 48), (48, 50), (33, 42), (22, 27), (25, 24)]:
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                reserved.add((x + dx, y + dy))

    def free(x, y, chars):
        return inside(x, y) and g[y][x] in chars and (x, y) not in reserved

    def near(x, y, chars, r=1):
        return any(inside(x + dx, y + dy) and g[y + dy][x + dx] in chars for dy in range(-r, r + 1) for dx in range(-r, r + 1))

    for y in range(2, H - 1):
        for x in range(1, W - 2):
            in_woods = 2 <= x <= 21 and 12 <= y <= 38
            if in_woods:
                continue
            if free(x, y, '"') and free(x + 1, y, '"') and not near(x, y, ':B=', 1) and not near(x + 1, y, ':B=', 1) \
                    and inside(x, y - 1) and g[y - 1][x] not in 'TB' and g[y - 1][x + 1] not in 'TB':
                r = rnd.random()
                if r < 0.075:
                    kind = 'pine' if (y < 16 or x > 46 or rnd.random() < 0.3) else 'tree'
                    g[y][x] = g[y][x + 1] = 'T'
                    place(kind, x, y)
                    continue
                if r < 0.085:
                    g[y][x] = g[y][x + 1] = 'o'
                    place('boulder', x, y)
                    continue
            if free(x, y, '"') and not near(x, y, ':B=', 1):
                r = rnd.random()
                if r < 0.02:
                    g[y][x] = 'o'
                    place('rock', x, y, v=rnd.randint(0, 1))
                elif r < 0.045:
                    g[y][x] = 'o'
                    place('bush', x, y)
            elif free(x, y, '.') and not near(x, y, '~,', 1) and y < 58:
                r = rnd.random()
                if r < 0.025:
                    g[y][x] = 'o'
                    place('plant', x, y, v=rnd.randint(0, 1))
                elif r < 0.04:
                    g[y][x] = 'o'
                    place('rock', x, y, v=rnd.randint(0, 1))

    # gameplay objects (tile coordinates)
    game = [
        dict(type='wreck', id='wreck', x=16, y=48),
        dict(type='crate', id='crate', x=40, y=46),
        dict(type='bottle', id='bottle', x=48, y=50),
        dict(type='log', id='log', x=31, y=40),
        dict(type='cottage', id='cottage', x=24, y=30),
        dict(type='shed', id='shed', x=44, y=33),
        dict(type='lighthouse', id='lighthouse', x=32, y=9),
        dict(type='tower', id='tower', x=23, y=22),
        dict(type='sign', id='sign_beach', x=33, y=42),
        dict(type='sign', id='sign_woods', x=22, y=27),
        dict(type='sign', id='sign_tower', x=25, y=24),
        dict(type='chest', id='lens', x=gx, y=gy),
        dict(type='desk', id='journal', x=66, y=4),
        dict(type='station', id='station', x=72, y=4),
        dict(type='bed', id='bed', x=72, y=7),
        dict(type='shelf', id='shelf', x=68, y=4),
        dict(type='plant', id='iplant', x=65, y=4),
        dict(type='rug', id='rug', x=69, y=7),
        dict(type='dock', id='dock', x=54, y=25),
    ]
    g[gy][gx] = 'B'
    # solid footprints of props
    for (x0, y0, x1, y1) in [(15, 48, 17, 48), (40, 46, 40, 46), (66, 4, 67, 4), (72, 4, 73, 4), (72, 7, 73, 8), (68, 4, 69, 4), (65, 4, 65, 4)]:
        block(x0, y0, x1, y1)
    # mark the sign tiles blocked
    for o in game:
        if o['type'] == 'sign':
            g[o['y']][o['x']] = 'o'

    data = dict(
        w=W, h=H, tile=TILE,
        grid=[''.join(r) for r in g],
        ground=[''.join({'T': '"', 'o': '"', 'B': '"', 'L': ':', 'x': '"', 't': 'h'}.get(c, c) for c in r) for r in base],
        deco=objects,
        objects=game,
        spawns=dict(p1=[29, 46], p2=[34, 47]),
        areas=dict(
            woods=[mx0 - 1, my0 - 1, mx0 + CW * 3 + 2, my0 + CH_ * 3 + 1],
            interior=[ix0 - 1, iy0 - 1, ix1 + 1, iy1 + 1],
            maze_start=[ex + 2, ey],
            interior_spawn=[69, 9],
            cottage_exit=[25.5, 32],
            lookout=[22, 24],
        ),
        traps=sorted([list(t) for t in traps]),
        maze_path=[list(cell_tiles(*c)[0]) for c in path],
    )
    return data


if __name__ == '__main__':
    d = build()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(d, f)
    for row in d['grid']:
        print(row)
