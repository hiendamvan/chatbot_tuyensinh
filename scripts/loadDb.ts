import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { pipeline } from "@huggingface/transformers";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

if (
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_COLLECTION ||
  !ASTRA_DB_API_ENDPOINT ||
  !ASTRA_DB_APPLICATION_TOKEN
) {
  throw new Error("Missing required environment variables.");
}

const f1Data = [
  "https://en.wikipedia.org/wiki/FIVB_Women's_Volleyball_Nations_League",
  "https://en.wikipedia.org/wiki/FIVB_Women%27s_Volleyball_World_Championship",
  "https://en.wikipedia.org/wiki/Volleyball_at_the_Summer_Olympics",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 384, // all-MiniLM-L6-v2 trả về vector 384 chiều
      metric: similarityMetric,
    },
  });
  console.log("Collection created", res);
};

const scrapePage = async (url: string) => {
  try {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: { headless: true },
      gotoOptions: { waitUntil: "domcontentloaded" },
      evaluate: async (page, browser) => {
        const result = await page.evaluate(() => document.body.innerHTML);
        await browser.close();
        return result;
      },
    });
    const raw = await loader.scrape();
    return raw?.replace(/<[^>]+>/g, "") || "";
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return "";
  }
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);

  console.log("⏳ Loading embedding model...");
  const generateEmbedding = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  for await (const url of f1Data) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);

    for await (const chunk of chunks) {
      try {
        const output = await generateEmbedding(chunk, {
          pooling: "mean",
          normalize: true,
        });

        const vector = Array.from(output.data); // Convert from TypedArray to number[]

        const res = await collection.insertOne({
          $vector: vector,
          text: chunk,
        });

        console.log("✅ Inserted chunk", res);
      } catch (err) {
        console.error("❌ Embedding error:", err);
      }
    }
  }
};

createCollection().then(() => loadSampleData());
