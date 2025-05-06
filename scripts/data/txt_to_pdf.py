from fpdf import FPDF

# Hàm nhận diện loại dòng
def detect_line_type(line: str) -> str:
    line = line.strip()
    if line == "":
        return "empty"
    elif line.lower().startswith(("i.", "ii.", "iii.", "iv.")):
        return "heading1"
    elif line.lower().startswith(("1 .", "2 .", "3 .", "4 .", "5 .", "6 .", "7 .")):
        return "heading2"
    elif "tuyển_sinh" in line.lower() or "đề_án" in line.lower():
        return "title"
    return "text"

# Tạo PDF
pdf = FPDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()
pdf.add_font("Arial", "", "arial.ttf", uni=True)
pdf.set_font("Arial", size=12)

# Đọc nội dung file txt
with open("scripts/data/tuyensinh_clean.txt", "r", encoding="utf-8") as file:
    for line in file:
        line = line.strip()
        line_type = detect_line_type(line)

        if line_type == "empty":
            pdf.ln(5)
        elif line_type == "title":
            pdf.set_font("Arial", "B", 14)
            pdf.multi_cell(0, 10, line.upper(), align="C")
            pdf.ln(2)
        elif line_type == "heading1":
            pdf.set_font("Arial", "B", 13)
            pdf.multi_cell(0, 9, line)
            pdf.ln(1)
        elif line_type == "heading2":
            pdf.set_font("Arial", "B", 12)
            pdf.multi_cell(0, 8, line)
        else:
            pdf.set_font("Arial", "", 12)
            pdf.multi_cell(0, 8, line)

# Lưu PDF
pdf.output("scripts/data/tuyensinh_clean_formatted.pdf")
