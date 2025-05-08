import { DataAPIClient } from "@datastax/astra-db-ts";
import { pipeline } from "@huggingface/transformers";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { StatusCodes } from "http-status-codes";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import fs from "fs";
import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CohereRerank } from "@langchain/cohere"

// TODO: reranking, add more data 
const data = fs.readFileSync(
  "D:/giao trinh dai hoc/KI 6/Du an/f1gpt_chatbot/scripts/data/tuyensinh_clean.txt",
  "utf8"
);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const chunks = await splitter.splitText(data);

const documents = chunks.map((chunk) => ({
  pageContent: chunk,
  metadata: {},
}));

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPEN_ROUTER_API_KEY,
} = process.env;

if (
  !ASTRA_DB_APPLICATION_TOKEN ||
  !ASTRA_DB_API_ENDPOINT ||
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_COLLECTION ||
  !OPEN_ROUTER_API_KEY
) {
  throw new Error("Missing required environment variables");
}

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

let generateEmbedding: any;

async function getEmbeddingPipeline() {
  if (!generateEmbedding) {
    generateEmbedding = await pipeline(
      "feature-extraction",
      "intfloat/multilingual-e5-small"
    );
  }
  return generateEmbedding;
}

export async function POST(req: Request) {
  try {
    const { messages, openRouterKey, openRouterModel } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Invalid messages format", {
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      return new Response("No message content found", {
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // Use custom API key if provided, otherwise use environment variable
    const apiKey = openRouterKey || OPEN_ROUTER_API_KEY;

    // Use the selected model or default to gpt-4o-mini
    const model = openRouterModel || "gpt-4o-mini";

    // Create a new openrouter instance with the provided key
    const customOpenRouter = createOpenRouter({
      apiKey,
    });

    // keywords search: BM25
    const keywordsRetriever = BM25Retriever.fromDocuments(documents, { k: 5 });

    // embedding
    const vectorRetriever = await getEmbeddingPipeline();
    const output = await vectorRetriever(latestMessage, {
      pooling: "mean",
      normalize: true,
    });

    const vector: number[] = Array.from(output.data); // Convert from TypedArray to number[]

    // vectorRetriever: find similar in db
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);

      const cursor = collection.find(null, {
        sort: {
          $vector: vector,
        },
        limit: 5,
      });

      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      const vectorContext = JSON.stringify(docsMap);

      // keywordsRetriever
      const docKeywords = await keywordsRetriever.invoke(latestMessage);
      const bm25Context = docKeywords.map((doc) => doc.pageContent).join("\n");

      const documentsForRerank = [
        ...bm25Context.split("\n"),
        ...JSON.parse(vectorContext)
      ];

      //TODO: reranking
      const cohereRerank = new CohereRerank({
        apiKey: process.env.COHERE_API_KEY, 
        model: 'rerank-v3.5',
      })

      const rerankedDocument = await cohereRerank.rerank(documentsForRerank, latestMessage,{
          topN:5
      })

      const indexes = rerankedDocument.map(item=>item.index)
      const docContext = indexes.map(index=> documentsForRerank[index])
      console.log(docContext)
      const template = {
        role: "system",
        content: `
          Bạn là một trợ lý ảo thông minh, am hiểu toàn diện về công tác tuyển sinh của Trường Đại học Công nghệ, 
          Đại học Quốc gia Hà Nội.

          Hãy sử dụng phần ngữ cảnh bên dưới để bổ sung thông tin nếu cần thiết. Ngữ cảnh này có thể chứa thông tin 
          mới nhất về tuyển sinh từ các tài liệu chính thức. Nếu ngữ cảnh không có thông tin liên quan, bạn cần trả lời dựa trên kiến thức sẵn có, 
          **không đề cập đến việc có hay không có ngữ cảnh**.

          Hãy trả lời ngắn gọn, chính xác, thân thiện và dễ hiểu. Sử dụng định dạng markdown nếu cần thiết (ví dụ: tiêu đề, danh sách). 
          Không đưa hình ảnh trong câu trả lời.

          -------------
          START CONTEXT
          ${docContext}
          END CONTEXT
          -------------
          QUESTION: ${latestMessage}
          -------------
          `,
      };

      const response = streamText({
        model: customOpenRouter(model),
        messages: [template, ...messages],
        temperature: 0.7,
        maxTokens: 512,
      });
      console.log("Response: ", response);
      return response.toDataStreamResponse();
    } catch (error) {
      console.error("Error in querying db:", error);
      return new Response("Error processing database query", {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response("Internal server error", {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
}
