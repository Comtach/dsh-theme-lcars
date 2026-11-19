"""Draw the LCARS theme proposal mockup for the DSH window (v2).

Colours are the ones sampled from the reference screenshots:
  status / scan / initiate  #3686ff
  trajectory                #46606d
  distance                  #0947e8
  operations                #8bdbfd
  location                  #d36010
  numerals                  #a09858
Everything is drawn, not screenshotted: this is a design proposal.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"D:\Desktop\GTA ALL\DS House\dsh-theme-lcars\docs\proposal.png")

STATUS = (0x36, 0x86, 0xFF)
TRAJECTORY = (0x46, 0x60, 0x6D)
DISTANCE = (0x09, 0x47, 0xE8)
OPERATIONS = (0x8B, 0xDB, 0xFD)
LOCATION = (0xD3, 0x60, 0x10)
GOLD = (0xA0, 0x98, 0x58)
BLACK = (0x00, 0x00, 0x00)
INK = (0xE6, 0xF0, 0xFF)
INK_DIM = (0xA8, 0xC4, 0xE6)
INK_FAINT = (0x6F, 0x8F, 0xB8)
DEEP = (0x1F, 0x4C, 0x93)
CARD = (0x06, 0x09, 0x0F)
BUBBLE = (0x0D, 0x2B, 0x73)
LINE = (0x1B, 0x3F, 0xA0)
GRID = (0x0A, 0x1A, 0x3A)

FONT_DIR = Path("C:/Windows/Fonts")
LATIN = FONT_DIR / "bahnschrift.ttf"
CJK = FONT_DIR / "msyh.ttc"
CJK_BOLD = FONT_DIR / "msyhbd.ttc"


def font(size, cjk=False, bold=False):
    if cjk:
        for candidate in ((CJK_BOLD if bold else CJK), CJK):
            if candidate.exists():
                return ImageFont.truetype(str(candidate), size)
    for candidate in (LATIN, FONT_DIR / "arial.ttf"):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


W, H = 1400, 860
image = Image.new("RGB", (W, H), BLACK)
draw = ImageDraw.Draw(image)


def block(box, fill, radius=0, left_round=True, outline=None, width=1):
    x0, y0, x1, y1 = box
    if radius <= 0:
        draw.rectangle(box, fill=fill, outline=outline, width=width)
        return
    if left_round:
        draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
        draw.rectangle((x1 - radius, y0, x1, y0 + radius), fill=fill)
        draw.rectangle((x1 - radius, y1 - radius, x1, y1), fill=fill)
        if outline is not None:
            draw.line((x1, y0, x1, y1), fill=outline, width=width)
    else:
        draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
        draw.rectangle((x0, y0, x0 + radius, y0 + radius), fill=fill)
        draw.rectangle((x0, y1 - radius, x0 + radius, y1), fill=fill)


def text(xy, value, size, fill, cjk=False, bold=False, anchor="la"):
    draw.text(xy, value, font=font(size, cjk, bold), fill=fill, anchor=anchor)


def right(x1, y, value, size, fill, cjk=False, bold=False, pad=14):
    text((x1 - pad, y), value, size, fill, cjk, bold, anchor="ra")


def icon(kind, cx, cy, size, colour):
    half = size // 2
    if kind == "plus":
        draw.line((cx - half, cy, cx + half, cy), fill=colour, width=2)
        draw.line((cx, cy - half, cx, cy + half), fill=colour, width=2)
    elif kind == "clock":
        draw.ellipse((cx - half, cy - half, cx + half, cy + half), outline=colour, width=2)
        draw.line((cx, cy, cx, cy - half + 2), fill=colour, width=2)
        draw.line((cx, cy, cx + half - 3, cy + 2), fill=colour, width=2)
    elif kind == "dots":
        for dx in (-4, 4):
            for dy in (-4, 4):
                draw.rectangle((cx + dx - 2, cy + dy - 2, cx + dx + 2, cy + dy + 2), fill=colour)
    elif kind == "folder":
        draw.rectangle((cx - half, cy - half + 2, cx + half, cy + half), outline=colour, width=2)
        draw.line((cx - half, cy - half + 2, cx - half + 5, cy - half - 2), fill=colour, width=2)
        draw.line((cx - half + 5, cy - half - 2, cx - 1, cy - half - 2), fill=colour, width=2)
    elif kind == "user":
        draw.ellipse((cx - 5, cy - half, cx + 5, cy - half + 10), outline=colour, width=2)
        draw.arc((cx - 9, cy, cx + 9, cy + 12), 180, 360, fill=colour, width=2)
    elif kind == "search":
        draw.ellipse((cx - half, cy - half, cx + 3, cy + 3), outline=colour, width=2)
        draw.line((cx + 2, cy + 2, cx + half, cy + half), fill=colour, width=2)
    elif kind == "sliders":
        for i, dx in enumerate((-half, 0, half)):
            draw.line((cx + dx, cy - 5, cx + dx, cy + 5), fill=colour, width=2)
        draw.rectangle((cx - half - 3, cy - 1, cx - half + 3, cy + 2), fill=colour)
        draw.rectangle((cx - 3, cy - 4, cx + 3, cy - 1), fill=colour)
        draw.rectangle((cx + half - 3, cy + 1, cx + half + 3, cy + 4), fill=colour)
    elif kind == "gear":
        draw.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), outline=colour, width=2)
        for dx, dy in ((0, -half), (0, half), (-half, 0), (half, 0)):
            draw.line((cx, cy, cx + dx, cy + dy), fill=colour, width=2)
    elif kind == "people":
        draw.ellipse((cx - 9, cy - 6, cx - 1, cy + 2), outline=colour, width=2)
        draw.ellipse((cx + 1, cy - 4, cx + 7, cy + 2), outline=colour, width=2)
    elif kind == "sound":
        draw.polygon([(cx - half, cy - 2), (cx - 4, cy - 2), (cx + 2, cy - half),
                      (cx + 2, cy + half), (cx - 4, cy + 2), (cx - half, cy + 2)], fill=colour)


# ---------------------------------------------------------------- window frame
draw.rounded_rectangle((14, 14, 1386, 846), radius=14, outline=STATUS, width=2)

# ---------------------------------------------------------------- caption row
CAP_TOP, CAP_BOT = 18, 58
block((20, CAP_TOP, 62, CAP_BOT), STATUS, left_round=False)
for i in range(3):
    draw.ellipse((30 + i * 11, 35, 36 + i * 11, 41), fill=BLACK)
# 应用 / 编辑: their own deeper segment (proposal)
block((64, CAP_TOP, 266, CAP_BOT), DEEP, radius=10, left_round=False)
text((92, 26), "应用", 17, INK, cjk=True)
text((172, 26), "编辑", 17, INK, cjk=True)
block((266, CAP_TOP, 1246, CAP_BOT), STATUS, left_round=False)
for x, glyph in ((1288, "–"), (1318, "□"), (1348, "×")):
    text((x, 25), glyph, 17, INK_DIM)

# ---------------------------------------------------------------- sidebar band
block((18, 62, 350, 844), STATUS)
block((40, 84, 352, 828), BLACK, radius=16)          # content, round on the LEFT
# (block() squares the right side for left_round=True, so the arm stays visible)

BAR_X0, BAR_X1 = 48, 342


def bar(y0, y1, fill, label, *, size=17, fg=None, radius=18, icon_kind=None,
        time=None, time_fill=INK_DIM, cjk=True, bold=False):
    block((BAR_X0, y0, BAR_X1, y1), fill, radius=radius)
    fg = fg or (BLACK if fill in (STATUS, OPERATIONS, LOCATION) else INK)
    ty = y0 + (y1 - y0) // 2
    if icon_kind is not None:
        icon(icon_kind, BAR_X0 + 18, ty, 14, fg)
        text((BAR_X0 + 34, ty - size // 2 - 1), label, size, fg, cjk, bold)
    else:
        text((BAR_X0 + 16, ty - size // 2 - 1), label, size, fg, cjk, bold)
    if time is not None:
        right(BAR_X1, ty - (size - 3) // 2 - 1, time, size - 3, time_fill, cjk=True)


# brand block
bar(92, 134, STATUS, "deepseek  HARNESS", size=19, bold=True)
# new conversation: trajectory slate
bar(146, 186, TRAJECTORY, "新会话", size=17, icon_kind="plus")
# navigation: scan blue
bar(196, 232, STATUS, "插件", icon_kind="plus")
bar(240, 276, STATUS, "自动化任务", icon_kind="clock")
bar(284, 320, STATUS, "更多", icon_kind="dots")

# workspace caption
text((BAR_X0 + 4, 338), "工作区", 15, OPERATIONS, cjk=True)
icon("search", 300, 348, 13, OPERATIONS)
icon("sliders", 326, 348, 13, OPERATIONS)
# workspace row: initiate blue
bar(362, 398, STATUS, "DS House", size=16, icon_kind="folder")

# session rows: distance blue; the current one operations pale
sessions = [
    ("基于 LCARS 制作 DSH 主题插件", "刚刚", True),
    ("查询智能体角色设定人设", "1 小时", False),
    ("简单火箭 2 机翼 G 力爆炸解决", "1 小时", False),
    ("在 SimpleRockets2 中建造物品", "7 天", False),
    ("PSP 游戏汉化成本预测", "7 天", False),
]
y = 408
for label, when, selected in sessions:
    fill = OPERATIONS if selected else DISTANCE
    fg = BLACK if selected else INK
    bar(y, y + 32, fill, label, size=15, fg=fg, radius=14, time=when,
        time_fill=(BLACK if selected else INK_DIM))
    y += 38

text((BAR_X0 + 6, y + 4), "展开其余 7 个会话", 13, INK_FAINT, cjk=True)
bar(y + 26, y + 60, STATUS, "默认工作区", size=16, icon_kind="folder")

# proposal: the empty lower half gets LCARS filler + the stardate readout
FILL_TOP, FILL_BOT = y + 74, 772
block((BAR_X0, FILL_TOP, BAR_X1, FILL_BOT), (0x02, 0x05, 0x0A), radius=10)
inner = (BAR_X1 - BAR_X0) - 28
for i, (ratio, colour) in enumerate(((0.58, DISTANCE), (0.82, OPERATIONS), (0.34, LOCATION))):
    row_y = FILL_TOP + 12 + i * 18
    block((BAR_X0 + 14, row_y, BAR_X0 + 14 + int(inner * ratio), row_y + 10), colour, radius=5)
text((BAR_X0 + 14, FILL_TOP + 70), "STARDATE  41876.3", 14, GOLD)
text((BAR_X0 + 14, FILL_TOP + 92), "LCARS 47 · SUBSYSTEM NOMINAL", 10, INK_FAINT)
for i in range(4):
    block((BAR_X0 + 14 + i * 18, FILL_TOP + 112, BAR_X0 + 26 + i * 18, FILL_TOP + 124), OPERATIONS, radius=6)

# foot block
bar(788, 822, STATUS, "已登录 DeepSeek", size=16, icon_kind="user")

# ---------------------------------------------------------------- main panel
block((352, 62, 1386, 118), DEEP, left_round=False)
block((352, 118, 1386, 121), STATUS, left_round=False)
text((376, 78), "基于 LCARS 制作 DSH 主题插件", 20, INK, cjk=True, bold=True)
icon("gear", 828, 90, 12, INK_DIM)
text((842, 82), "创造模式", 13, INK_DIM, cjk=True)
icon("people", 946, 90, 12, INK_DIM)
text((962, 82), "1 个子智能体", 13, INK_DIM, cjk=True)
for i in range(3):
    draw.ellipse((1312 + i * 11, 84, 1318 + i * 11, 90), fill=INK_DIM)

# faint LCARS grid over the conversation area
for gx in range(400, 1390, 120):
    draw.line((gx, 130, gx, 580), fill=GRID, width=1)
for gy in range(150, 580, 120):
    draw.line((362, gy, 1386, gy), fill=GRID, width=1)

# user bubble
block((900, 146, 1342, 194), BUBBLE, radius=22)
text((922, 160), "把左边栏做成这种彩色块，颜色按参考图来", 15, INK, cjk=True)

# assistant text
for i, line in enumerate([
    "已按参考图取色：状态/扫描蓝 #3686ff、航线灰 #46606d、距离蓝 #0947e8、操作浅蓝",
    "#8bdbfd、位置橙 #d36010，星历数字用金色 #a09858。",
]):
    text((376, 228 + i * 27), line, 16, INK, cjk=True)

# code card with the section variables
block((376, 290, 880, 390), CARD, radius=10, outline=LINE, width=1)
for i, (key, value) in enumerate([
    ("--lcars-side-frame:", " #3686ff;"),
    ("--lcars-side-session:", " #0947e8;"),
    ("--lcars-side-selected:", " #8bdbfd;"),
]):
    text((396, 304 + i * 24), key, 14, OPERATIONS)
    text((620, 304 + i * 24), value, 14, GOLD)

# the proposal list
text((376, 414), "建议改动的四处", 17, OPERATIONS, cjk=True, bold=True)
proposals = [
    "① 左栏下半的空白：用 LCARS 填充块 + 星历读数补满（见左下黑面板）。",
    "② 会话行：右侧等宽时间，选中行浅蓝底黑字，其余深蓝底白字。",
    "③ 输入框：做成 LCARS 面板 —— 左色帽 + 2px 描边 + 右侧圆形提交。",
    "④ 顶部：菜单块（深蓝）/ 长条（亮蓝）/ 窗口按钮区（黑）三段分明。",
]
for i, line in enumerate(proposals):
    text((384, 446 + i * 31), line, 16, INK, cjk=True)

# composer panel
block((376, 604, 1352, 694), CARD, radius=26, outline=STATUS, width=2)
block((378, 622, 386, 676), STATUS, radius=4)
text((410, 622), "发消息或创建任务，/ 调用指令，@ 文件或对话", 15, INK_FAINT, cjk=True)
text((402, 657), "＋", 15, INK_DIM, cjk=True)
icon("sound", 470, 666, 12, INK_DIM)
text((484, 658), "完全权限", 13, INK_DIM, cjk=True)
right(1258, 658, "DeepSeek-V4.1-Flash Max", 12, INK_DIM)
draw.ellipse((1300, 638, 1336, 674), fill=STATUS)
draw.line((1318, 664, 1318, 648), fill=BLACK, width=3)
draw.line((1310, 656, 1318, 648), fill=BLACK, width=3)
draw.line((1326, 656, 1318, 648), fill=BLACK, width=3)

# stardate chip under the composer
CHIP_Y = 710
block((376, CHIP_Y, 388, CHIP_Y + 18), STATUS, radius=9, left_round=False)
block((388, CHIP_Y, 448, CHIP_Y + 18), STATUS, left_round=False)
text((394, CHIP_Y + 3), "LCARS 47", 11, BLACK, bold=True)
text((466, CHIP_Y + 2), "星历 41876.3", 13, GOLD, cjk=True)
text((590, CHIP_Y + 2), "23:12", 13, GOLD)
for i in range(5):
    block((666 + i * 22, CHIP_Y + 3, 678 + i * 22, CHIP_Y + 15), OPERATIONS, radius=6)

# footer note of the mockup itself
text((376, 800), "提案示意图：颜色取自参考截图，图标与文字为示意，不是运行截图", 12, INK_FAINT, cjk=True)

image.save(OUT, "PNG")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
