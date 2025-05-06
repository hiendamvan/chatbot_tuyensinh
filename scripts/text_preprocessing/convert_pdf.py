from pypdf import PdfReader, PdfWriter

reader = PdfReader("scripts/data/tuyensinh.pdf")
writer = PdfWriter()
for page in reader.pages:
    # Nếu không có CropBox thì đặt bằng MediaBox
    if "/CropBox" not in page:
        page.cropbox = page.mediabox
    writer.add_page(page)

with open("scripts/data/tuyensinh_fixed.pdf", "wb") as f:
    writer.write(f)
