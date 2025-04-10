import "./global.css"

export const metadata = {
    title: "F1GPT",
    description: "Ask me anything about volleyball!"
}

const RootLayout = ({children}) => {
    return (
        <html>
            <body lang='en'>{children}</body>
        </html>
    )
}

export default RootLayout;