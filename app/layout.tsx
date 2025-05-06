import "./styles/index.css";

export const metadata = {
  title: "Tư vấn tuyển sinh UET",
  description: "Ask me anything about University of Engineering and Technology, VietNam National University HaNoi",
};

const RootLayout = ({ children }) => {
  return (
    <html>
      <body lang="en">{children}</body>
    </html>
  );
};

export default RootLayout;
