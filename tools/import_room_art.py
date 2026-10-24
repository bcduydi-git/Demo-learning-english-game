"""Room backgrounds for chapters 2 and 3.

    python3 tools/import_room_art.py

Takes the drawings in tools/source_art/ch2/ and tools/source_art/ch3/
(16:9 pixel art, usually drawn with every art pixel as an NxN block),
brings each back to its real pixel size (smaller file, sharp when the game
scales it by a whole number) and lists it in the manifest, so the game
uses it instead of the placeholder room.
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = [os.path.join(ROOT, 'tools', 'source_art', c) for c in ('ch2', 'ch3')]
OUT = os.path.join(ROOT, 'client', 'public', 'assets', 'ch2', 'rooms')


def block_size(a):
    """Largest N such that the picture is made of NxN single-colour blocks."""
    for k in (8, 6, 5, 4, 3, 2):
        h, w = (a.shape[0] // k) * k, (a.shape[1] // k) * k
        b = a[:h, :w].reshape(h // k, k, w // k, k, a.shape[2])
        if ((b.max(axis=(1, 3)) - b.min(axis=(1, 3))).sum(axis=2) == 0).mean() > 0.995:
            return k
    return 1


def main():
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, 'manifest.json')
    man = json.load(open(path, encoding='utf-8'))
    rooms = set(man.get('rooms', []))
    for d in SRC:
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith('.png'):
                continue
            name = f[:-4]
            src = Image.open(os.path.join(d, f))
            im = src if src.mode == 'P' else src.convert('RGB')  # keep a palette if there is one (smaller file)
            k = block_size(np.array(im.convert('RGB')))
            small = im.resize((im.size[0] // k, im.size[1] // k), Image.NEAREST) if k > 1 else im
            small.save(os.path.join(OUT, f), optimize=True)
            rooms.add(name)
            print(f'{name}: {im.size[0]}x{im.size[1]} -> {small.size[0]}x{small.size[1]} (block {k})')
    man['rooms'] = sorted(rooms)
    json.dump(man, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(path, 'a').write('\n')


if __name__ == '__main__':
    main()
