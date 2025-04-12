# F1GPT Chatbot

A chatbot powered by OpenRouter and Astra DB. This app allows you to embed text and query it via a web interface.

## 🚀 Getting Started

Follow these steps to run the app locally:

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Set Up Environment Variables

In the root directory `F1GPT_CHATBOT`, create a `.env` file and add the following keys:

```env
ASTRA_DB_NAMESPACE=your_namespace
ASTRA_DB_COLLECTION=your_collection
ASTRA_DB_API_ENDPOINT=your_api_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_application_token
OPEN_ROUTER_API_KEY=your_openrouter_api_key
```

### 3️⃣ Seed the Database

To embed your text and store it in the Astra database, run:

```bash
npm run seed
```

> Make sure the embedding logic is correctly set up in `loadDb.tsx`.

### 4️⃣ Run the App

Start the development server:

```bash
npm run dev
```

Then open your browser and go to [http://localhost:3000/](http://localhost:3000/) to use the chatbot.

---

