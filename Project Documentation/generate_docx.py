import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

DOC_DIR = 'Project Documentation'
OUTPUT_DOCX = os.path.join(DOC_DIR, 'ITS122P_Group9_Final_Project_Documentation.docx')

# Colors
C_NAVY = RGBColor(11, 37, 69)      # #0B2545
C_GREEN = RGBColor(21, 128, 61)    # #15803D
C_SLATE = RGBColor(30, 41, 59)     # #1E293B
C_MUTED = RGBColor(71, 85, 105)    # #475569

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_docx():
    print("Building DOCX document...")
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)

    # Style default
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = C_SLATE
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Read the markdown file line by line and parse structure
    md_path = os.path.join(DOC_DIR, 'ITS122P_Group9_Final_Project_Documentation.md')
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return
        
        # Determine number of columns
        col_count = max(len(r) for r in table_rows)
        if col_count == 0:
            in_table = False
            table_rows = []
            return
        
        # Filter out separator rows
        cleaned_rows = []
        for r in table_rows:
            if all(cell.strip().replace('-', '').replace(':', '') == '' for cell in r if cell.strip()):
                continue
            cleaned_rows.append(r)
        
        if not cleaned_rows:
            in_table = False
            table_rows = []
            return

        table = doc.add_table(rows=len(cleaned_rows), cols=col_count)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table)

        for row_idx, row_data in enumerate(cleaned_rows):
            is_header = (row_idx == 0)
            row = table.rows[row_idx]
            for col_idx in range(col_count):
                cell_text = row_data[col_idx] if col_idx < len(row_data) else ""
                cell = row.cells[col_idx]
                cell.text = cell_text.strip()
                set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

                # Formatting
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.05
                
                if is_header:
                    set_cell_background(cell, "0B2545")
                    for run in p.runs:
                        run.font.name = 'Calibri'
                        run.font.size = Pt(9.5)
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
                else:
                    if row_idx % 2 == 1:
                        set_cell_background(cell, "FFFFFF")
                    else:
                        set_cell_background(cell, "F8FAFC")
                    for run in p.runs:
                        run.font.name = 'Calibri'
                        run.font.size = Pt(8.5)
                        run.font.color.rgb = C_SLATE

        doc.add_paragraph()  # spacer
        in_table = False
        table_rows = []

    def flush_code():
        nonlocal in_code_block, code_lines
        if not code_lines:
            in_code_block = False
            return
        
        code_text = "".join(code_lines).strip()
        # Create a shaded callout table for code
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.05
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(15, 23, 42)
        
        set_table_borders(tbl, color="CBD5E1", sz="4")
        doc.add_paragraph()
        in_code_block = False
        code_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Handle page breaks
        if '<div style="page-break-after: always;"></div>' in stripped or '\\newpage' in stripped:
            if in_table:
                flush_table()
            if in_code_block:
                flush_code()
            doc.add_page_break()
            i += 1
            continue

        # Handle Code blocks
        if stripped.startswith('```'):
            if in_table:
                flush_table()
            if in_code_block:
                flush_code()
            else:
                in_code_block = True
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Handle Tables
        if stripped.startswith('|') and stripped.endswith('|'):
            in_table = True
            cells = [c for c in stripped.split('|')[1:-1]]
            table_rows.append(cells)
            i += 1
            continue
        elif in_table:
            flush_table()

        # Handle Image embeds: ![caption](relpath)
        if stripped.startswith('![') and '](' in stripped and stripped.endswith(')'):
            alt_text = stripped[2:stripped.find('](')]
            img_path = stripped[stripped.find('](')+2:-1]
            
            # Resolve image path relative to Project Documentation
            full_img_path = os.path.join(DOC_DIR, img_path)
            if not os.path.exists(full_img_path):
                # Try relative from repo root
                full_img_path = os.path.normpath(os.path.join(DOC_DIR, img_path.replace('../', '')))
            if not os.path.exists(full_img_path):
                full_img_path = os.path.abspath(img_path.replace('../', ''))

            if os.path.exists(full_img_path):
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(2)
                try:
                    run = p.add_run()
                    run.add_picture(full_img_path, width=Inches(6.2))
                except Exception as ex:
                    print(f"Warning: Could not add picture {full_img_path}: {ex}")
            else:
                print(f"Warning: Image file not found: {full_img_path}")
            i += 1
            continue

        # Handle Headings
        if stripped.startswith('# '):
            h = doc.add_heading(level=1)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(6)
            h.paragraph_format.keep_with_next = True
            run = h.add_run(stripped[2:])
            run.font.name = 'Calibri'
            run.font.size = Pt(16)
            run.font.bold = True
            run.font.color.rgb = C_NAVY
            i += 1
            continue
        elif stripped.startswith('## '):
            h = doc.add_heading(level=2)
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(4)
            h.paragraph_format.keep_with_next = True
            run = h.add_run(stripped[3:])
            run.font.name = 'Calibri'
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = C_NAVY
            i += 1
            continue
        elif stripped.startswith('### '):
            h = doc.add_heading(level=3)
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(3)
            h.paragraph_format.keep_with_next = True
            run = h.add_run(stripped[4:])
            run.font.name = 'Calibri'
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = C_GREEN
            i += 1
            continue
        elif stripped.startswith('#### '):
            h = doc.add_heading(level=4)
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(2)
            h.paragraph_format.keep_with_next = True
            run = h.add_run(stripped[5:])
            run.font.name = 'Calibri'
            run.font.size = Pt(10.5)
            run.font.bold = True
            run.font.color.rgb = C_SLATE
            i += 1
            continue

        # Handle Blockquotes or callouts
        if stripped.startswith('> '):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(stripped[2:])
            run.font.italic = True
            run.font.color.rgb = C_MUTED
            i += 1
            continue

        # Handle horizontal rules
        if stripped in ('---', '***', '___'):
            # Horizontal divider line via border or small text
            i += 1
            continue

        # Handle Empty lines
        if not stripped:
            i += 1
            continue

        # Handle list items
        if stripped.startswith('* ') or stripped.startswith('- '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            text = stripped[2:]
            _add_formatted_text(p, text)
            i += 1
            continue
        elif stripped.startswith('1. ') or (len(stripped) > 2 and stripped[:2].isdigit() and stripped[2:4] == '. '):
            dot_idx = stripped.find('. ')
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            text = stripped[dot_idx+2:]
            _add_formatted_text(p, text)
            i += 1
            continue

        # Regular Paragraph
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(4)
        
        # Check if it's an italicized figure caption: *Figure X...*
        if stripped.startswith('*Figure ') and stripped.endswith('*'):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(stripped[1:-1])
            run.font.italic = True
            run.font.size = Pt(9)
            run.font.color.rgb = C_MUTED
        else:
            _add_formatted_text(p, stripped)

        i += 1

    if in_table:
        flush_table()
    if in_code_block:
        flush_code()

    doc.save(OUTPUT_DOCX)
    print(f"✅ Successfully compiled DOCX document: {OUTPUT_DOCX} ({os.path.getsize(OUTPUT_DOCX)} bytes)")

def _add_formatted_text(paragraph, text):
    # Simple inline parser for **bold** and *italic* and `code`
    import re
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**') and len(token) >= 4:
            run = paragraph.add_run(token[2:-2])
            run.bold = True
        elif token.startswith('*') and token.endswith('*') and len(token) >= 2:
            run = paragraph.add_run(token[1:-1])
            run.italic = True
        elif token.startswith('`') and token.endswith('`') and len(token) >= 2:
            run = paragraph.add_run(token[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(15, 23, 42)
        else:
            paragraph.add_run(token)

if __name__ == '__main__':
    build_docx()
