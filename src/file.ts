import fs from 'fs';
import JSZip from 'jszip';

const fileToLines = async (path: string): Promise<Array<string>> => {
    const inDataStr = await fs.promises.readFile(path, 'utf8');
    return inDataStr.split(/\r?\n/);
};

/**
 * Writes a file
 * @param pathPrefix the file path, including file name, but excluding the dot+extension
 * @param filename the name of the file, excluding the dot+extension
 * @param dataDomp file contents in string format
 */
const writeFile = async (pathPrefix: string, filename: string, dataDomp: string, zip: boolean) => {
    if (zip) {
        // make a zip container with our geojson guts
        const zipper = new JSZip();
        zipper.file(filename + '.json', dataDomp);

        // blast out compressed file as a stream, and pipe it to a file
        const zipStream = zipper.generateNodeStream({
            type: 'nodebuffer',
            streamFiles: true,
            compression: 'DEFLATE',
        });

        const writeStream = fs.createWriteStream(pathPrefix + '.zip');
        zipStream.pipe(writeStream);
    } else {
        await fs.promises.writeFile(pathPrefix + '.json', dataDomp, 'utf8');
    }
};

export { fileToLines, writeFile };
