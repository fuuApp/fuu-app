from PIL import Image, ImageDraw, ImageFont
import math, os

SIZE = 400
OUT = "/sessions/epic-sleepy-lovelace/mnt/outputs"

def rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    x0,y0,x1,y1 = xy
    draw.rounded_rectangle([x0,y0,x1,y1], radius=radius, fill=fill, outline=outline, width=width)

# ── A案：コーヒーカップ（ローズピンク地） ──────────────────────
img = Image.new("RGBA", (SIZE,SIZE), (0,0,0,0))
draw = ImageDraw.Draw(img)
# 背景
rounded_rect(draw, [0,0,SIZE,SIZE], 80, "#E91E63")
# カップ本体（白）
draw.rounded_rectangle([120,180,280,310], radius=16, fill="white")
# カップ底皿
draw.ellipse([100,300,300,330], fill="white")
# 取っ手（白ドーナツ）
draw.arc([265,200,320,280], start=-90, end=90, fill="white", width=18)
# 湯気 x3
for ox,oy in [(-30,0),(0,0),(30,0)]:
    for i in range(3):
        x = 170+ox + i*40
        y0s = 145
        draw.arc([x-8, y0s-20*i, x+8, y0s-20*i+20], start=0, end=180, fill="white", width=5)
        draw.arc([x-8, y0s-20*i+10, x+8, y0s-20*i+30], start=180, end=360, fill="white", width=5)
# ラベル
draw.text((SIZE//2, 340), "ふぅ", fill="white", anchor="mm",
          font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32))
img.save(f"{OUT}/icon_a.png")
print("A done")

# ── B案：タンポポ（クリーム地） ───────────────────────────────
img = Image.new("RGBA", (SIZE,SIZE), (0,0,0,0))
draw = ImageDraw.Draw(img)
rounded_rect(draw, [0,0,SIZE,SIZE], 80, "#FFF9C4")
cx,cy = SIZE//2, SIZE//2-20
# 花びら（楕円 12枚・黄色）
for i in range(12):
    ang = math.radians(i*30)
    ex = cx + int(60*math.cos(ang))
    ey = cy + int(60*math.sin(ang))
    draw.ellipse([ex-18,ey-10,ex+18,ey+10], fill="#FFC107")
# 中心円
draw.ellipse([cx-25,cy-25,cx+25,cy+25], fill="#FF8F00")
# 茎
draw.line([(cx,cy+25),(cx,cy+130)], fill="#4CAF50", width=10)
# 葉（左）
draw.chord([cx-70,cy+60,cx+10,cy+110], start=0, end=180, fill="#66BB6A")
# ラベル
draw.text((SIZE//2, 350), "ふぅ", fill="#E91E63", anchor="mm",
          font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36))
img.save(f"{OUT}/icon_b.png")
print("B done")

# ── C案：夜空・星（ネイビー地） ───────────────────────────────
img = Image.new("RGBA", (SIZE,SIZE), (0,0,0,0))
draw = ImageDraw.Draw(img)
rounded_rect(draw, [0,0,SIZE,SIZE], 80, "#1A237E")
# 月（クレッセント）
draw.ellipse([130,60,270,200], fill="#FFF176")
draw.ellipse([160,50,290,180], fill="#1A237E")  # 欠け部分
# 星 散らし
import random
random.seed(42)
for _ in range(25):
    sx = random.randint(20, SIZE-20)
    sy = random.randint(20, SIZE-20)
    r = random.randint(2,5)
    draw.ellipse([sx-r,sy-r,sx+r,sy+r], fill="white")
# 大きめ星 5つ
for sx,sy in [(80,80),(320,60),(60,280),(350,200),(200,300)]:
    draw.ellipse([sx-5,sy-5,sx+5,sy+5], fill="#FFF176")
# 「ふぅ」テキスト（やわらかいピンク）
draw.text((SIZE//2, 320), "ふぅ", fill="#F48FB1", anchor="mm",
          font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40))
# サブテキスト
draw.text((SIZE//2, 365), "fuu", fill="#90CAF9", anchor="mm",
          font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22))
img.save(f"{OUT}/icon_c.png")
print("C done")

# ── D案：筆記体F（白地） ──────────────────────────────────────
img = Image.new("RGBA", (SIZE,SIZE), (0,0,0,0))
draw = ImageDraw.Draw(img)
rounded_rect(draw, [0,0,SIZE,SIZE], 80, "#FCE4EC")
# 外円（ピンクリング）
draw.ellipse([30,30,370,370], outline="#E91E63", width=14)
# 大文字 F（太・ピンク）風の手描き
# 縦棒
draw.rounded_rectangle([140,100,175,300], radius=8, fill="#E91E63")
# 上横棒
draw.rounded_rectangle([140,100,270,135], radius=8, fill="#E91E63")
# 中横棒
draw.rounded_rectangle([140,185,250,220], radius=8, fill="#E91E63")
# 装飾カーブ（底）
draw.arc([100,260,210,330], start=90, end=270, fill="#F48FB1", width=10)
# ラベル
draw.text((SIZE//2, 340), "fuu  ふぅ", fill="#AD1457", anchor="mm",
          font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22))
img.save(f"{OUT}/icon_d.png")
print("D done")
print("All icons generated.")
