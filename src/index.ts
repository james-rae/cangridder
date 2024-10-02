import fs from 'fs';
import { GridCorners, Point } from './grid';

/**
 * Magic value to indicate there is no value
 */
const NO_VAL = '170141000918782798866653488190622531584.00';

// clockwise
const rr = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
];

class GridTool {
    getCell(gridX: number, gridY: number): Array<Point> {
        return rr.map((math) => GridCorners[gridX + math[0]][gridY + math[1]]);
    }
}

export { GridTool };

async function parser(path: string) {
    /**
     * Sauce file
     */
    // const inData = await fs.promises.readFile(path, 'utf8');

    /**
     * Current position crawling through test data
     */
    let readIdx = 0;

    /**
     * Data we are writing out.
     */
    let outData = '';

    /**
     * Marks if we are stil processing data
     */
    let done = false;

    /**
     * How many decimal digits past the decimal point
     */
    let decCount = 0;

    /**
     * Allows us to do string concat in small blocks to avoid memory madness
     */
    let cookieBuffer = '';

    /**
     * Infinite loop insurance
     */
    let emergCounter = 0;

    /*
    while (!done) {
        // figure out what next char is.

        const nextChar = inData.charAt(readIdx);

        readIdx++;

    

        if (emergCounter > 9999999999) {
            console.warn('Hit the emergency counter kickout.');
            done = true;
        }
        emergCounter++;

        if (readIdx >= inData.length) {
            // EOF donethanks
            done = true;
        }

        // if we're done, or our buffer is getting big, write to final output string.
        if (cookieBuffer.length > 1000 || done) {
            outData = outData.concat(cookieBuffer);
            cookieBuffer = '';
        }
    }

    // write out stuff to file
    const outfileMain = path.slice(0, path.length - 5) + '.squash.json';

    await fs.promises.writeFile(outfileMain, outData, 'utf8');
*/

    console.log('Done Thanks');
}

parser('./guts/columbia.txt');
