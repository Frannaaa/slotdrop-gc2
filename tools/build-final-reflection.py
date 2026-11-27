"""Build the exact two-page Final V2 reflection with installed Times New Roman."""
from pathlib import Path
import json
import os
import re
from html import escape

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak
from pypdf import PdfReader
import pypdfium2 as pdfium

root = Path(__file__).resolve().parents[1]
source = json.loads((root / "docs/SlotDrop_Final_Reflection.source.json").read_text(encoding="utf-8"))
font_dir = Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts"
pdfmetrics.registerFont(TTFont("ReflectionTimes", str(font_dir / "times.ttf")))
pdfmetrics.registerFont(TTFont("ReflectionTimesBold", str(font_dir / "timesbd.ttf")))
assert source["fontSize"] == 10 and source["lineSpacing"] == 1
assert len(source["pages"]) == 2
out = root / "docs/SlotDrop_Final_Reflection.pdf"
evidence = root / "docs/evidence"
evidence.mkdir(exist_ok=True)
body = ParagraphStyle("body", fontName="ReflectionTimes", fontSize=10, leading=10,
                      spaceAfter=7, alignment=TA_JUSTIFY, allowWidows=0, allowOrphans=0)
title = ParagraphStyle("title", parent=body, fontName="ReflectionTimesBold",
                       alignment=TA_CENTER, spaceAfter=7)
subtitle = ParagraphStyle("subtitle", parent=body, alignment=TA_CENTER, spaceAfter=14)

def footer(canvas, document):
    canvas.saveState()
    canvas.setFont("ReflectionTimes", 10)
    canvas.drawString(54, 34, "SlotDrop, Group 1")
    canvas.drawRightString(A4[0] - 54, 34, str(document.page))
    canvas.restoreState()

story = []
for index, paragraphs in enumerate(source["pages"]):
    if index:
        story.append(PageBreak())
    else:
        story.extend([Paragraph(escape(source["title"]), title),
                      Paragraph(escape(source["subtitle"]), subtitle)])
    for text in paragraphs:
        story.append(Paragraph(escape(text), body))
SimpleDocTemplate(str(out), pagesize=A4, leftMargin=54, rightMargin=54,
                  topMargin=48, bottomMargin=50,
                  title=source["title"], author="SlotDrop Group 1").build(
                      story, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(str(out))
assert len(reader.pages) == 2, f"Expected exactly 2 pages, got {len(reader.pages)}"
fonts = set()
sizes = set()
for page in reader.pages:
    for font in page["/Resources"]["/Font"].get_object().values():
        fonts.add(str(font.get_object().get("/BaseFont")))
    def visit(text, cm, tm, font, size):
        if text.strip():
            sizes.add(float(size))
    page.extract_text(visitor_text=visit)
assert sizes == {10.0}, sizes
assert any("TimesNewRoman" in font for font in fonts), fonts
text = "\n".join(page.extract_text() for page in reader.pages)
assert "27 of 64 released seats" in text
rendered = pdfium.PdfDocument(str(out))
for index in range(len(rendered)):
    page = rendered[index]
    bitmap = page.render(scale=1.5)
    bitmap.to_pil().save(evidence / f"reflection-v2-page-{index + 1}.png")
    bitmap.close()
    page.close()
rendered.close()
layout = {"pageCount": len(reader.pages), "pageSize": "A4",
          "fontFamily": "Times New Roman", "fontSizes": sorted(sizes),
          "fonts": sorted(fonts), "bodyLeadingPoints": 10, "lineSpacing": 1,
          "wordCount": len(re.findall(r"\S+", " ".join(sum(source["pages"], [])))),
          "pdfBytes": out.stat().st_size, "visualInspection": "Required after rendering"}
(evidence / "reflection-v2-layout.json").write_text(json.dumps(layout, indent=2) + "\n", encoding="utf-8")
print(json.dumps(layout, indent=2))
