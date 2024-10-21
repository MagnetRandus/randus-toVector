import { promises as fs } from 'fs';
import * as path from 'path';
import VectorStoreService from './VectorStoreService';

const essentialFiles: string[] = [
    '.eslintrc.js',
    '.gitignore',
    '.npmignore',
    '.nvmrc',
    '.prettierrc',
    '.yo-rc.json',
    'gulpfile.js',
    'package.json',
    'tsconfig.json',
    'config/config.json',
    'config/deploy-azure-storage.json',
    'config/package-solution.json',
    'config/sass.json',
    'config/serve.json',
    'config/write-manifests.json'
];

// Function to copy essential files
async function copyEssentialFiles(src: string, dest: string, files: string[]): Promise<void> {
    try {
        for (const file of files) {
            const srcFile = path.resolve(src, file);
            const destFile = path.resolve(dest, file);
            const destDir = path.dirname(destFile);

            const fileExists = await fs.stat(srcFile).then(() => true).catch(() => false);

            if (!fileExists) {
                console.warn(`Source file "${srcFile}" does not exist.`);
                continue;
            }

            await fs.mkdir(destDir, { recursive: true });
            await fs.copyFile(srcFile, destFile);
        }
    } catch (error) {
        console.error(`Error copying essential files: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function deleteIndexFile(filePath: string): Promise<void> {
    try {
        const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);

        if (fileExists) {
            await fs.unlink(filePath);
            console.log(`File "${filePath}" has been deleted successfully.`);
        }
    } catch (error) {
        console.error(`Error deleting file "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function copyRecursiveAsync(src: string, dest: string): Promise<void> {
    try {
        const srcExists = await fs.stat(src).then(() => true).catch(() => false);

        if (!srcExists) {
            console.error(`Source path "${src}" does not exist.`);
            return;
        }

        const destExists = await fs.stat(dest).then(() => true).catch(() => false);

        if (!destExists) {
            await fs.mkdir(dest, { recursive: true });
        }

        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            // Exclude specific folders and file types
            if (entry.isDirectory()) {
                if (['.git', '.vscode', 'node_modules', 'dist', 'lib', 'release', 'sharepoint', 'teams', 'temp'].includes(entry.name)) {
                    continue;
                }
                await copyRecursiveAsync(srcPath, destPath);
            } else {
                const ext = path.extname(entry.name);
                if (['.d.ts', '.map', '.scss', '.css', '.png', '.scss.ts'].includes(ext)) {
                    continue;
                }
                await fs.copyFile(srcPath, destPath);
            }
        }
    } catch (error) {
        console.error(`Error copying files: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function cleanDirectory(dirPath: string): Promise<void> {


    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Recursively delete contents of the subdirectory
                await cleanDirectory(entryPath);
                // Remove the directory itself after its contents are deleted
                await fs.rmdir(entryPath);
            } else {
                // Delete the file
                await fs.unlink(entryPath);
            }
        }

    } catch (error) {
        console.error(`Error cleaning directory: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function main(): Promise<void> {
    await deleteIndexFile(`C:\\dev\\vdb\\assets\\db\\vector_store\\index.json`);
    console.log('index file deleted');
    const vectorStoreDirectory = path.resolve(__dirname, '../assets/db', 'vector_store');
    const vectorStore = new VectorStoreService(vectorStoreDirectory);

    try {
        await vectorStore.init();
        const textFilesDirectory = path.resolve(__dirname, '../assets', 'read');
        await vectorStore.addFilesFromDirectory(textFilesDirectory);
        console.dir(textFilesDirectory);
        console.log('Vector store has been initialized with text files.');
    } catch (error) {
        if (error instanceof Error && 'message' in error) {
            console.error(`Error initializing vector store: ${error.message}`);
        }
    }
}

// Example usage: Copy files from source to destination
const srcFolder = path.resolve(__dirname, 'C:\\dev\\randus-fleet');
const destFolder = path.resolve(__dirname, 'C:\\dev\\vdb\\assets\\read');
main().catch(err => console.error(err));;

// cleanDirectory(destFolder).then(() => {
//     // copyEssentialFiles(srcFolder, destFolder, essentialFiles)
//     // copyRecursiveAsync(srcFolder, destFolder)
//     // .then(() => {
//     // console.log('Files copied successfully..')
//     // })
//     // .catch(err => console.error(err));
// })
