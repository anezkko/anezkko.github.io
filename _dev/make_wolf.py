"""Turns the Gemini wolf sheets (_dev/art/wolf/*.jpg, magenta background) into clean game-size pixel-art frames.

    python3 _dev/make_wolf.py [out dir]      # default _dev/out/wolf

Steps: the magenta that touches the picture's edge is background (so the pink bandana inside survives); wolves
that touch in the sheet are split along their dark outline; each frame is shrunk to the bear's scale, its colours
snapped to one shared palette, the purple fringe from the background turned into outline, and every frame lined up
on one ground line with the nose in the same place.
"""
import os
import sys
import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'art', 'wolf')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'wolf')
os.makedirs(OUT, exist_ok=True)
SCALE = 1 / 5.9          # one art pixel = one game unit: the standing wolf comes out about 52 units tall (Grafiter is 78)
COLOURS = 24


def cut(name):
    """the wolves on one sheet, each as an RGBA crop at full size, left to right"""
    rgb = cv2.imread(os.path.join(SRC, name + '.jpg'))[:, :, ::-1].copy()
    i16 = rgb.astype(np.int16)
    bg = np.median(np.concatenate([i16[:16].reshape(-1, 3), i16[-16:].reshape(-1, 3)]), axis=0)
    bglike = (np.abs(i16 - bg).sum(axis=2) < 110).astype(np.uint8)
    # background = the magenta region joined to the border
    k, lab = cv2.connectedComponents(bglike, 8)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    back = np.isin(lab, list(border))
    fg = (~back).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    k, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8)
    blobs = [i for i in range(1, k) if st[i][4] > 3000]
    widths = sorted(st[i][2] for i in blobs)
    typical = widths[len(widths) // 2]
    out = []
    for i in sorted(blobs, key=lambda i: st[i][0]):
        m = lab == i
        x, y, w, h, _ = st[i]
        if w > typical * 1.35:
            continue   # two wolves drawn overlapping: they can't be cut apart cleanly, and they repeat other frames
        ys, xs = np.where(m)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        a = (m[y0:y1, x0:x1] * 255).astype(np.uint8)
        out.append((np.dstack([rgb[y0:y1, x0:x1], a]), y1))   # y1: where its lowest point sat on the sheet
    return out


def shrink(rgba):
    """to game size: average the colour of covered pixels only, keep a pixel where it's at least half covered"""
    h, w = rgba.shape[:2]
    nw, nh = max(1, round(w * SCALE)), max(1, round(h * SCALE))
    a = rgba[:, :, 3:].astype(np.float32) / 255
    pre = rgba[:, :, :3].astype(np.float32) * a
    pre_s = cv2.resize(pre, (nw, nh), interpolation=cv2.INTER_AREA)
    a_s = cv2.resize(a, (nw, nh), interpolation=cv2.INTER_AREA)
    col = pre_s / np.maximum(a_s[:, :, None], 1e-3)
    return np.dstack([np.clip(col, 0, 255), (a_s > 0.5) * 255]).astype(np.uint8)


run = cut('run')
ground = max(b for _, b in run)                      # the sheet's ground line: the lowest paw of the standing wolf
lift = [round((ground - b) * SCALE * 0.3) for _, b in run]   # how high each frame floats, toned down: a gallop, not a hop
# Gemini drew the last run frame about 15% bigger than the rest; even it out so the head doesn't pulse
SIZE = {len(run) - 1: 0.87}
sheets = {'run': [shrink(cv2.resize(f, None, fx=SIZE.get(j, 1), fy=SIZE.get(j, 1), interpolation=cv2.INTER_AREA)) for j, (f, _) in enumerate(run)]}
target = np.median([f.shape[1] for f in sheets['run']])
# the design and jump pictures are drawn bigger: bring each to the run frames' wolf length
for n, share in (('design', 0.92), ('jump', 1.0)):
    fr = []
    for f, _ in cut(n):
        k = (target * share) / (f.shape[1] * SCALE)
        fr.append(shrink(cv2.resize(f, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)))
    sheets[n] = fr
print({n: [f.shape[1::-1] for f in fr] for n, fr in sheets.items()}, 'lift', lift)

# one palette for every frame (k-means over all solid pixels); purple fringe left over from the background is
# moved to the darkest colour, the outline
allpx = np.concatenate([f[f[:, :, 3] > 0][:, :3] for fr in sheets.values() for f in fr]).astype(np.float32)
fringe = (allpx[:, 0] > allpx[:, 1] + 60) & (allpx[:, 2] > allpx[:, 1] + 60) & (allpx[:, 0] < 200)
_, _, centres = cv2.kmeans(allpx[~fringe], COLOURS, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5), 4, cv2.KMEANS_PP_CENTERS)
centres = centres.astype(np.float32)
dark = centres[np.argmin(centres.sum(axis=1))]


