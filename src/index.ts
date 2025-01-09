import fs from 'fs';
import JSZip from 'jszip';
import { GridCenters, Line, Point } from './grid';

/**
 * Magic flag to zip our files or not
 */
const ZIP_OUTPUT = true;

/**
 * Magic value to indicate there is no value
 */
const NO_VAL = '170141000918782798866653488190622531584.00';

/**
 * Max number of cols of cells
 */
const MAX_CELL_COL = 125;

/**
 * Max number of rows of cells
 */
const MAX_CELL_ROW = 95;

/**
 * Max number of cols of cells
 */
const MAX_EDGE_COL = MAX_CELL_COL + 1;

/**
 * Max number of rows of cells
 */
const MAX_EDGE_ROW = MAX_CELL_ROW + 1;

// clockwise
// this is [gridCol, gridRow]. ideally gets changed to row/col after refactor.
const rr: Array<[number, number]> = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
];

const four = [0, 1, 2, 3]; // dumb!!
const two = [0, 1]; // dumber!!

/**
 * Midpoint between two points
 */
const midPoint = (p1: Point, p2: Point): Point => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

/**
 * Calculates the funfactor of a determinant for a line
 */
const funFactor = (line: Line): number => {
    return line[0][0] * line[1][1] - line[0][1] * line[1][0];
};

/**
 * Calculates the differydoo of a determinant for a line
 * @param line
 * @param xy 0 if X, 1 if Y
 */
const differyDoo = (line: Line, xy: number): number => {
    return line[0][xy] - line[1][xy];
};

/**
 * Intersection determinant for X or Y. Assumes lines intersect (will error otherwise)
 *
 * @param l1
 * @param l2
 * @param xy 0 if X, 1 if Y
 */
const determinant = (l1: Line, l2: Line, xy: number): number => {
    // stolen from https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Given_two_points_on_each_line
    const topFirst = funFactor(l1) * differyDoo(l2, xy);
    const topSecond = funFactor(l2) * differyDoo(l1, xy);
    const bottomFirst = differyDoo(l1, 0) * differyDoo(l2, 1);
    const bottomSecond = differyDoo(l1, 1) * differyDoo(l2, 0);
    return (topFirst - topSecond) / (bottomFirst - bottomSecond);
};

/**
 * Returns vector (as point) of distance between points
 */
const distVector = (p1: Point, p2: Point): Point => {
    const fakeLine: Line = [p2, p1];
    return two.map((xy) => differyDoo(fakeLine, xy)) as Point;
};

const addVector = (p1: Point, vector: Point): Point => {
    return two.map((xy) => p1[xy] + vector[xy]) as Point;
};

/**
 * Returns points of cell centers in a ring, starting at SW then clockwise in NE direction
 */
const getCellCenterNE = (gridCol: number, gridRow: number): Array<Point> => {
    return rr.map((math) => GridCenters[gridCol + math[0]][gridRow + math[1]]);
};

/**
 * Set of points for interpolated edges. Origin is SouthWest corner.
 */
const GridEdges: Array<Array<Point>> = new Array(MAX_EDGE_COL);

// Generate the edge points via midpoint estimation.
// Do it once here so it can be re-used in a batch

// init arrays
for (let i = 0; i < MAX_EDGE_COL; i++) {
    GridEdges[i] = new Array(MAX_EDGE_ROW);
}

// do middle points (easy)
for (let iColEdge = 0; iColEdge < MAX_EDGE_COL - 2; iColEdge++) {
    for (let iRowEdge = 0; iRowEdge < MAX_EDGE_ROW - 2; iRowEdge++) {
        // calc the northeast midpoint between the two centers.
        // the nested loops will end up getting every edge except the outer points

        const boundingCenters = getCellCenterNE(iColEdge, iRowEdge);
        const midPoints = four.map((i) => midPoint(boundingCenters[i], boundingCenters[i + 1]));
        const crossA: Line = [midPoints[0], midPoints[2]];
        const crossB: Line = [midPoints[1], midPoints[3]];
        const centerPoint = two.map((i) => determinant(crossA, crossB, i)) as Point;

        // +1 each coord, that is northeast corner
        GridEdges[iColEdge + 1][iRowEdge + 1] = centerPoint;
    }
}

// do flat edges
// across cols
for (let iColEdge = 1; iColEdge < MAX_EDGE_COL - 1; iColEdge++) {
    // 0 edge
    const edgeStart = GridEdges[iColEdge][1];
    const distStart = distVector(GridEdges[iColEdge][2], edgeStart);
    GridEdges[iColEdge][0] = addVector(edgeStart, distStart);

    // max edge
    const edgeEnd = GridEdges[iColEdge][MAX_EDGE_ROW - 2];
    const distEnd = distVector(GridEdges[iColEdge][MAX_EDGE_ROW - 3], edgeEnd);
    GridEdges[iColEdge][MAX_EDGE_ROW - 1] = addVector(edgeEnd, distEnd);
}
// across rows. because we extended cols, can do all rows, getting the corners as well
for (let iRowEdge = 0; iRowEdge < MAX_EDGE_ROW; iRowEdge++) {
    // 0 edge
    const edgeStart = GridEdges[1][iRowEdge];
    const distStart = distVector(GridEdges[2][iRowEdge], edgeStart);
    GridEdges[0][iRowEdge] = addVector(edgeStart, distStart);

    // max edge
    const edgeEnd = GridEdges[MAX_EDGE_COL - 2][iRowEdge];
    const distEnd = distVector(GridEdges[MAX_EDGE_COL - 3][iRowEdge], edgeEnd);
    GridEdges[MAX_EDGE_COL - 1][iRowEdge] = addVector(edgeEnd, distEnd);
}

