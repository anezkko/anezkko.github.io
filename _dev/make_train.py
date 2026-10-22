"""Builds the train hero's pictures from the owner's Gemini images (_dev/art/train/*.jpg, magenta backgrounds).

    python3 _dev/make_train.py            # writes img/train/*.avif + *.webp and prints the sizes the CSS uses

scene.jpg  the dusk Neretva valley with an empty track: resized for the page (the rail top sits 946/1184 = 79.9%
           down the picture, which the CSS relies on)
wagon.jpg  the boxcar people paint on       loco.jpg  the locomotive (Gemini drew a blurred copy above it: dropped)
front.jpg  things standing in front of the track: poles, a poster fence, grass (each cut out on its own)
Each vehicle is cut where its wheels meet the rail, so its bottom edge is the rail; the wagon and the locomotive
share one scale, so they match on the track.
"""
import json
import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'art', 'train')
OUT = os.path.join(os.path.dirname(HERE), 'img', 'train')
os.makedirs(OUT, exist_ok=True)
RAIL = {'wagon': 1007, 'loco': 1007, 'front': 1099}   # the row just above each picture's rail
WAGON_W = 1600                                        # the wagon's width in the page's picture, in pixels


def key(rgb):
    """RGBA: the magenta becomes clear; the fringe it leaves is cleaned up"""
    i16 = rgb.astype(np.int16)
    bg = np.median(i16[:12].reshape(-1, 3), axis=0)
    bglike = (np.abs(i16 - bg).sum(axis=2) < 150) | ((i16[:, :, 0] > 140) & (i16[:, :, 1] < 70) & (i16[:, :, 2] > 120))
    k, lab = cv2.connectedComponents(bglike.astype(np.uint8), 8)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    # also every pocket of strong magenta enclosed by the art (under a wagon frame, inside a pole's lattice, between
    # grass stems): nothing drawn is that colour, and the posters' pinks are far less saturated
    pocket = (np.minimum(i16[:, :, 0], i16[:, :, 2]) - i16[:, :, 1] > 85) & (np.abs(i16[:, :, 0] - i16[:, :, 2]) < 70)
    fg = ~(np.isin(lab, list(edge)) | pocket)
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)).astype(bool)
    fg = cv2.erode(fg.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)   # drop the purple fringe
    out = rgb.copy().astype(np.int16)
    # what purple tint is left near the edge is pulled out of the red and blue
    near = cv2.dilate((~fg).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & fg
    m = np.clip(np.minimum(out[:, :, 0], out[:, :, 2]) - out[:, :, 1] - 25, 0, 255)
    for c in (0, 2):
        out[:, :, c] = np.where(near, out[:, :, c] - m * 0.7, out[:, :, c])
    a = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.8)   # a soft one-pixel edge, so it doesn't look cut out
    return np.dstack([np.clip(out, 0, 255).astype(np.uint8), (a * 255).astype(np.uint8)])


def pieces(rgba, min_area):
    """each separate thing in the picture, left to right, as (x0, y0, crop)"""
    solid = (rgba[:, :, 3] > 128).astype(np.uint8)
    k, lab, st, _ = cv2.connectedComponentsWithStats(solid, 8)
    out = []
    for i in sorted(range(1, k), key=lambda i: st[i][0]):
        x, y, w, h, area = st[i]
        if area < min_area:
            continue
        crop = rgba[y:y + h, x:x + w].copy()
        crop[:, :, 3] = np.where(lab[y:y + h, x:x + w] == i, crop[:, :, 3], 0)
        out.append((x, y, crop))
    return out


