import fs from 'fs';
import { GridCorners, Point } from './grid';

/**
 * Magic value to indicate there is no value
 */
const NO_VAL = '170141000918782798866653488190622531584.00';

/**
 * Max number of rows
 */
const MAX_ROW = 125;

/**
 * Max number of rows
 */
const MAX_COL = 95;

// clockwise
const rr = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
];

const getCell = (gridX: number, gridY: number): Array<Point> => {
    return rr.map((math) => GridCorners[gridX + math[0]][gridY + math[1]]);
};

const gjCell = (gridX: number, gridY: number, value: number): any => {
    return {
        type: 'Feature',
        properties: { cellval: value },
        geometry: {
            type: 'Polygon',
            coordinates: [getCell(gridX, gridY)],
        },
    };
};

async function parser(path: string) {
    /**
     * Sauce file
     */
    const inDataStr = await fs.promises.readFile(path, 'utf8');

    /**
     * Sauce file split into file lines (array of strings)
     */
    const inDataLines = inDataStr.split(/\r?\n/);

    /**
     * Data we are writing out.
     */
    let outData = '';

    /**
     * Allows us to do string concat in small blocks to avoid memory madness
     */
    let cookieBuffer = '';

    /**
     * Array of GeoJSON features we have generated
     */
    const featBuffer: Array<any> = new Array(MAX_COL * MAX_ROW);

    /**
     * Tracks where we're inserting in the buffer
     */
    let bufferIdx = 0;

    /**
     * Grid row we are parsing
     */
    let gridRow = 0;

    /**
     * Grid column we are parsing
     */
    let gridCol = 0;

    inDataLines.forEach((inLine, lineNum) => {
        if (lineNum < 5) {
            // file header row
            if (lineNum === 1 && inLine !== '125 95') {
                // things prob gonna error spectacularly, give a little context.
                console.log('HOL UP! File header indicates grid is in an unexpected layout.');
            }
        } else {
            // data row
            const trimData = inLine.trim();

            if (trimData !== NO_VAL) {
                // temporary last-edge checker
                if (gridCol < MAX_COL - 1 && gridRow < MAX_ROW - 1) {
                    // make a geojson
                    const gj = gjCell(gridRow, gridCol, parseFloat(trimData));
                    featBuffer[bufferIdx] = gj;
                    bufferIdx++;
                }
            }

            gridRow++;
            if (gridRow >= MAX_ROW) {
                gridRow = 0;
                gridCol++;
            }
        }
    });

    const finalGeoJSON = {
        type: 'FeatureCollection',
        features: featBuffer.filter(Boolean),
    };

    // write out stuff to file
    const outfileMain = path.slice(0, path.length - 3) + 'json';

    await fs.promises.writeFile(outfileMain, JSON.stringify(finalGeoJSON), 'utf8');

    console.log('Done Thanks');
}

parser('./guts/t202213.grd');
