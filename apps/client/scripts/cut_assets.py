"""
@module   assets  @owner CLIENT
Purpose:  Cut v4 design sheets (mascot, mood characters, botanicals, illustrations, logo) into
          transparent WebP sprites for the client app. Run: python3 -I scripts/cut_assets.py <repo_root>
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = sys.argv[1]
OUT = os.path.join(ROOT, 'apps/client/public/img')
os.makedirs(OUT, exist_ok=True)
S = 1.344  # display→original scale used when the boxes were measured

def load(p): return Image.open(os.path.join(ROOT, p)).convert('RGB')

def bg_plane(a):
    """Least-squares plane per channel fitted on the crop border (smooth gradient backgrounds)."""
    h, w, _ = a.shape
    m = np.zeros((h, w), bool); b = 6
    m[:b, :] = m[-b:, :] = m[:, :b] = m[:, -b:] = True
    ys, xs = np.nonzero(m)
    A = np.c_[xs, ys, np.ones_like(xs)].astype(float)
    yy, xx = np.mgrid[0:h, 0:w]
    full = np.stack([xx.ravel(), yy.ravel(), np.ones(h * w)], 1)
    out = np.zeros_like(a, float)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, a[ys, xs, c].astype(float), rcond=None)
        out[..., c] = (full @ coef).reshape(h, w)
    return out

def cutout(img, box, name, lo=14, hi=38, height=None, pad=8, shadow=True, floor=True):
    crop = img.crop(tuple(int(v) for v in box))
    a = np.asarray(crop).astype(float)
    bg = bg_plane(a)
    diff = np.sqrt(((a - bg) ** 2).sum(-1))
    # flood fill from border through "near background" pixels
    near = diff < lo
    if shadow:  # neutral darkening of the background = cast shadow → passable, rendered as soft black alpha
        ratio = a / np.maximum(bg, 1)
        rmean, rstd = ratio.mean(-1), ratio.std(-1)
        shadowlike = (rstd < 0.022) & (rmean > 0.62) & (rmean < 0.995)
        near = near | shadowlike
        if floor:  # light/dark neutral floor reflections in the bottom band of the crop
            band = np.zeros_like(near); band[int(near.shape[0] * 0.80):, :] = True
            near = near | (band & (rstd < 0.03) & (rmean > 0.6) & (rmean < 1.08))
    h, w = diff.shape
    reached = np.zeros_like(near)
    reached[0, :] = near[0, :]; reached[-1, :] = near[-1, :]; reached[:, 0] = near[:, 0]; reached[:, -1] = near[:, -1]
    while True:  # geodesic dilation = flood fill from the border (PIL floodfill misbehaves on L images in Pillow 12)
        grown = reached.copy()
        grown[1:, :] |= reached[:-1, :]; grown[:-1, :] |= reached[1:, :]
        grown[:, 1:] |= reached[:, :-1]; grown[:, :-1] |= reached[:, 1:]
        grown &= near
        if (grown == reached).all(): break
        reached = grown
    bgmask = reached
    # soft edge: pixels within a few px of the background get alpha from diff
    band = np.asarray(Image.fromarray((bgmask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    alpha = np.ones_like(diff)
    alpha[bgmask] = 0
    edge = band & ~bgmask
    alpha[edge] = np.clip((diff[edge] - lo) / (hi - lo), 0, 1)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(float) / 255
    # decontaminate colours on the edge
    al = np.clip(alpha, 0.05, 1)[..., None]
    col = np.where(alpha[..., None] < 0.999, (a - (1 - al) * bg) / al, a)
    if shadow:
        sh = bgmask & ~(diff < lo)          # shadow pixels reached by the fill
        sa = np.clip((1 - rmean) * 2.2, 0, 0.55)  # lighter-than-floor pixels get 0
        col[sh] = np.array([40, 44, 70])     # navy-tinted shadow
        alpha = np.where(sh, np.maximum(alpha, sa), alpha)
    rgba = np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    im = im.crop((max(bb[0] - pad, 0), max(bb[1] - pad, 0), min(bb[2] + pad, w), min(bb[3] + pad, h)))
    if height and im.height > height:
        im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=86, method=6)
    print(name, im.size)

# Mascot — 4 poses on a lavender gradient
m = load('design/assets/v4/owl-mascot.png')
for name, x0, x1 in [('owl-wave', 0, 699), ('owl-bottle', 699, 1236), ('owl-read', 1236, 1855), ('owl-sleep', 1855, 2688)]:
    cutout(m, (x0, 0, x1, 1520), name, lo=16, hi=40, height=640)

# Mood characters — cream background, labels cropped off
mc = load('design/assets/v4/mood-characters.png')
spans = [(0, 275), (275, 528), (528, 770), (770, 1000), (1000, 1252), (1270, 1505), (1505, 1725), (1725, 2000)]
for (x0, x1), n in zip(spans, ['calm', 'joyful', 'grateful', 'hopeful', 'tired', 'anxious', 'sad', 'irritated']):
    cutout(mc, (x0 * S, 380 * S, x1 * S, 722 * S), 'mood-' + n, lo=12, hi=34, height=280, floor=False)

# Botanicals & product renders — cream background
b = load('design/assets/3d-botanicals-set.png')
for name, box, sh, fl in [('p-dropper', (200, 10, 600, 590), True, True), ('f-rose', (700, 60, 1260, 520), True, True),
                      ('f-mimulus', (1320, 30, 1840, 560), True, True), ('p-salt', (150, 680, 660, 1080), True, False),
                      ('p-spray', (820, 520, 1140, 1100), False, False), ('moon', (1290, 600, 1820, 1100), True, True)]:
    cutout(b, tuple(v * S for v in box), name, lo=12, hi=34, height=560, shadow=sh, floor=fl)

# Category illustrations — keep their white ground (rendered with mix-blend-mode: multiply)
ci = load('design/assets/v4/category-illustrations.png')
cols, rows = [0, 670, 1290, 2000], [0, 560, 1131]
names = [['cat-sleep', 'cat-calm', 'cat-bath'], ['cat-remedies', 'cat-gifts', 'cat-consult']]
for r in range(2):
    for c in range(3):
        im = ci.crop((int(cols[c] * S), int(rows[r] * S), int(cols[c + 1] * S), int(rows[r + 1] * S)))
        im.thumbnail((520, 520), Image.LANCZOS)
        im.save(os.path.join(OUT, names[r][c] + '.webp'), 'WEBP', quality=80, method=6)
        print(names[r][c], im.size)

# Logo mark — navy line art on light grey → alpha from darkness, recolourable
lg = load('design/brand/bewise-logo-holistic-wellness.jpg').crop((232, 78, 772, 618))
g = np.asarray(lg.convert('L')).astype(float)
alpha = np.clip((240 - g) / (240 - 90), 0, 1)
for name, rgb in [('logo-mark', (36, 61, 145)), ('logo-mark-white', (255, 255, 255))]:
    arr = np.zeros(g.shape + (4,), np.uint8); arr[..., :3] = rgb; arr[..., 3] = (alpha * 255).astype(np.uint8)
    Image.fromarray(arr, 'RGBA').resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, name + '.png'), optimize=True)
print('logo ok')

# Consultant photo
p = load('design/assets/people/jitu-bhaiya-square.jpg'); p.thumbnail((480, 480)); p.save(os.path.join(OUT, 'jitu.webp'), 'WEBP', quality=82)
p = load('design/assets/people/jitu-bhaiya-portrait.jpg'); p.thumbnail((720, 1100)); p.save(os.path.join(OUT, 'jitu-portrait.webp'), 'WEBP', quality=80)
print('done')
