import { DataAPIClient } from "@datastax/astra-db-ts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { pipeline } from "@huggingface/transformers";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

// 1. Load env
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

// 2. File đầu vào (có thể là .txt hoặc .pdf)
const listFiles = ["data/tuyensinh.txt"];

// 3. Kết nối Astra DB
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

// 4. Tách văn bản thành đoạn nhỏ
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

// 5. Tạo collection Astra (nếu chưa có)
const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
      dimension: 384, // paraphrase-multilingual-MiniLM-L12-v2 cũng trả về 384 chiều
      metric: similarityMetric,
    },
  });
  console.log("✅ Collection created:", res);
};

// 6. Đọc file .txt hoặc .pdf
const readFileContent = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === ".pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } else if (ext === ".txt") {
      return fs.readFileSync(filePath, "utf8");
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error);
    return "";
  }
};

// 7. Tải embedding model và index dữ liệu
const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);

  console.log("⏳ Loading embedding model...");
  const generateEmbedding = await pipeline(
    "feature-extraction",
    "Xenova/paraphrase-multilingual-MiniLM-L12-v2" // ✅ Mô hình tiếng Việt tốt hơn
  );

  for await (const filePath of listFiles) {
    const content = await readFileContent(filePath);
    if (!content.trim()) {
      console.warn(`⚠️ No content in ${filePath}, skipping...`);
      continue;
    }

    const chunks = await splitter.splitText(content);

    for await (const chunk of chunks) {
      try {
        const output = await generateEmbedding(chunk, {
          pooling: "mean",
          normalize: true,
        });

        const vector = Array.from(output.data);

        const res = await collection.insertOne({
          $vector: vector,
          text: chunk,
        });

        console.log("✅ Inserted chunk:", res);
      } catch (err) {
        console.error("❌ Embedding error:", err);
      }
    }
  }
};

createCollection().then(() => loadSampleData());