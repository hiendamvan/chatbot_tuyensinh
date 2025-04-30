import { DataAPIClient } from "@datastax/astra-db-ts";
import { pipeline } from "@huggingface/transformers";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { StatusCodes } from "http-status-codes";

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

const openrouter = createOpenRouter({
  apiKey: OPEN_ROUTER_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

let generateEmbedding: any;

async function getEmbeddingPipeline() {
  if (!generateEmbedding) {
    generateEmbedding = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
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

    let docContext = "";

    // embedding
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(latestMessage, {
      pooling: "mean",
      normalize: true,
    });

    const vector: number[] = Array.from(output.data); // Convert from TypedArray to number[]

    // find similar in db
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
      docContext = JSON.stringify(docsMap);

      const template = {
        role: "system",
        content: `You are an AI assistant who know everything about volleyball. 
                Use the context given below to augment what you know about volleyball. 
                The context will give you the most recent information about volleyball from wikipedia.
                If the context doesn't include the information, you need to answer based on your 
                existing knowledge and don't mention the source of the information or what the 
                context does or does not include. 
                Format answer using markdown where applicable and don't return images. 
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