def snap(f):
    out = f.copy()
    m = f[:, :, 3] > 0
    px = f[m][:, :3].astype(np.float32)
    fr = (px[:, 0] > px[:, 1] + 60) & (px[:, 2] > px[:, 1] + 60) & (px[:, 0] < 200)
    idx = np.argmin(((px[:, None, :] - centres[None]) ** 2).sum(axis=2), axis=1)
    col = centres[idx]
    col[fr] = dark
    out[m, :3] = col.astype(np.uint8)
    return out


frames = {n: [snap(f) for f in fr] for n, fr in sheets.items()}
for n, fr in frames.items():
    for j, f in enumerate(fr):
        Image.fromarray(f, 'RGBA').save(os.path.join(OUT, f'{n}{j}.png'))
# the game's frames: one canvas size, nose in the same place, paws on one ground line (plus each frame's lift)
named = [('idle', frames['design'][0], 0)] + [(f'run{j}', f, l) for j, (f, l) in enumerate(zip(frames['run'][1:], lift[1:]))] \
    + [('leap', frames['jump'][0], 4), ('land', frames['jump'][1], 0)]
W = max(f.shape[1] for _, f, _ in named) + 4
H = max(f.shape[0] + l for _, f, l in named) + 2
canvas = {}
for n, f, l in named:
    c = np.zeros((H, W, 4), np.uint8)
    nose = np.where(f[:, :, 3].any(axis=0))[0].max()
    x = W - 2 - nose - 1
    y = H - 1 - l - f.shape[0]
    c[y:y + f.shape[0], max(0, x):max(0, x) + f.shape[1]] = f[:, :W - max(0, x)]
    canvas[n] = c
    Image.fromarray(c, 'RGBA').save(os.path.join(OUT, f'wolf-{n}.png'))
print('frames', list(canvas), f'{W}x{H}', '· palette', len(centres), 'colours ·', OUT)

# the game's sprite format (PIXOBS in js/game.js): a palette, and each frame as one letter per pixel ('.' is clear);
# the anchor (ox, oy) is between the standing wolf's paws, on the ground line
LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
pal = ['#%02X%02X%02X' % tuple(int(v) for v in c) for c in centres]
def encode(c):
    out = []
    for px in c.reshape(-1, 4):
        if px[3] == 0: out.append('.'); continue
        out.append(LETTERS[int(np.argmin(((centres - px[:3].astype(np.float32)) ** 2).sum(axis=1)))])
    return ''.join(out)
idle = canvas['idle']
cols = np.where(idle[-3:, :, 3].any(axis=0))[0]          # the paws on the bottom rows
order = ['idle', 'run0', 'run1', 'run2', 'run3', 'leap', 'land']
sprite = {'w': W, 'h': H, 'ox': round(float(cols.min() + cols.max()) / 2, 2), 'oy': H - 1, 'pal': pal, 'frames': [encode(canvas[n]) for n in order]}
import json
with open(os.path.join(OUT, 'wolf.json'), 'w') as f:
    json.dump({'wolf': sprite}, f, separators=(',', ':'))
print('wolf.json', os.path.getsize(os.path.join(OUT, 'wolf.json')) // 1024, 'KB')
