import { promises as fs } from 'fs';
import path from 'path';
import { LocalIndex } from 'vectra';

class VectorStoreService {
    private index: LocalIndex;

    constructor(directory: string) {
        this.index = new LocalIndex(directory);
    }

    // Initialize the index
    async init() {
        if (!await this.index.isIndexCreated()) {
            await this.index.createIndex();
        }
    }

    // Dummy vector generation - replace this with your embedding logic
    private createVectorFromText(text: string): number[] {
        // Example dummy logic: Convert text to a vector of char codes
        return text.split('').map(char => char.charCodeAt(0));
    }

    // Add an item to the index
    async addItem(text: string) {
        const vector = this.createVectorFromText(text);
        await this.index.insertItem({
            vector,
            metadata: { text },
        });
    }

    // Read text files from the specified directory and add them to the vector store
    async addFilesFromDirectory(directory: string) {
        console.log('starting add');
        // Define a recursive function to process directories
        const processDirectory = async (dir: string) => {
            const files = await fs.readdir(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = await fs.stat(filePath);

                if (stat.isDirectory()) {
                    // Recursively process subdirectory
                    await processDirectory(filePath);
                } else if (stat.isFile()) {
                    // Process text file
                    const content = await fs.readFile(filePath, 'utf8');
                    console.log(`Adding file: ${filePath}`);
                    await this.addItem(content);
                }
            }
        }

        // Start processing the root directory
        await processDirectory(directory);
    }

    // Query the index
    async query(text: string, k: number = 3) {
        const vector = this.createVectorFromText(text);
        const results = await this.index.queryItems(vector, k);

        if (results.length > 0) {
            for (const result of results) {
                console.log(`[${result.score}] ${result.item.metadata.text}`);
            }
        } else {
            console.log(`No results found.`);
        }
    }
}

export default VectorStoreService;