// manual fix
// our edge estimation is not great. These 4 cells (5 edges) are typically the only ones with data.
// fixed co-ords calculated with MSPaint line tool + ramp coord bar
GridEdges[47][MAX_EDGE_ROW - 1] = [-67.6082, 83.6677];
GridEdges[48][MAX_EDGE_ROW - 1] = [-64.5135, 83.3292];
GridEdges[49][MAX_EDGE_ROW - 1] = [-61.7811, 82.9821];
GridEdges[50][MAX_EDGE_ROW - 1] = [-59.2625, 82.6151];
GridEdges[51][MAX_EDGE_ROW - 1] = [-57.036, 82.2446];

// reduce number precision
for (let xy = 0; xy < 2; xy++) {
    for (let iColEdge = 0; iColEdge < MAX_EDGE_COL; iColEdge++) {
        for (let iRowEdge = 0; iRowEdge < MAX_EDGE_ROW; iRowEdge++) {
            GridEdges[iColEdge][iRowEdge][xy] = parseFloat(
                GridEdges[iColEdge][iRowEdge][xy].toFixed(4),
            );
        }
    }
}

/**
 * Returns points of cell boundary in a ring
 */
const getCellBoundary = (gridCol: number, gridRow: number): Array<Point> => {
    return rr.map((math) => GridEdges[gridCol + math[0]][gridRow + math[1]]);
};

/**
 * Create a GeoJSON feature. Will be a poly square plus some properties/attributes
 * @param gridCol
 * @param gridRow
 * @param value
 * @returns
 */
const gjCell = (gridCol: number, gridRow: number, value: number): any => {
    const center = GridCenters[gridCol][gridRow];
    return {
        type: 'Feature',
        properties: {
            cellval: value,
            keyval: `R${gridRow}C${gridCol}`,
            lat: center[1],
            lon: center[0],
        },
        geometry: {
            type: 'Polygon',
            coordinates: [getCellBoundary(gridCol, gridRow)],
        },
    };
};

/**
 * Generate one GeoJSON file
 * @param path path to source GRD file
 */
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
     * Array of GeoJSON features we have generated
     */
    const featBuffer: Array<any> = new Array(MAX_CELL_ROW * MAX_CELL_COL);

    /**
     * Tracks where we're inserting in the buffer
     */
    let bufferIdx = 0;

    /**
     * Grid col we are parsing
     */
    let gridCol = 0;

    /**
     * Grid row we are parsing
     */
    let gridRow = 0;

    inDataLines.forEach((inLine, lineNum) => {
        if (lineNum < 5) {
            // file header line
            if (lineNum === 1 && inLine !== '125 95') {
                // things prob gonna error spectacularly, give a little context.
                console.log('HOL UP! File header indicates grid is in an unexpected layout.');
            }
        } else {
            // data line
            const trimData = inLine.trim();

            if (trimData && trimData !== NO_VAL) {
                // make a geojson
                const gj = gjCell(gridCol, gridRow, parseFloat(trimData));
                featBuffer[bufferIdx] = gj;
                bufferIdx++;
            }

            gridCol++;
            if (gridCol >= MAX_CELL_COL) {
                gridCol = 0;
                gridRow++;
            }
        }
    });

    const finalGeoJSON = {
        type: 'FeatureCollection',
        features: featBuffer.filter(Boolean),
    };

    const finalAsString = JSON.stringify(finalGeoJSON);

    // write out stuff to file
    const pathPre = path.slice(0, path.length - 3);

    const filename = pathPre.split('/').pop() || 'mystery';

    if (ZIP_OUTPUT) {
        // make a zip container with our geojson guts
        const zipper = new JSZip();
        zipper.file(filename + 'json', finalAsString);

        // blast out compressed file as a stream, and pipe it to a file
        const zipStream = zipper.generateNodeStream({
            type: 'nodebuffer',
            streamFiles: true,
            compression: 'DEFLATE',
        });

        const writeStream = fs.createWriteStream(pathPre + 'zip');
        zipStream.pipe(writeStream);
    } else {
        await fs.promises.writeFile(pathPre + 'json', finalAsString, 'utf8');
    }

    console.log('Done Thanks: ' + filename);
}

async function parseAll(files: Array<string>) {
    if (files.length > 0) {
        const file = files.pop()!;
        await parser(file);
        await parseAll(files);
    }
}

const batch = ['./guts/t202213.grd'];
parseAll(batch);
