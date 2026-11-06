"""Injekto-log: lokale SVG-/PNG-Icons aus weich gerundetem Vial und Tropfen.

Reproduzierbar mit Python + Pillow (pip install Pillow), ohne Netzwerkzugriff.
Die Geometrie entspricht src/components/Logo.tsx. Maskable-Icons halten alle
Elemente innerhalb der zentralen sicheren Fläche.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "public"
OUT.mkdir(exist_ok=True)
MINT, SAND, BG = "#a8d7bd", "#d9bb8c", "#18271f"

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#18271f"/><g transform="translate(8 8)"><g stroke="#a8d7bd" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="16" y="4" width="16" height="6" rx="1.6"/><path d="M19 10v5m10-5v5"/><path d="M19 15c0 4-8 5-8 12 0 9 4.5 15 13 15s13-6 13-15c0-7-8-8-8-12Z"/></g><path d="M24 22c-2 3.6-5.5 6.2-5.5 9.5a5.5 5.5 0 0 0 11 0C29.5 28.2 26 25.6 24 22Z" fill="#a8d7bd" fill-opacity=".9"/><path d="M21 7h6" stroke="#d9bb8c" stroke-width="1.7" stroke-linecap="round" fill="none"/></g></svg>"""
(OUT / "icon.svg").write_text(SVG, encoding="utf-8")


def cubic(a, b, c, d, steps=50):
    result = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        result.append(tuple(u**3*a[j] + 3*u*u*t*b[j] + 3*u*t*t*c[j] + t**3*d[j] for j in (0, 1)))
    return result


def icon(size, maskable=False):
    im = Image.new("RGB", (1024, 1024), BG)
    draw = ImageDraw.Draw(im)
    scale = .87 if maskable else 1

    def point(p):
        return tuple(round(512 + ((v + 8) - 32) * 16 * scale) for v in p)

    def box(b):
        return (*point(b[:2]), *point(b[2:]))

    def line(points, color=MINT, width=2.2):
        coords = [point(p) for p in points]
        w = round(width * 16 * scale)
        draw.line(coords, fill=color, width=w, joint="curve")
        radius = w / 2
        for x, y in (coords[0], coords[-1]):
            draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)

    draw.rounded_rectangle(box((16, 4, 32, 10)), radius=round(1.6*16*scale), outline=MINT, width=round(2.2*16*scale))
    line([(19, 10), (19, 15)])
    line([(29, 10), (29, 15)])
    body = cubic((19,15), (19,19), (11,20), (11,27))
    body += cubic((11,27), (11,36), (15.5,42), (24,42))
    body += cubic((24,42), (32.5,42), (37,36), (37,27))
    body += cubic((37,27), (37,20), (29,19), (29,15))
    line(body + [(19,15)])
    drop = cubic((24,22), (22,25.6), (18.5,28.2), (18.5,31.5))
    drop += cubic((18.5,31.5), (18.5,38.83), (29.5,38.83), (29.5,31.5))
    drop += cubic((29.5,31.5), (29.5,28.2), (26,25.6), (24,22))
    draw.polygon([point(p) for p in drop], fill=MINT)
    line([(21,7), (27,7)], SAND, 1.7)
    return im.resize((size, size), Image.Resampling.LANCZOS)


for name, size, maskable in [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-maskable.png", 512, True),
    ("apple-touch-icon.png", 180, False),
]:
    icon(size, maskable).save(OUT / name)
print("Injekto-log: SVG und vier lokale PNG-Icons erstellt.")
