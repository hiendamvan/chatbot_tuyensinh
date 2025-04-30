import OpenAI from "openai";
import { streamText } from "ai";
import { openai as aiSDKOpenAI } from "@ai-sdk/openai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { StatusCodes } from "http-status-codes";

// export const runtime = "edge";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

if (
  !ASTRA_DB_APPLICATION_TOKEN ||
  !ASTRA_DB_API_ENDPOINT ||
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_COLLECTION
) {
  throw new Error("Missing required environment variables for Astra DB");
}

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
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

    let docContext = "";

    // embedding
    const embedding = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    // find similar in db
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);

      const cursor = collection.find(null, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
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

      const result = streamText({
        model: aiSDKOpenAI("gpt-4"),
        messages: [template, ...messages],
        system:
          "You are a helpful AI assistant specializing in volleyball knowledge.",
      });

      return result.toDataStreamResponse();
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
