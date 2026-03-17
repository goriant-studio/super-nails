from __future__ import annotations

import json
import math
import random
import re
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[2]
BOOTSTRAP_PATH = ROOT / "client" / "public" / "api" / "bootstrap.json"
OUTPUT_DIR = ROOT / "client" / "public" / "images" / "services"

WIDTH = 1100
HEIGHT = 800
SIZE = (WIDTH, HEIGHT)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def hex_to_rgb(hex_value: str) -> tuple[int, int, int]:
    hex_value = hex_value.lstrip("#")
    return tuple(int(hex_value[index:index + 2], 16) for index in (0, 2, 4))


def rgba(hex_value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    return (*hex_to_rgb(hex_value), alpha)


def mix_channel(start: int, end: int, factor: float) -> int:
    return int(start + (end - start) * factor)


def mix_color(
    start: tuple[int, int, int, int],
    end: tuple[int, int, int, int],
    factor: float,
) -> tuple[int, int, int, int]:
    return tuple(mix_channel(start[index], end[index], factor) for index in range(4))


def vertical_gradient(size: tuple[int, int], stops: list[tuple[float, str]]) -> Image.Image:
    width, height = size
    image = Image.new("RGBA", size)
    draw = ImageDraw.Draw(image)
    parsed = [(stop, rgba(color)) for stop, color in stops]

    for y in range(height):
        position = y / max(height - 1, 1)
        lower = parsed[0]
        upper = parsed[-1]

        for index in range(len(parsed) - 1):
            left = parsed[index]
            right = parsed[index + 1]
            if left[0] <= position <= right[0]:
                lower = left
                upper = right
                break

        if upper[0] == lower[0]:
            factor = 0
        else:
            factor = (position - lower[0]) / (upper[0] - lower[0])

        color = mix_color(lower[1], upper[1], factor)
        draw.line((0, y, width, y), fill=color)

    return image


def alpha_composite(base: Image.Image, overlay: Image.Image) -> None:
    base.alpha_composite(overlay)


def add_soft_ellipse(
    base: Image.Image,
    bounds: tuple[int, int, int, int],
    color: tuple[int, int, int, int],
    blur: int,
) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse(bounds, fill=color)
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    alpha_composite(base, layer)


def add_soft_round_rect(
    base: Image.Image,
    bounds: tuple[int, int, int, int],
    fill: tuple[int, int, int, int],
    outline: tuple[int, int, int, int] | None = None,
    width: int = 0,
    radius: int = 42,
    blur: int = 0,
) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle(bounds, radius=radius, fill=fill, outline=outline, width=width)
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    alpha_composite(base, layer)


def add_satin_fold(
    base: Image.Image,
    seed: random.Random,
    palette: list[str],
    opacity: int = 40,
) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for index in range(12):
        start_y = int((index / 12) * HEIGHT) - 80
        points = []
        for x in range(-120, WIDTH + 121, 80):
            wave = math.sin((x / 140) + (index * 0.6) + seed.random() * 0.8)
            y = start_y + wave * 34 + seed.randint(-10, 10)
            points.append((x, y))
        points.extend([(WIDTH + 120, HEIGHT + 80), (-120, HEIGHT + 80)])
        draw.polygon(points, fill=rgba(palette[index % len(palette)], opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(18))
    alpha_composite(base, layer)


def add_marble_veins(base: Image.Image, seed: random.Random, palette: list[str]) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for index in range(10):
        color = rgba(palette[index % len(palette)], 70 if index % 2 == 0 else 38)
        points = []
        start_y = seed.randint(-20, HEIGHT // 2)
        for x in range(-120, WIDTH + 120, 60):
            drift = math.sin((x / 130) + seed.random() * 2.5 + index) * seed.randint(12, 42)
            points.append((x, start_y + drift + (x * 0.28)))
        draw.line(points, fill=color, width=seed.randint(2, 6))
    layer = layer.filter(ImageFilter.GaussianBlur(1.6))
    alpha_composite(base, layer)


def add_metal_ribbons(base: Image.Image, seed: random.Random, palette: list[str]) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for index in range(7):
        points = []
        offset = seed.randint(-120, 160)
        amplitude = seed.randint(24, 72)
        for x in range(-80, WIDTH + 81, 40):
            y = HEIGHT * 0.2 + offset + math.sin((x / 110) + index * 0.8) * amplitude
            points.append((x, y))
        draw.line(points, fill=rgba(palette[index % len(palette)], 80), width=seed.randint(8, 18))
    layer = layer.filter(ImageFilter.GaussianBlur(14))
    alpha_composite(base, layer)


def add_steam(base: Image.Image, seed: random.Random, colors: list[str]) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for index in range(18):
        x = seed.randint(-100, WIDTH + 100)
        top = seed.randint(40, HEIGHT - 200)
        bottom = top + seed.randint(160, 320)
        color = rgba(colors[index % len(colors)], seed.randint(20, 44))
        points = []
        for y in range(top, bottom, 30):
            sway = math.sin((y / 60) + index) * seed.randint(10, 34)
            points.append((x + sway, y))
        draw.line(points, fill=color, width=seed.randint(18, 32))
    layer = layer.filter(ImageFilter.GaussianBlur(26))
    alpha_composite(base, layer)


def add_grain(base: Image.Image, strength: float = 0.13) -> None:
    noise = Image.effect_noise(base.size, 18).convert("L")
    noise = ImageEnhance.Contrast(noise).enhance(1.8)
    alpha = noise.point(lambda value: int(clamp(value * strength, 0, 35)))
    grain = Image.new("RGBA", base.size, (255, 245, 232, 0))
    grain.putalpha(alpha)
    alpha_composite(base, grain)


def add_vignette(base: Image.Image, opacity: int = 72) -> None:
    mask = Image.new("L", base.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((-120, -80, WIDTH + 120, HEIGHT + 100), fill=255)
    mask = ImageOps.invert(mask).filter(ImageFilter.GaussianBlur(120))
    shadow = Image.new("RGBA", base.size, (14, 10, 18, opacity))
    shadow.putalpha(mask)
    alpha_composite(base, shadow)


def add_panel(base: Image.Image, color: str, accent: str) -> None:
    add_soft_round_rect(base, (80, 74, WIDTH - 86, HEIGHT - 92), rgba(color, 54), rgba(accent, 72), 2, radius=56, blur=10)
    add_soft_round_rect(base, (116, 108, WIDTH - 130, HEIGHT - 124), rgba("#FFFFFF", 18), None, 0, radius=48, blur=16)


def draw_pearl_cluster(
    size: tuple[int, int],
    origin: tuple[int, int],
    count: int,
    spacing: int,
    base_color: str = "#F5EBDD",
    highlight: str = "#FFFDF8",
) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for index in range(count):
        x = origin[0] + index * spacing
        y = origin[1] + int(math.sin(index * 0.7) * 8)
        radius = 22 + (index % 2) * 5
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=rgba(base_color, 218))
        draw.ellipse((x - radius + 9, y - radius + 7, x, y), fill=rgba(highlight, 172))
    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    return layer


def draw_sparkles(size: tuple[int, int], positions: list[tuple[int, int]], color: str) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for x, y in positions:
        draw.line((x, y - 24, x, y + 24), fill=rgba(color, 180), width=4)
        draw.line((x - 24, y, x + 24, y), fill=rgba(color, 180), width=4)
        draw.line((x - 14, y - 14, x + 14, y + 14), fill=rgba(color, 120), width=2)
        draw.line((x - 14, y + 14, x + 14, y - 14), fill=rgba(color, 120), width=2)
    return layer.filter(ImageFilter.GaussianBlur(1))


def create_skin_fill(size: tuple[int, int], top: str, middle: str, bottom: str) -> Image.Image:
    return vertical_gradient(size, [(0.0, top), (0.46, middle), (1.0, bottom)])


def create_nail_tip(
    width: int,
    height: int,
    colors: tuple[str, str, str],
    *,
    chrome: bool = False,
    french_tip: bool = False,
    aura: bool = False,
    jelly: bool = False,
    gems: bool = False,
    cat_eye: bool = False,
) -> Image.Image:
    size = (width + 120, height + 140)
    mask = Image.new("L", size, 0)
    draw_mask = ImageDraw.Draw(mask)
    left = 60
    top = 34
    draw_mask.rounded_rectangle((left, top, left + width, top + height), radius=width // 2, fill=255)

    nail = Image.new("RGBA", size, (0, 0, 0, 0))
    fill = vertical_gradient(size, [(0.0, colors[0]), (0.55, colors[1]), (1.0, colors[2])])
    nail.paste(fill, mask=mask)

    sheen = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheen)
    draw.rounded_rectangle(
        (left + 12, top + 14, left + int(width * 0.34), top + int(height * 0.74)),
        radius=max((width // 2) - 18, 14),
        fill=rgba("#FFFFFF", 74 if jelly else 88),
    )
    draw.rounded_rectangle(
        (left + int(width * 0.58), top + int(height * 0.12), left + width - 12, top + int(height * 0.36)),
        radius=20,
        fill=rgba("#FFFFFF", 28),
    )
    sheen = sheen.filter(ImageFilter.GaussianBlur(10))
    alpha_composite(nail, sheen)

    if french_tip:
        tip = Image.new("RGBA", size, (0, 0, 0, 0))
        ImageDraw.Draw(tip).rounded_rectangle(
            (left + 6, top + 12, left + width - 6, top + int(height * 0.22)),
            radius=max((width // 2) - 12, 12),
            fill=rgba("#FFF8F2", 232),
        )
        alpha_composite(nail, tip)

    if aura:
        add_soft_ellipse(nail, (left - 10, top + 34, left + width + 10, top + height - 26), rgba("#FFD5F2", 96), 16)
        add_soft_ellipse(nail, (left + 12, top + 74, left + width - 12, top + height - 48), rgba("#FFF1C8", 62), 14)

    if chrome:
        chrome_layer = Image.new("RGBA", size, (0, 0, 0, 0))
        chrome_draw = ImageDraw.Draw(chrome_layer)
        chrome_draw.line((left + 18, top + int(height * 0.1), left + width - 14, top + int(height * 0.9)), fill=rgba("#F8FBFF", 168), width=20)
        chrome_draw.line((left + 10, top + int(height * 0.2), left + width - 24, top + int(height * 0.7)), fill=rgba("#BFD1FF", 120), width=12)
        chrome_layer = chrome_layer.filter(ImageFilter.GaussianBlur(10))
        alpha_composite(nail, chrome_layer)

    if cat_eye:
        cat_eye_layer = Image.new("RGBA", size, (0, 0, 0, 0))
        cat_eye_draw = ImageDraw.Draw(cat_eye_layer)
        cat_eye_draw.line((left + int(width * 0.2), top + height - 40, left + int(width * 0.82), top + 40), fill=rgba("#FFF5EA", 180), width=14)
        cat_eye_layer = cat_eye_layer.filter(ImageFilter.GaussianBlur(12))
        alpha_composite(nail, cat_eye_layer)

    if jelly:
        tint = Image.new("RGBA", size, rgba("#FFFFFF", 0))
        tint.putalpha(mask.point(lambda value: int(value * 0.22)))
        alpha_composite(nail, tint)

    if gems:
        gem_layer = Image.new("RGBA", size, (0, 0, 0, 0))
        gem_draw = ImageDraw.Draw(gem_layer)
        gem_draw.ellipse((left + width - 40, top + 26, left + width - 14, top + 52), fill=rgba("#FFFDF8", 230))
        gem_draw.ellipse((left + width - 66, top + 62, left + width - 38, top + 90), fill=rgba("#F4D88A", 196))
        gem_layer = gem_layer.filter(ImageFilter.GaussianBlur(1))
        alpha_composite(nail, gem_layer)

    outline = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(outline).rounded_rectangle(
        (left, top, left + width, top + height),
        radius=width // 2,
        outline=rgba("#FFF9F2", 86),
        width=3,
    )
    alpha_composite(nail, outline)
    return nail


def render_manicure_set(
    nail_colors: tuple[str, str, str],
    center: tuple[int, int],
    scale: float,
    *,
    chrome: bool = False,
    french_tip: bool = False,
    aura: bool = False,
    jelly: bool = False,
    gems: bool = False,
    cat_eye: bool = False,
) -> Image.Image:
    layer_size = (880, 760)
    layer = Image.new("RGBA", layer_size, (0, 0, 0, 0))

    pedestal = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_pedestal = ImageDraw.Draw(pedestal)
    draw_pedestal.rounded_rectangle((250, 498, 638, 614), radius=56, fill=rgba("#FFF8F0", 56), outline=rgba("#FFF9F2", 80), width=3)
    draw_pedestal.rounded_rectangle((306, 528, 580, 606), radius=40, fill=rgba("#CDAE76", 28))
    pedestal = pedestal.filter(ImageFilter.GaussianBlur(8))
    alpha_composite(layer, pedestal)

    specs = [
        {"x": 126, "y": 182, "w": 108, "h": 354, "angle": -22, "color": nail_colors[0]},
        {"x": 258, "y": 108, "w": 112, "h": 388, "angle": -10, "color": nail_colors[1]},
        {"x": 404, "y": 88, "w": 116, "h": 402, "angle": 3, "color": nail_colors[2]},
        {"x": 548, "y": 118, "w": 110, "h": 382, "angle": 12, "color": nail_colors[0]},
        {"x": 676, "y": 184, "w": 102, "h": 340, "angle": 24, "color": nail_colors[1]},
    ]

    for index, spec in enumerate(specs):
        tip = create_nail_tip(
            spec["w"],
            spec["h"],
            (spec["color"], nail_colors[(index + 1) % 3], nail_colors[(index + 2) % 3]),
            chrome=chrome,
            french_tip=french_tip and index in {1, 2, 3},
            aura=aura and index in {1, 2, 3},
            jelly=jelly,
            gems=gems and index in {1, 3},
            cat_eye=cat_eye and index in {0, 2, 4},
        ).rotate(spec["angle"], resample=Image.Resampling.BICUBIC, expand=True)
        shadow = tip.copy()
        shadow = ImageEnhance.Brightness(shadow).enhance(0.34)
        alpha = shadow.getchannel("A")
        shadow.putalpha(alpha.point(lambda value: int(value * 0.56)))
        layer.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)), (spec["x"] + 16, spec["y"] + 26))
        layer.alpha_composite(tip, (spec["x"], spec["y"]))

    clamp_bar = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_clamp = ImageDraw.Draw(clamp_bar)
    draw_clamp.rounded_rectangle((310, 524, 584, 564), radius=20, fill=rgba("#FFFDF6", 104))
    draw_clamp.rounded_rectangle((356, 548, 538, 580), radius=16, fill=rgba("#D2BC93", 54))
    clamp_bar = clamp_bar.filter(ImageFilter.GaussianBlur(3))
    alpha_composite(layer, clamp_bar)

    final = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    resized = layer.resize((int(layer.size[0] * scale), int(layer.size[1] * scale)), Image.Resampling.LANCZOS)
    x = int(center[0] - resized.size[0] / 2)
    y = int(center[1] - resized.size[1] / 2)
    final.alpha_composite(resized, (x, y))
    return final


def render_pedicure_stilllife(
    nail_colors: tuple[str, str, str],
    center: tuple[int, int],
    scale: float,
    *,
    stones: bool = False,
    steam: bool = False,
    herbal: bool = False,
) -> Image.Image:
    layer_size = (920, 760)
    layer = Image.new("RGBA", layer_size, (0, 0, 0, 0))

    bowl = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_bowl = ImageDraw.Draw(bowl)
    draw_bowl.ellipse((172, 344, 756, 708), fill=rgba("#FFF8F0", 62), outline=rgba("#FFF8F0", 88), width=4)
    draw_bowl.ellipse((224, 406, 704, 684), fill=rgba("#A48C66", 24))
    draw_bowl.ellipse((250, 442, 676, 654), fill=rgba("#FFFFFF", 24))
    bowl = bowl.filter(ImageFilter.GaussianBlur(8))
    alpha_composite(layer, bowl)

    toe_specs = [
        {"x": 262, "y": 182, "w": 106, "h": 206, "angle": -8, "color": nail_colors[0]},
        {"x": 362, "y": 150, "w": 116, "h": 220, "angle": -4, "color": nail_colors[1]},
        {"x": 476, "y": 160, "w": 110, "h": 214, "angle": 4, "color": nail_colors[2]},
        {"x": 584, "y": 202, "w": 96, "h": 188, "angle": 10, "color": nail_colors[0]},
        {"x": 666, "y": 246, "w": 82, "h": 160, "angle": 14, "color": nail_colors[1]},
    ]
    for index, spec in enumerate(toe_specs):
        toe = create_nail_tip(
            spec["w"],
            spec["h"],
            (spec["color"], nail_colors[(index + 1) % 3], nail_colors[(index + 2) % 3]),
            jelly=index in {1, 2},
        ).rotate(spec["angle"], resample=Image.Resampling.BICUBIC, expand=True)
        shadow = toe.copy()
        shadow = ImageEnhance.Brightness(shadow).enhance(0.32)
        alpha = shadow.getchannel("A")
        shadow.putalpha(alpha.point(lambda value: int(value * 0.54)))
        layer.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(16)), (spec["x"] + 10, spec["y"] + 22))
        layer.alpha_composite(toe, (spec["x"], spec["y"]))

    separator = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_separator = ImageDraw.Draw(separator)
    draw_separator.rounded_rectangle((242, 476, 708, 548), radius=36, fill=rgba("#FFF2D8", 60))
    for x in [326, 414, 502, 590]:
        draw_separator.ellipse((x, 448, x + 80, 536), fill=rgba("#FFF6E9", 88))
    separator = separator.filter(ImageFilter.GaussianBlur(4))
    alpha_composite(layer, separator)

    if stones:
        stones_layer = Image.new("RGBA", layer_size, (0, 0, 0, 0))
        draw_stones = ImageDraw.Draw(stones_layer)
        for bounds, color in [
            ((136, 226, 224, 298), "#2E2723"),
            ((160, 290, 254, 372), "#40342D"),
            ((710, 232, 818, 316), "#594638"),
        ]:
            draw_stones.ellipse(bounds, fill=rgba(color, 224))
            draw_stones.ellipse((bounds[0] + 10, bounds[1] + 8, bounds[2] - 24, bounds[1] + 32), fill=rgba("#FFFFFF", 46))
        stones_layer = stones_layer.filter(ImageFilter.GaussianBlur(0.8))
        alpha_composite(layer, stones_layer)

    if herbal:
        leaves = Image.new("RGBA", layer_size, (0, 0, 0, 0))
        draw_leaves = ImageDraw.Draw(leaves)
        for path in [
            [(132, 220), (170, 168), (202, 242)],
            [(728, 166), (774, 124), (788, 208)],
            [(770, 244), (818, 212), (830, 304)],
        ]:
            draw_leaves.polygon(path, fill=rgba("#99B588", 188))
            draw_leaves.line([path[0], path[1]], fill=rgba("#628060", 192), width=4)
            draw_leaves.line([path[1], path[2]], fill=rgba("#628060", 192), width=4)
        leaves = leaves.filter(ImageFilter.GaussianBlur(1.2))
        alpha_composite(layer, leaves)

    if steam:
        steam_layer = Image.new("RGBA", layer_size, (0, 0, 0, 0))
        draw_steam = ImageDraw.Draw(steam_layer)
        for index in range(8):
            start_x = 276 + index * 54
            points = []
            for offset in range(0, 260, 22):
                sway = math.sin((offset / 44) + index * 0.7) * 18
                points.append((start_x + sway, 442 - offset))
            draw_steam.line(points, fill=rgba("#FFF7EF", 38), width=18)
        steam_layer = steam_layer.filter(ImageFilter.GaussianBlur(22))
        alpha_composite(layer, steam_layer)

    final = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    resized = layer.resize((int(layer.size[0] * scale), int(layer.size[1] * scale)), Image.Resampling.LANCZOS)
    x = int(center[0] - resized.size[0] / 2)
    y = int(center[1] - resized.size[1] / 2)
    final.alpha_composite(resized, (x, y))
    return final


def render_hand(
    nail_colors: tuple[str, str, str],
    skin_colors: tuple[str, str, str],
    rotation: float,
    center: tuple[int, int],
    scale: float,
    thumb: bool = True,
    ring: bool = False,
    ring_color: str = "#D8B46A",
    french_tip: bool = False,
    aura: bool = False,
    chrome: bool = False,
    glitter: bool = False,
) -> Image.Image:
    layer_size = (700, 760)
    mask = Image.new("L", layer_size, 0)
    draw_mask = ImageDraw.Draw(mask)

    palm_box = (200, 282, 496, 632)
    wrist = [(238, 620), (438, 620), (514, 758), (148, 758)]
    draw_mask.polygon(wrist, fill=255)
    draw_mask.rounded_rectangle(palm_box, radius=118, fill=255)

    fingers = [
        {"x": 174, "top": 102, "w": 74, "h": 320},
        {"x": 254, "top": 54, "w": 84, "h": 354},
        {"x": 348, "top": 84, "w": 76, "h": 326},
        {"x": 428, "top": 148, "w": 68, "h": 272},
    ]
    for finger in fingers:
        draw_mask.rounded_rectangle(
            (finger["x"], finger["top"], finger["x"] + finger["w"], finger["top"] + finger["h"]),
            radius=finger["w"] // 2,
            fill=255,
        )

    if thumb:
        thumb_mask = Image.new("L", layer_size, 0)
        thumb_draw = ImageDraw.Draw(thumb_mask)
        thumb_draw.rounded_rectangle((82, 320, 244, 420), radius=52, fill=255)
        thumb_mask = thumb_mask.rotate(-32, resample=Image.Resampling.BICUBIC, center=(162, 370))
        mask = ImageChops.screen(mask, thumb_mask)

    hand = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    skin_fill = create_skin_fill(layer_size, *skin_colors)
    hand.paste(skin_fill, mask=mask)

    shadow = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    shadow.paste(rgba("#3A2430", 88), (26, 34), mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    hand = Image.alpha_composite(shadow, hand)

    interior = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_interior = ImageDraw.Draw(interior)
    for finger in fingers:
        x0 = finger["x"] + 8
        x1 = finger["x"] + finger["w"] - 8
        draw_interior.rectangle((x0, finger["top"] + 76, x1, finger["top"] + finger["h"]), fill=rgba("#FFFFFF", 14))
    interior = interior.filter(ImageFilter.GaussianBlur(18))
    alpha_composite(hand, interior)

    nail_layer = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_nail = ImageDraw.Draw(nail_layer)
    nail_specs = [
        (186, 78, 58, 112),
        (266, 28, 68, 136),
        (360, 60, 62, 122),
        (440, 126, 54, 100),
    ]
    for index, (x, top, width, height) in enumerate(nail_specs):
        draw_nail.rounded_rectangle(
            (x, top, x + width, top + height),
            radius=width // 2,
            fill=rgba(nail_colors[index % 3], 255),
        )
        if french_tip:
            draw_nail.rounded_rectangle(
                (x + 4, top + 6, x + width - 4, top + 42),
                radius=(width // 2) - 6,
                fill=rgba("#FFF8F1", 222),
            )
        if chrome:
            draw_nail.rectangle((x + 10, top + 10, x + width - 10, top + height - 14), fill=rgba("#F5F6FF", 70))
        if aura:
            add_soft_ellipse(nail_layer, (x - 10, top + 18, x + width + 10, top + height + 20), rgba("#FFD6F0", 72), 16)
        if glitter:
            draw_nail.ellipse((x + width - 22, top + 16, x + width - 8, top + 30), fill=rgba("#FFF5E6", 170))
        draw_nail.rounded_rectangle(
            (x + 7, top + 10, x + width - 22, top + 48),
            radius=max((width // 2) - 10, 8),
            fill=rgba("#FFFFFF", 78),
        )
    if thumb:
        thumb_box = (112, 260, 188, 334)
        draw_nail.rounded_rectangle(thumb_box, radius=34, fill=rgba(nail_colors[1], 255))
        draw_nail.rounded_rectangle((thumb_box[0] + 8, thumb_box[1] + 8, thumb_box[2] - 24, thumb_box[1] + 38), radius=18, fill=rgba("#FFFFFF", 78))

    nail_layer = nail_layer.filter(ImageFilter.GaussianBlur(0.4))
    alpha_composite(hand, nail_layer)

    sheen = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_sheen = ImageDraw.Draw(sheen)
    draw_sheen.arc((110, 90, 540, 470), start=206, end=326, fill=rgba("#FFFFFF", 66), width=10)
    draw_sheen.arc((254, 106, 604, 510), start=180, end=286, fill=rgba("#FFFFFF", 48), width=8)
    draw_sheen.line((228, 626, 430, 690), fill=rgba("#FFFFFF", 30), width=12)
    sheen = sheen.filter(ImageFilter.GaussianBlur(7))
    alpha_composite(hand, sheen)

    if ring:
        ring_layer = Image.new("RGBA", layer_size, (0, 0, 0, 0))
        ring_draw = ImageDraw.Draw(ring_layer)
        ring_draw.ellipse((380, 284, 438, 338), outline=rgba(ring_color, 255), width=10)
        ring_draw.ellipse((398, 300, 420, 320), fill=rgba("#FFF9EE", 190))
        ring_layer = ring_layer.filter(ImageFilter.GaussianBlur(0.4))
        alpha_composite(hand, ring_layer)

    rotated = hand.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
    final = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    x = int(center[0] - rotated.size[0] * scale / 2)
    y = int(center[1] - rotated.size[1] * scale / 2)
    resized = rotated.resize((int(rotated.size[0] * scale), int(rotated.size[1] * scale)), Image.Resampling.LANCZOS)

    shadow_layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    shadow_crop = resized.copy().convert("RGBA")
    shadow_crop = ImageEnhance.Brightness(shadow_crop).enhance(0.42)
    shadow_mask = shadow_crop.getchannel("A")
    shadow_crop.putalpha(shadow_mask.point(lambda value: int(value * 0.42)))
    shadow_layer.alpha_composite(shadow_crop.filter(ImageFilter.GaussianBlur(18)), (x + 24, y + 28))
    final.alpha_composite(shadow_layer)
    final.alpha_composite(resized, (x, y))
    return final


def render_foot(
    nail_colors: tuple[str, str, str],
    skin_colors: tuple[str, str, str],
    center: tuple[int, int],
    scale: float,
    steam: bool = False,
    bowl: bool = True,
) -> Image.Image:
    layer_size = (760, 700)
    mask = Image.new("L", layer_size, 0)
    draw_mask = ImageDraw.Draw(mask)

    draw_mask.ellipse((162, 158, 562, 602), fill=255)
    draw_mask.rounded_rectangle((258, 200, 612, 636), radius=170, fill=255)
    toes = [
        (198, 124, 84, 96),
        (286, 90, 76, 88),
        (366, 104, 70, 82),
        (436, 126, 62, 76),
        (496, 160, 56, 66),
    ]
    for x, y, w, h in toes:
        draw_mask.ellipse((x, y, x + w, y + h), fill=255)

    foot = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    foot.paste(create_skin_fill(layer_size, *skin_colors), mask=mask)

    shadow = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    shadow.paste(rgba("#291E1D", 90), (22, 26), mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    foot = Image.alpha_composite(shadow, foot)

    nail_layer = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_nail = ImageDraw.Draw(nail_layer)
    for index, (x, y, w, h) in enumerate(toes):
        draw_nail.rounded_rectangle((x + 8, y + 8, x + w - 8, y + int(h * 0.76)), radius=max((w // 2) - 8, 10), fill=rgba(nail_colors[index % 3], 255))
        draw_nail.rounded_rectangle((x + 14, y + 16, x + int(w * 0.5), y + 40), radius=16, fill=rgba("#FFFFFF", 70))
    nail_layer = nail_layer.filter(ImageFilter.GaussianBlur(0.4))
    alpha_composite(foot, nail_layer)

    sheen = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    draw_sheen = ImageDraw.Draw(sheen)
    draw_sheen.arc((112, 120, 590, 520), start=190, end=302, fill=rgba("#FFFFFF", 54), width=12)
    draw_sheen.line((298, 574, 510, 616), fill=rgba("#FFFFFF", 24), width=14)
    sheen = sheen.filter(ImageFilter.GaussianBlur(7))
    alpha_composite(foot, sheen)

    if bowl:
        bowl_layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw_bowl = ImageDraw.Draw(bowl_layer)
        draw_bowl.ellipse((160, 474, 946, 778), fill=rgba("#FFF9EF", 40), outline=rgba("#FFF9EF", 92), width=4)
        draw_bowl.ellipse((240, 532, 864, 760), fill=rgba("#B7975F", 14))
        bowl_layer = bowl_layer.filter(ImageFilter.GaussianBlur(6))
    else:
        bowl_layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))

    final = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    final.alpha_composite(bowl_layer)

    resized = foot.resize((int(foot.size[0] * scale), int(foot.size[1] * scale)), Image.Resampling.LANCZOS)
    x = int(center[0] - resized.size[0] / 2)
    y = int(center[1] - resized.size[1] / 2)

    foot_shadow = resized.copy()
    foot_shadow = ImageEnhance.Brightness(foot_shadow).enhance(0.32)
    alpha = foot_shadow.getchannel("A")
    foot_shadow.putalpha(alpha.point(lambda value: int(value * 0.5)))
    final.alpha_composite(foot_shadow.filter(ImageFilter.GaussianBlur(18)), (x + 18, y + 24))
    final.alpha_composite(resized, (x, y))

    if steam:
        steam_layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw_steam = ImageDraw.Draw(steam_layer)
        for index in range(8):
            sx = 324 + index * 52
            points = []
            for offset in range(0, 240, 24):
                sway = math.sin((offset / 46) + index * 0.7) * 14
                points.append((sx + sway, 440 - offset))
            draw_steam.line(points, fill=rgba("#FFF6EB", 44), width=18)
        steam_layer = steam_layer.filter(ImageFilter.GaussianBlur(20))
        alpha_composite(final, steam_layer)

    return final


@dataclass(frozen=True)
class ArtConfig:
    background: list[tuple[float, str]]
    panel: str
    accent: str
    material: str
    subject: str
    nails: tuple[str, str, str]
    skin: tuple[str, str, str]
    extra: str


ART_CONFIG: dict[int, ArtConfig] = {
    1: ArtConfig(
        background=[(0.0, "#0B1737"), (0.48, "#1E3F7A"), (1.0, "#88A5D9")],
        panel="#10204A",
        accent="#B6C9F6",
        material="glass",
        subject="hand",
        nails=("#E6C8C9", "#F2E9E1", "#B9D4FF"),
        skin=("#F8D7C7", "#F0BDA8", "#CB8E78"),
        extra="polish",
    ),
    2: ArtConfig(
        background=[(0.0, "#3E1736"), (0.52, "#8C3C6B"), (1.0, "#F4B6AE")],
        panel="#5B224E",
        accent="#FFD5E8",
        material="velvet",
        subject="hand",
        nails=("#F2C7DA", "#FFD9E2", "#FFF0D8"),
        skin=("#F5D4C4", "#EFB79F", "#C88672"),
        extra="mask",
    ),
    3: ArtConfig(
        background=[(0.0, "#10281D"), (0.48, "#234C38"), (1.0, "#AA8B58")],
        panel="#173528",
        accent="#E2C784",
        material="satin",
        subject="hand",
        nails=("#F2E4D5", "#C8B39D", "#E5D08E"),
        skin=("#F5D0BC", "#E6AD8F", "#B97C64"),
        extra="ribbon",
    ),
    4: ArtConfig(
        background=[(0.0, "#776042"), (0.48, "#E8D1AF"), (1.0, "#F8F1E4")],
        panel="#A98F6D",
        accent="#FFF7EC",
        material="marble",
        subject="hand",
        nails=("#F9F5F1", "#E5D5C2", "#EEDFD7"),
        skin=("#F4D0BB", "#E7B293", "#B67D67"),
        extra="tool",
    ),
    5: ArtConfig(
        background=[(0.0, "#8A6A3F"), (0.5, "#DDBE8F"), (1.0, "#FFF7E9")],
        panel="#AF8E58",
        accent="#FFF8EF",
        material="marble",
        subject="hand",
        nails=("#FFFDFC", "#FAE7DE", "#F4DCC3"),
        skin=("#F5D2C1", "#E8B59A", "#B7816B"),
        extra="french",
    ),
    6: ArtConfig(
        background=[(0.0, "#130F3B"), (0.52, "#4D3AA6"), (1.0, "#9DA9F5")],
        panel="#211A53",
        accent="#DADFFF",
        material="chrome",
        subject="hand",
        nails=("#778DFF", "#A7B0FF", "#D7D7FF"),
        skin=("#F3CFBF", "#E4AA93", "#B87463"),
        extra="galaxy",
    ),
    7: ArtConfig(
        background=[(0.0, "#6F5320"), (0.52, "#C7A064"), (1.0, "#FFF8EF")],
        panel="#8A6A34",
        accent="#FFF7F1",
        material="marble",
        subject="hand",
        nails=("#F8E1E8", "#FFF6F1", "#E7C578"),
        skin=("#F5D4C3", "#EAB498", "#C1816A"),
        extra="bridal",
    ),
    8: ArtConfig(
        background=[(0.0, "#0D453F"), (0.5, "#47897E"), (1.0, "#D4CCB3")],
        panel="#0F4F48",
        accent="#D8EEE5",
        material="steam",
        subject="foot",
        nails=("#F4F1EA", "#E0C6B2", "#E7D6A8"),
        skin=("#F1C9B1", "#E1AA8D", "#AF755F"),
        extra="refresh",
    ),
    9: ArtConfig(
        background=[(0.0, "#4B3521"), (0.52, "#A37B48"), (1.0, "#F6EAD3")],
        panel="#6C4C2B",
        accent="#FFF5DE",
        material="steam",
        subject="foot",
        nails=("#F4E1D7", "#EAD3BB", "#FFF7E6"),
        skin=("#EFC4AB", "#DBA182", "#A86B52"),
        extra="stones",
    ),
    10: ArtConfig(
        background=[(0.0, "#6A2740"), (0.5, "#BF6E85"), (1.0, "#F5D8D0")],
        panel="#7E3350",
        accent="#FFDCE5",
        material="satin",
        subject="hand",
        nails=("#F6DAD9", "#F2EAE5", "#FFE2D1"),
        skin=("#F5D0BE", "#E7B092", "#B87562"),
        extra="serum",
    ),
    11: ArtConfig(
        background=[(0.0, "#5A1636"), (0.5, "#A64265"), (1.0, "#F6B7AA")],
        panel="#742347",
        accent="#FFD4E1",
        material="velvet",
        subject="hand",
        nails=("#F26C99", "#FF8EB3", "#FFC7D3"),
        skin=("#F5D1BF", "#E5AC92", "#B77162"),
        extra="velvet",
    ),
    12: ArtConfig(
        background=[(0.0, "#655340"), (0.48, "#CCB092"), (1.0, "#F7EFE4")],
        panel="#7E684F",
        accent="#FFF9EF",
        material="satin",
        subject="hand",
        nails=("#E9D8C8", "#F3E7D8", "#D9C3AF"),
        skin=("#F0CCB9", "#DFA689", "#A96F58"),
        extra="minimal",
    ),
    13: ArtConfig(
        background=[(0.0, "#0E214C"), (0.46, "#244D92"), (1.0, "#9AB7FF")],
        panel="#132B5F",
        accent="#DCE4FF",
        material="chrome",
        subject="hand",
        nails=("#DFE6FF", "#C2D3FF", "#FAFCFF"),
        skin=("#F1CEBE", "#E2AA90", "#B56F61"),
        extra="mirror",
    ),
    14: ArtConfig(
        background=[(0.0, "#23154B"), (0.48, "#7B5CCB"), (1.0, "#F6B2D2")],
        panel="#331C6A",
        accent="#EDD7FF",
        material="glass",
        subject="hand",
        nails=("#F6B3D8", "#FFD2EB", "#F5EBFF"),
        skin=("#F4CFC0", "#E4A98D", "#B87162"),
        extra="aura",
    ),
    15: ArtConfig(
        background=[(0.0, "#123528"), (0.5, "#2D684F"), (1.0, "#9BB28A")],
        panel="#184737",
        accent="#DDE7D4",
        material="steam",
        subject="foot",
        nails=("#E9D8BE", "#F3EAD7", "#D2B68D"),
        skin=("#EFC2A6", "#D99C7A", "#A6654E"),
        extra="herbal",
    ),
    16: ArtConfig(
        background=[(0.0, "#4E311C"), (0.48, "#A47A4C"), (1.0, "#F4E0C4")],
        panel="#634226",
        accent="#FCEFD4",
        material="steam",
        subject="handfoot",
        nails=("#F1D8CE", "#F6EADA", "#DABB83"),
        skin=("#F0CAB1", "#DEA181", "#A96851"),
        extra="collagen",
    ),
}


def add_background_material(base: Image.Image, config: ArtConfig, seed: random.Random) -> None:
    if config.material == "velvet":
        add_satin_fold(base, seed, [config.panel, config.accent, "#FFFFFF"], opacity=36)
    elif config.material == "marble":
        add_marble_veins(base, seed, [config.accent, "#FFFFFF", config.panel])
    elif config.material == "chrome":
        add_metal_ribbons(base, seed, [config.accent, "#FFFFFF", "#C8D8FF"])
    elif config.material == "steam":
        add_steam(base, seed, [config.accent, "#FFF5EA", "#FFFFFF"])
    elif config.material == "satin":
        add_satin_fold(base, seed, [config.accent, "#F5E3D5", config.panel], opacity=30)
    else:
        add_soft_ellipse(base, (84, 120, 678, 564), rgba(config.accent, 44), 40)
        add_soft_ellipse(base, (440, 60, 1020, 460), rgba("#FFFFFF", 28), 54)


def draw_service_specific_details(base: Image.Image, config: ArtConfig, service_id: int) -> None:
    if config.extra == "polish":
        bottle = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(bottle)
        draw.rounded_rectangle((832, 158, 936, 308), radius=18, fill=rgba("#E6F0FF", 138))
        draw.rounded_rectangle((858, 112, 908, 168), radius=14, fill=rgba("#101A36", 220))
        draw.rounded_rectangle((850, 180, 918, 288), radius=20, fill=rgba("#8BA8D8", 185))
        bottle = bottle.filter(ImageFilter.GaussianBlur(1.2))
        alpha_composite(base, bottle)
    elif config.extra == "mask":
        add_soft_ellipse(base, (734, 438, 1012, 654), rgba("#FFF1D8", 86), 22)
        add_soft_ellipse(base, (744, 458, 1002, 684), rgba("#FFE7F0", 54), 28)
    elif config.extra == "ribbon":
        ribbon = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(ribbon)
        draw.line((784, 194, 964, 362), fill=rgba("#D5BB78", 150), width=30)
        draw.line((960, 192, 772, 380), fill=rgba("#FFF6D7", 94), width=12)
        ribbon = ribbon.filter(ImageFilter.GaussianBlur(2.2))
        alpha_composite(base, ribbon)
    elif config.extra == "tool":
        tool = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(tool)
        draw.rounded_rectangle((810, 166, 904, 196), radius=15, fill=rgba("#DDD7CF", 210))
        draw.rounded_rectangle((874, 156, 922, 208), radius=12, fill=rgba("#9D8A7C", 220))
        draw.arc((748, 226, 908, 428), start=308, end=26, fill=rgba("#FFFDF7", 120), width=8)
        tool = tool.filter(ImageFilter.GaussianBlur(0.8))
        alpha_composite(base, tool)
    elif config.extra == "french":
        alpha_composite(base, draw_pearl_cluster(SIZE, (752, 218), 5, 50))
    elif config.extra == "galaxy":
        alpha_composite(base, draw_sparkles(SIZE, [(840, 182), (944, 262), (774, 328)], "#E8EEFF"))
        add_soft_ellipse(base, (740, 156, 1022, 442), rgba("#A8B3FF", 58), 34)
    elif config.extra == "bridal":
        alpha_composite(base, draw_pearl_cluster(SIZE, (724, 176), 6, 44, base_color="#F7EFE8", highlight="#FFFFFF"))
        alpha_composite(base, draw_sparkles(SIZE, [(918, 206), (818, 298), (982, 332)], "#FFF7E7"))
    elif config.extra == "refresh":
        add_soft_ellipse(base, (134, 532, 380, 748), rgba("#D8F3E9", 56), 18)
        alpha_composite(base, draw_sparkles(SIZE, [(824, 226), (894, 276)], "#E7FFF8"))
    elif config.extra == "stones":
        stones = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(stones)
        for bounds, color in [
            ((772, 194, 866, 272), "#2C241E"),
            ((856, 238, 952, 324), "#43352C"),
            ((724, 276, 824, 360), "#594335"),
        ]:
            draw.ellipse(bounds, fill=rgba(color, 220))
            draw.ellipse((bounds[0] + 10, bounds[1] + 10, bounds[2] - 22, bounds[1] + 34), fill=rgba("#FFFFFF", 54))
        stones = stones.filter(ImageFilter.GaussianBlur(0.4))
        alpha_composite(base, stones)
    elif config.extra == "serum":
        serum = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(serum)
        draw.rounded_rectangle((814, 164, 930, 354), radius=26, fill=rgba("#FCEADF", 130))
        draw.rounded_rectangle((842, 120, 900, 190), radius=18, fill=rgba("#B65D75", 210))
        draw.ellipse((780, 386, 880, 496), fill=rgba("#FFD7D3", 120))
        serum = serum.filter(ImageFilter.GaussianBlur(1.2))
        alpha_composite(base, serum)
    elif config.extra == "velvet":
        add_soft_ellipse(base, (754, 170, 1020, 458), rgba("#FFB9CF", 52), 24)
        alpha_composite(base, draw_pearl_cluster(SIZE, (748, 466), 4, 58, base_color="#F3C8D9"))
    elif config.extra == "minimal":
        add_soft_round_rect(base, (742, 162, 992, 472), rgba("#FFFFFF", 22), rgba("#FFF9EF", 88), 2, radius=46, blur=8)
    elif config.extra == "mirror":
        mirror = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(mirror)
        draw.line((758, 140, 968, 352), fill=rgba("#EDF3FF", 140), width=28)
        draw.line((948, 136, 742, 366), fill=rgba("#BFD3FF", 96), width=18)
        mirror = mirror.filter(ImageFilter.GaussianBlur(6))
        alpha_composite(base, mirror)
    elif config.extra == "aura":
        add_soft_ellipse(base, (720, 156, 1018, 468), rgba("#FFD2EE", 72), 36)
        add_soft_ellipse(base, (770, 196, 980, 416), rgba("#FFF1C8", 52), 28)
    elif config.extra == "herbal":
        herbs = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(herbs)
        for path in [
            [(804, 174), (844, 204), (828, 244)],
            [(884, 210), (924, 244), (902, 288)],
            [(778, 252), (818, 290), (786, 334)],
        ]:
            draw.polygon(path, fill=rgba("#9EB88A", 180))
            draw.line([path[0], path[1]], fill=rgba("#6D845C", 210), width=4)
            draw.line([path[1], path[2]], fill=rgba("#6D845C", 210), width=4)
        herbs = herbs.filter(ImageFilter.GaussianBlur(0.8))
        alpha_composite(base, herbs)
    elif config.extra == "collagen":
        alpha_composite(base, draw_pearl_cluster(SIZE, (728, 204), 5, 52, base_color="#F1E7DA", highlight="#FFFFFF"))
        add_soft_ellipse(base, (704, 436, 1018, 666), rgba("#FFF4E6", 46), 28)


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def render_image_for_service(service: dict[str, object]) -> tuple[Image.Image, str]:
    service_id = int(service["id"])
    config = ART_CONFIG[service_id]
    seed = random.Random(service_id * 1187)

    image = vertical_gradient(SIZE, config.background)
    add_soft_ellipse(image, (-140, -120, 520, 380), rgba(config.accent, 42), 54)
    add_soft_ellipse(image, (482, 34, 1180, 562), rgba("#FFFFFF", 26), 80)
    add_background_material(image, config, seed)
    add_panel(image, config.panel, config.accent)

    if service_id in {8, 9, 15}:
        pedicure = render_pedicure_stilllife(
            config.nails,
            center=(548, 458),
            scale=0.92,
            stones=service_id == 9,
            steam=service_id in {9, 15},
            herbal=service_id == 15,
        )
        alpha_composite(image, pedicure)
    elif service_id == 16:
        manicure = render_manicure_set(config.nails, center=(396, 386), scale=0.7, gems=True)
        pedicure = render_pedicure_stilllife(config.nails, center=(792, 520), scale=0.52, steam=True)
        alpha_composite(image, pedicure)
        alpha_composite(image, manicure)
    else:
        manicure = render_manicure_set(
            config.nails,
            center=(522, 432),
            scale=0.94,
            chrome=service_id in {6, 13},
            french_tip=service_id == 5,
            aura=service_id == 14,
            jelly=service_id in {11, 14},
            gems=service_id in {7, 16},
            cat_eye=service_id == 6,
        )
        alpha_composite(image, manicure)

    draw_service_specific_details(image, config, service_id)
    add_soft_ellipse(image, (0, 520, WIDTH, HEIGHT + 120), rgba("#0F0C16", 34), 90)
    add_grain(image)
    add_vignette(image, opacity=68)

    filename = f"luxury-{service_id:02d}-{slugify(str(service['nameEn']))}.png"
    return image, filename


def generate_contact_sheet(paths: list[Path]) -> None:
    thumb_width = 250
    thumb_height = 182
    sheet = Image.new("RGB", (thumb_width * 4 + 90, thumb_height * 4 + 110), "#0E0B16")
    draw = ImageDraw.Draw(sheet)
    draw.rounded_rectangle((20, 20, sheet.width - 20, sheet.height - 20), radius=36, outline="#E5D6B5", width=3)

    for index, path in enumerate(paths):
        image = Image.open(path).convert("RGB").resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        column = index % 4
        row = index // 4
        x = 34 + column * (thumb_width + 10)
        y = 34 + row * (thumb_height + 12)
        sheet.paste(image, (x, y))
    sheet.save(OUTPUT_DIR / "luxury-service-collection.png", optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = json.loads(BOOTSTRAP_PATH.read_text())
    services = payload["services"]
    generated_paths: list[Path] = []

    for service in services:
        image, filename = render_image_for_service(service)
        path = OUTPUT_DIR / filename
        image.save(path, optimize=True, compress_level=9)
        webp_path = path.with_suffix(".webp")
        image.save(webp_path, format="WEBP", quality=90, method=6)
        generated_paths.append(path)
        print(f"Generated {path.relative_to(ROOT)}")
        print(f"Generated {webp_path.relative_to(ROOT)}")

    generate_contact_sheet(generated_paths)
    print(f"Generated {OUTPUT_DIR.relative_to(ROOT) / 'luxury-service-collection.png'}")


if __name__ == "__main__":
    main()
