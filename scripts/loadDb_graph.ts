import fs from 'fs';
import pdfParse from 'pdf-parse'
import { exec } from 'child_process';
import { promisify } from 'util';
import neo4j from 'neo4j-driver';

const execAsync = promisify(exec)

//Neo4j config 

const {
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD,
} = process.env;

if (
    !NEO4J_URI ||
    !NEO4J_USERNAME ||
    !NEO4J_PASSWORD
) {
    throw new Error("Missing required environment variables.");
}

// connect Neo4j aura 
const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
)

async function extractTextFromPDF(pdfPath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer)
    return data.text
}

async function extractTripletsWithPython(text: string): Promise<string[]> {
    // Tránh lỗi shell injection
    const escapedText = text.replace(/["$`\\]/g, '');

    const { stdout } = await execAsync(`python3 extract_triplets.py "${escapedText}"`);
    return stdout.trim().split('\n');
}

async function saveTripletsToNeo4j(triplets:string[]) {
    const session = driver.session();

    try {
        for (const triplet of triplets) {
            const [subject, relation, object] = triplet.split(',').map((s) => s.trim());

            const query = `
                MERGE (s:Entity {name: $subject})
                MERGE (o:Entity {name: $object})
                MERGE (s)-[:${relation.toUpperCase()}]->(o)
            `;

            await session.run(query, { subject, object });
            console.log(`Saved: (${subject}) -[${relation}]-> (${object})`);
        }
    } finally {
        await session.close();
    }
}

async function processPDF(pdfPath: string) {
try {
    const text = await extractTextFromPDF(pdfPath);
    const triplets = await extractTripletsWithPython(text);
    await saveTripletsToNeo4j(triplets);
} catch (err) {
    console.error('Error:', err);
} finally {
    await driver.close();
}
}

// Đường dẫn PDF cần xử lý
processPDF('example.pdf');


