from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=14)
pdf.cell(200, 10, txt="HomyHive Privacy Policy", ln=True, align='C')
pdf.ln(10)
pdf.set_font("Arial", size=12)
pdf.multi_cell(0, 10, txt="At HomyHive, your privacy is our top priority. We are committed to protecting your personal information and being transparent about how we use it.\n\nInformation We Collect:\n- Account information (name, email, phone number)\n- Listing and booking details\n- Usage data and cookies\n\nHow We Use Your Information:\n- To provide and improve our services\n- To communicate with you about your account and bookings\n- To personalize your experience on HomyHive\n- To comply with legal obligations\n\nSharing Your Information:\n- We do not sell your personal data to third parties.\n- We may share data with trusted partners for service delivery and legal compliance.\n\nYour Choices:\n- You can update or delete your account information at any time.\n- You can opt out of marketing emails.\n- Contact us for any privacy-related concerns.\n\nContact Us:\nIf you have questions about our privacy policy, email us at info@homyhive.com.")
pdf.output("public/static/privacy.pdf")
