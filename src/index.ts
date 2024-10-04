import fs from 'fs';
import { GridCenters, Line, Point } from './grid';

/**
 * Magic value to indicate there is no value
 */
const NO_VAL = '170141000918782798866653488190622531584.00';

// i think i have row and column terms swapped. canada wider than taller

/**
 * Max number of rows of cells
 */
const MAX_CELL_ROW = 125;

/**
 * Max number of cols of cells
 */
const MAX_CELL_COL = 95;

/**
 * Max number of rows of cells
 */
const MAX_EDGE_ROW = MAX_CELL_ROW + 1;

/**
 * Max number of cols of cells
 */
const MAX_EDGE_COL = MAX_CELL_COL + 1;

// clockwise
const rr = [
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
const getCellCenterNE = (gridX: number, gridY: number): Array<Point> => {
    return rr.map((math) => GridCenters[gridX + math[0]][gridY + math[1]]);
};

/**
 * Set of points for interpolated edges. Origin is SouthWest corner.
 */
const GridEdges = new Array(MAX_EDGE_ROW);

// Generate the edge points via midpoint estimation.
// Do it once here so it can be re-used in a batch

// init arrays
for (let i = 0; i < MAX_EDGE_ROW; i++) {
    GridEdges[i] = new Array(MAX_EDGE_COL);
}

// do middle points (easy)
for (let iRowEdge = 0; iRowEdge < MAX_EDGE_ROW - 2; iRowEdge++) {
    for (let iColEdge = 0; iColEdge < MAX_EDGE_COL - 2; iColEdge++) {
        // calc the northeast midpoint between the two centers.
        // the nested loops will end up getting every edge except the outer points

        const boundingCenters = getCellCenterNE(iRowEdge, iColEdge);
        const midPoints = four.map((i) => midPoint(boundingCenters[i], boundingCenters[i + 1]));
        const crossA: Line = [midPoints[0], midPoints[2]];
        const crossB: Line = [midPoints[1], midPoints[3]];
        const centerPoint = two.map((i) => determinant(crossA, crossB, i));

        // +1 each coord, that is northeast corner
        GridEdges[iRowEdge + 1][iColEdge + 1] = centerPoint;
    }
}

console.log('Got past middle points');

// do flat edges
// across rows
for (let iRowEdge = 1; iRowEdge < MAX_EDGE_ROW - 1; iRowEdge++) {
    // 0 edge
    const edgeStart = GridEdges[iRowEdge][1];
    const distStart = distVector(GridEdges[iRowEdge][2], edgeStart);
    GridEdges[iRowEdge][0] = addVector(edgeStart, distStart);

    // max edge
    const edgeEnd = GridEdges[iRowEdge][MAX_EDGE_COL - 2];
    const distEnd = distVector(GridEdges[iRowEdge][MAX_EDGE_COL - 3], edgeEnd);
    GridEdges[iRowEdge][MAX_EDGE_COL - 1] = addVector(edgeEnd, distEnd);
}
// across cols. because we extended rows, can do all cols, getting the corners as well
for (let iColEdge = 0; iColEdge < MAX_EDGE_COL; iColEdge++) {
    // 0 edge
    const edgeStart = GridEdges[1][iColEdge];
    const distStart = distVector(GridEdges[2][iColEdge], edgeStart);
    GridEdges[0][iColEdge] = addVector(edgeStart, distStart);

    // max edge
    const edgeEnd = GridEdges[MAX_EDGE_ROW - 2][iColEdge];
    const distEnd = distVector(GridEdges[MAX_EDGE_ROW - 3][iColEdge], edgeEnd);
    GridEdges[MAX_EDGE_ROW - 1][iColEdge] = addVector(edgeEnd, distEnd);
}

// reduce number precision
//parseFloat(0.9999999.toFixed(4))
for (let xy = 0; xy < 2; xy++) {
    for (let iRowEdge = 0; iRowEdge < MAX_EDGE_ROW; iRowEdge++) {
        for (let iColEdge = 0; iColEdge < MAX_EDGE_COL; iColEdge++) {
            GridEdges[iRowEdge][iColEdge][xy] = parseFloat(
                GridEdges[iRowEdge][iColEdge][xy].toFixed(4),
            );
        }
    }
}

/**
 * Returns points of cell boundary in a ring
 */
const getCellBoundary = (gridX: number, gridY: number): Array<Point> => {
    return rr.map((math) => GridEdges[gridX + math[0]][gridY + math[1]]);
};

const gjCell = (gridX: number, gridY: number, value: number): any => {
    return {
        type: 'Feature',
        properties: { cellval: value, keyval: `Row ${gridX} Col ${gridY}` },
        geometry: {
            type: 'Polygon',
            coordinates: [getCellBoundary(gridX, gridY)],
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
     * Array of GeoJSON features we have generated
     */
    const featBuffer: Array<any> = new Array(MAX_CELL_COL * MAX_CELL_ROW);

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

            if (trimData && trimData !== NO_VAL) {
                // make a geojson
                const gj = gjCell(gridRow, gridCol, parseFloat(trimData));
                featBuffer[bufferIdx] = gj;
                bufferIdx++;
            }

            gridRow++;
            if (gridRow >= MAX_CELL_ROW) {
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

    console.log('Done Thanks: ' + outfileMain);
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