def dusk(rgba, bright=0.8, sat=0.9, hue=0):
    """the vehicles were drawn in daylight: darken and cool them into the scene's dusk (baked in, so the page has no
    filters to run); hue turns the colour wheel, in degrees, for a differently painted wagon"""
    im = Image.fromarray(rgba, 'RGBA')
    a = im.getchannel('A')
    rgb = ImageEnhance.Color(ImageEnhance.Brightness(im.convert('RGB')).enhance(bright)).enhance(sat)
    if hue:
        h, s_, v = rgb.convert('HSV').split()
        h = h.point(lambda x: (x + round(hue / 360 * 255)) % 256)
        rgb = Image.merge('HSV', (h, s_, v)).convert('RGB')
    rgb.putalpha(a)
    return np.asarray(rgb)


def save(name, rgba, width):
    im = Image.fromarray(rgba, 'RGBA')
    if width != im.width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), quality=80, method=6)
    im.save(os.path.join(OUT, name + '.avif'), quality=58, speed=4)
    kb = [os.path.getsize(os.path.join(OUT, name + e)) // 1024 for e in ('.webp', '.avif')]
    print(f'{name}: {im.width}x{im.height}  webp {kb[0]} KB, avif {kb[1]} KB')
    return im.size


def load(n):
    return cv2.imread(os.path.join(SRC, n + '.jpg'))[:, :, ::-1].copy()


sizes = {}
# the scene, at three widths
scene = Image.open(os.path.join(SRC, 'scene.jpg')).convert('RGB')
for w in (1200, 1800, 2400):
    im = scene.resize((w, round(scene.height * w / scene.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, f'scene-{w}.webp'), quality=74, method=6)
    im.save(os.path.join(OUT, f'scene-{w}.avif'), quality=55, speed=4)
    print(f'scene-{w}: webp {os.path.getsize(os.path.join(OUT, f"scene-{w}.webp")) // 1024} KB, avif {os.path.getsize(os.path.join(OUT, f"scene-{w}.avif")) // 1024} KB')

# the vehicles: the biggest piece above the rail; one scale for both, set by the wagon
wag = max(pieces(key(load('wagon')[:RAIL['wagon']]), 20000), key=lambda p: p[2].shape[0] * p[2].shape[1])
k = WAGON_W / wag[2].shape[1]
sizes['wagon'] = save('wagon', dusk(wag[2]), WAGON_W)
save('wagon-red', dusk(wag[2], 0.72, 1.25, 165), WAGON_W)     # the spare wagon: the same one, repainted (olive)
# the paint's mask: only the wagon's outline matters, so a small greyscale picture of its alpha is enough
m = Image.fromarray(wag[2][:, :, 3]).resize((400, round(wag[2].shape[0] * 400 / wag[2].shape[1])), Image.LANCZOS)
mask = Image.new('RGBA', m.size, (0, 0, 0, 0)); mask.putalpha(m)
mask.save(os.path.join(OUT, 'wagon-mask.png'), optimize=True)
print('wagon-mask.png', os.path.getsize(os.path.join(OUT, 'wagon-mask.png')) // 1024, 'KB')
loc = max(pieces(key(load('loco')[:RAIL['loco']]), 20000), key=lambda p: p[2].shape[0] * p[2].shape[1])
sizes['loco'] = save('loco', dusk(loc[2]), round(loc[2].shape[1] * k))

# the front layer: every piece, at the same scale, with how far its bottom sits above the rail
front = []
USE = (0, 3)          # the page uses the left pole and the small clump of grass (the fence and big grass are spare)
for j, (x, y, crop) in enumerate(pieces(key(load('front')[:RAIL['front']]), 4000)):
    if j not in USE:
        continue
    w, h = save(f'front-{j}', dusk(crop, 0.62, 0.9), max(8, round(crop.shape[1] * k)))   # nearest to us, darkest
    front.append({'w': w, 'h': h, 'x': round(x * k), 'lift': round((RAIL['front'] - (y + crop.shape[0])) * k)})
sizes['front'] = front
with open(os.path.join(HERE, 'out', 'train-sizes.json'), 'w') as f:
    json.dump(sizes, f, indent=1)
print(json.dumps(sizes))
