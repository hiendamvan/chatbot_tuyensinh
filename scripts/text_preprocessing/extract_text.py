import csv
import pdfplumber
from fpdf import FPDF

content = ''
MAX_LINE_LENGTH = 1000  # Giới hạn độ dài tối đa của một dòng

def normalize_header(header):
    """
    Chuẩn hóa tên cột để dễ truy cập (xóa \n, lowercase)
    """
    return [col.replace("\n", " ").strip().lower() for col in header]

def normalize_combined_header(header_rows):
    """
    Gộp nhiều dòng header thành một dòng duy nhất.
    """
    combined=[]
    for i in range(2):
        for j in range(1, len(header_rows[0])):
            if(header_rows[i][j] == None):
                header_rows[i][j] = header_rows[i][j-1]
            if(header_rows[i][j] == 'TT' or header_rows[i][j] == 'STT'):
                header_rows[i][j] = ''
    combined = [str(header_rows[0][i]).strip() + " " + str(header_rows[1][i]).strip() for i in range(len(header_rows[0]))]
    return combined

def row_to_text(row, header):
    """
    Chuyển 1 dòng thành mô tả văn bản dựa trên header
    """
    parts = []
    for col_name, value in zip(header, row):
        value = value.strip() if isinstance(value, str) else str(value)
        if value == '-' or value == '':
            value = "không công bố"
        parts.append(f"{col_name} là {value}")
    return ", ".join(parts) + "."

def table_to_docs(table):
    """
    Nhận vào bảng dạng list of lists → list văn bản
    """
    if any(cell is None for cell in table[0]):
        raw_header = table[0:2]
        rows = table[2:]
        header = normalize_combined_header(raw_header)
    else:
        raw_header = table[0]
        rows = table[1:]
        header = normalize_header(raw_header)

    docs = []
    for row in rows:
        if len(row) != len(header):
            continue
        doc = row_to_text(row, header)
        docs.append(doc)
    return docs

def split_text_by_length(text, max_length=MAX_LINE_LENGTH):
    """
    Hàm này chia nhỏ văn bản thành các đoạn nhỏ hơn theo giới hạn độ dài
    """
    lines = []
    while len(text) > max_length:
        split_point = text.rfind(' ', 0, max_length)  # Cắt tại vị trí có khoảng trắng gần nhất
        if split_point == -1:
            split_point = max_length  # Nếu không tìm thấy, chia ngay tại vị trí max_length
        lines.append(text[:split_point])
        text = text[split_point:].lstrip()  # Cập nhật phần còn lại
    if text:
        lines.append(text)
    return lines

with pdfplumber.open("scripts/data/tuyensinh_fixed.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"Trang {i+1}:")

        # 1. Tìm tất cả bảng và lấy tọa độ (bounding boxes)
        table_bboxes = []
        tables = page.extract_tables()
        for table in page.find_tables():
            table_bboxes.append(table.bbox)

        # 2. Lấy tất cả các dòng chữ
        non_table_words = []
        for word in page.extract_words():
            x0, top, x1, bottom = word["x0"], word["top"], word["x1"], word["bottom"]

            in_table = False
            for (bx0, btop, bx1, bbottom) in table_bboxes:
                if x0 >= bx0 and x1 <= bx1 and top >= btop and bottom <= bbottom:
                    in_table = True
                    break

            if not in_table:
                non_table_words.append(word)

        # 3. Ghép lại thành văn bản (nếu cần)
        text = " ".join(w["text"] for w in non_table_words)
        for line in split_text_by_length(text):  # Chia nhỏ văn bản nếu cần
            content += line + "\n"

        # 4. Xử lý bảng riêng
        for table in tables:
            docs = table_to_docs(table=table)
            for doc in docs:
                for line in split_text_by_length(doc):  # Chia nhỏ văn bản của bảng
                    content += line + "\n"

        content += '\n'

with open("scripts/data/tuyensinh.txt", "w", encoding="utf-8") as f:
    f.write(content)
