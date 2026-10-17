"""Makes img/leaves.webp: the dappled shadow of a tree canopy, used by the hero wall's living light (index.html,
.wall-light). Black leaf shadows on transparent, blurred like real shadows a few metres from the branch; small,
because it's soft and gets scaled up. Seeded, so it comes out the same every time.

    python3 _dev/make_leaves.py
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 900, 560
random.seed(1992)
img = Image.new('L', (W, H), 0)          # how dark the shadow is, 0 = full light
d = ImageDraw.Draw(img)

def leaf(cx, cy, size, ang, shade):
    # a leaf: a pointed ellipse, drawn as a polygon so it can turn
    pts = []
    for i in range(24):
        t = i / 24 * math.tau
        x = math.cos(t) * size
        y = math.sin(t) * size * 0.55 * (1 - 0.3 * math.cos(t))
        pts.append((cx + x * math.cos(ang) - y * math.sin(ang), cy + x * math.sin(ang) + y * math.cos(ang)))
    d.polygon(pts, fill=shade)

# the canopy: loose clusters of leaves hanging in from the top right, with sun showing between them, and a few
# stray leaves lower down. Each leaf adds a little shade, so where leaves overlap the shadow is deeper.
import numpy as np
acc = np.zeros((H, W), dtype=np.float32)
def add_leaf(cx, cy, size, ang, shade):
    m = Image.new('L', (W, H), 0)
    global d
    d = ImageDraw.Draw(m)
    leaf(cx, cy, size, ang, shade)
    acc[:] += np.asarray(m, dtype=np.float32)
clusters = []
for _ in range(30):
    # most of the canopy sits in the top right; it thins out towards the bottom left
    u, v = random.random(), random.random()
    x, y = W * (0.25 + 0.85 * u), H * (-0.1 + 0.75 * v * v)
    if random.random() < 0.18: x, y = W * random.uniform(0, 0.5), H * random.uniform(0.5, 1.05)
    clusters.append((x, y, random.uniform(45, 95)))
for x, y, spread in clusters:
    for _ in range(random.randint(14, 26)):
        a = random.uniform(0, math.tau); r = spread * math.sqrt(random.random())
        add_leaf(x + math.cos(a) * r, y + math.sin(a) * r, random.uniform(16, 30), random.uniform(0, math.pi), random.randint(60, 105))
# two thin twigs
d = ImageDraw.Draw(img)
for _ in range(2):
    x, y, ang = W * random.uniform(0.7, 1.0), -10, random.uniform(2.0, 2.4)
    for s_ in range(40):
        nx, ny = x + math.cos(ang) * 10, y + math.sin(ang) * 10
        d.line([(x, y), (nx, ny)], fill=110, width=max(2, 5 - s_ // 10)); x, y = nx, ny; ang += random.uniform(-0.1, 0.1)
img = Image.fromarray(np.clip(np.maximum(acc, np.asarray(img, dtype=np.float32)), 0, 210).astype('uint8'))
img = img.filter(ImageFilter.GaussianBlur(6))   # shadows from a few metres away are soft
alpha = img.point(lambda v: int(v * 0.8))
out = Image.new('RGBA', (W, H), (12, 10, 18, 0))
out.putalpha(alpha)
path = os.path.join(ROOT, 'img', 'leaves.webp')
out.save(path, 'WEBP', quality=60, method=6)
print(path, os.path.getsize(path) // 1024, 'KB')
