// Load data into database, scrape the internet for some information 
import { DataAPIClient} from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import OpenAI from "openai"

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import "dotenv/config"
import { load } from "langchain/load"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const { ASTRA_DB_NAMESPACE, 
        ASTRA_DB_COLLECTION, 
        ASTRA_DB_API_ENDPOINT, 
        ASTRA_DB_APPLICATION_TOKEN, 
        OPEN_ROUTER_API_KEY 
} = process.env

//const openai = new OpenAI({apiKey: OPENAI_API_KEY}) 
const openqi =  new OpenAI({
    apiKey: OPEN_ROUTER_API_KEY, // OpenRouter API key
    baseURL: "https://openrouter.ai/api/v1", // OpenRouter API endpoint
}
    
)

const f1Data = [
    "https://en.wikipedia.org/wiki/FIVB_Women's_Volleyball_Nations_League",
    "https://en.wikipedia.org/wiki/FIVB_Women%27s_Volleyball_World_Championship", 
    "https://en.wikipedia.org/wiki/Volleyball_at_the_Summer_Olympics"
]

// connect to client of database 
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {keyspace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize : 512,
    chunkOverlap : 100,
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetric
        }
    })
    console.log("Collection created", res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await (const url of f1Data) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await (const chunk of chunks) {
            // const embedding = await openai.embeddings.create({
            //     model: 'text-embedding-3-small',
            //     input: chunk, 
            //     encoding_format: 'float'
            // })
            // const vector = embedding.data[0].embedding
            const response = await openai.embeddings.create({
                model: "openai/gpt-4o-mini-search-preview",
                input: chunk
            });

            const vector = response.data[0].embedding; // get the embedding vector from the response      
            const res = await collection.insertOne({
                $vector: vector, 
                text: chunk
            })

            console.log("Inserted", res)
        }
    }
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true,
        },
        gotoOptions: {
            waitUntil: "domcontentloaded",
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML) // get all html in body part 
            await browser.close()
            return result
        }

    })
    return (await loader.scrape())?.replace(/<[^>]+>/g, "") // remove html tags, keep plain text only
}

createCollection().then(() => loadSampleData())
