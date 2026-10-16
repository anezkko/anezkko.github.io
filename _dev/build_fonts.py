"""Builds ZID's self-hosted fonts from the full Google Fonts sources (OFL): one WOFF2 per family, Latin + Latin
Extended + every symbol the site uses, Archivo and Martian Mono pinned to their normal width (the width axis isn't
used), and prints @font-face rules with metric overrides for the fallback fonts, so text doesn't jump when the real
font arrives.

    pip install fonttools brotli
    python3 _dev/build_fonts.py <folder with the .ttf sources>      # writes fonts/*.woff2

Sources: github.com/google/fonts ofl/archivo/Archivo[wdth,wght].ttf, ofl/martianmono/MartianMono[wdth,wght].ttf,
ofl/sedgwickavedisplay/SedgwickAveDisplay-Regular.ttf
"""
import io
import os
import sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'fonts')
os.makedirs(OUT, exist_ok=True)

# Latin, Latin-1, Latin Extended-A (č ć đ š ž and the rest), ș ț, general punctuation (quotes, dashes, …), and the
# symbols the page uses: € ™ arrows ← ↑ → ↓ ↗, minus, ⋮ ◆ ★ ♪ ′ ×
UNICODES = (list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x218, 0x21C)) + list(range(0x2000, 0x2070))
            + [0x20AC, 0x2122, 0x2212, 0x22EE, 0x25C6, 0x2605, 0x266A, 0x2032] + list(range(0x2190, 0x219A)))

FAMILIES = [
    # file in SRC, output name, axes to pin or limit, fallback (local names, its metrics: unitsPerEm, avg width, ascent, descent, lineGap)
    ('Archivo[wdth,wght].ttf', 'archivo', {'wdth': 100, 'wght': (400, 900)},
     ('Archivo Fallback', ['Arial', 'Helvetica Neue', 'Helvetica', 'Liberation Sans'], (2048, 904, 1854, 434, 67))),
    ('MartianMono[wdth,wght].ttf', 'martian-mono', {'wdth': 100, 'wght': (400, 600)},
     ('Martian Mono Fallback', ['Courier New', 'Menlo', 'Consolas', 'Liberation Mono'], (2048, 1229, 1705, 615, 0))),
    ('SedgwickAveDisplay-Regular.ttf', 'sedgwick-ave-display', None, None),
]


def avg_width(font):
    """the average advance of a-z and space, weighted as in English text, in em"""
    freq = {' ': 18, 'e': 10, 't': 7, 'a': 6.5, 'o': 6, 'i': 5.7, 'n': 5.7, 's': 5.3, 'h': 5, 'r': 5, 'd': 3.5, 'l': 3.3,
            'u': 2.3, 'c': 2.3, 'm': 2, 'w': 2, 'f': 1.8, 'g': 1.6, 'y': 1.6, 'p': 1.5, 'b': 1.2, 'v': 0.8, 'k': 0.6}
    cmap, hmtx, upm = font.getBestCmap(), font['hmtx'], font['head'].unitsPerEm
    total = sum(hmtx[cmap[ord(c)]][0] * w for c, w in freq.items())
    return total / sum(freq.values()) / upm


for src, name, axes, fb in FAMILIES:
    font = TTFont(os.path.join(SRC, src))
    if axes:
        font = instancer.instantiateVariableFont(font, axes)
        # save and reload the instanced font, so the subsetter sees fully loaded variation data
        buf = io.BytesIO(); font.save(buf); buf.seek(0); font = TTFont(buf)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    path = os.path.join(OUT, f'{name}.woff2')
    font.flavor = 'woff2'
    font.save(path)
    print(f'/* {name}.woff2: {os.path.getsize(path) // 1024} KB, {len(font.getBestCmap())} characters */')
    if fb:
        fam, local, (fupm, fw, fa, fd, fg) = fb
        size = avg_width(font) / (fw / fupm)
        hhea, upm = font['hhea'], font['head'].unitsPerEm
        asc, desc, gap = hhea.ascent / upm / size, -hhea.descent / upm / size, hhea.lineGap / upm / size
        srcs = ', '.join(f'local("{n}")' for n in local)
        print(f'@font-face{{font-family:"{fam}";src:{srcs};size-adjust:{size * 100:.2f}%;'
              f'ascent-override:{asc * 100:.2f}%;descent-override:{desc * 100:.2f}%;line-gap-override:{gap * 100:.2f}%}}')
