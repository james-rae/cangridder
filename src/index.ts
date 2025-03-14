import { fileToLines, writeFile } from './file';
import { GridCenters, Line, Point } from './grid';
import { parseTrend } from './trend';
import { lambertProj, latLongProj, projectGeoJson } from './proj';

type GrdMetadata = {
    /**
     * File path
     */
    f: string;
    /**
     * File year
     */
    y: number;
};

/**
 * Magic flag to zip our files or not
 */
const ZIP_OUTPUT = true;

/**
 * Magic flag to notate which year is the "current year".
 * This will add detail page link fields, and create an english and french file.
 */
const CURR_YEAR = 2023;

/**
 * Magic setting for the URL prefix of detail links of the current year file.
 * Should be the URL up to but excluding the ?
 * Dev: https://indicators-map.dev.ec.gc.ca/App/Detail
 * QA: https://indicators-map.qa.ec.gc.ca/App/Detail
 * Prod: https://indicators-map.canada.ca/App/Detail
 */
const DETAIL_URL_PREFIX = 'https://indicators-map.dev.ec.gc.ca/App/Detail';

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

// convert to Lambert
for (let iColEdge = 0; iColEdge < MAX_EDGE_COL; iColEdge++) {
    for (let iRowEdge = 0; iRowEdge < MAX_EDGE_ROW; iRowEdge++) {
        const fakeGeoJson = {
            type: 'Point',
            coordinates: GridEdges[iColEdge][iRowEdge],
        };

        const lambertGeoJson = projectGeoJson(fakeGeoJson, latLongProj, lambertProj);
        GridEdges[iColEdge][iRowEdge] = lambertGeoJson.coordinates;
    }
}

// reduce number precision (lambert, which is meters, chop the decimal off)
for (let xy = 0; xy < 2; xy++) {
    for (let iColEdge = 0; iColEdge < MAX_EDGE_COL; iColEdge++) {
        for (let iRowEdge = 0; iRowEdge < MAX_EDGE_ROW; iRowEdge++) {
            GridEdges[iColEdge][iRowEdge][xy] = Math.floor(GridEdges[iColEdge][iRowEdge][xy]);
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
const gjCell = (
    gridCol: number,
    gridRow: number,
    keyval: string,
    cellValue: number,
    trendValue: number,
    year: number,
): any => {
    const center = GridCenters[gridCol][gridRow];
    return {
        type: 'Feature',
        properties: {
            keyval: keyval,
            cellval: cellValue,
            trend: trendValue,
            year: year,
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
async function parser(fileData: GrdMetadata, trendData: Map<string, number>) {
    /**
     * Sauce file split into file lines (array of strings)
     */
    const inDataLines = await fileToLines(fileData.f);

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
                const keyval = `R${gridRow}C${gridCol}`;

                // only make squares with trend data
                if (trendData.has(keyval)) {
                    // round to two decimals
                    const trendVal = Math.round(100 * trendData.get(keyval)!) / 100;

                    // make a geojson
                    const gj = gjCell(
                        gridCol,
                        gridRow,
                        keyval,
                        parseFloat(trimData),
                        trendVal,
                        fileData.y,
                    );
                    featBuffer[bufferIdx] = gj;
                    bufferIdx++;
                }
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
        crs: {
            type: 'name',
            properties: {
                name: 'urn:ogc:def:crs:EPSG::3978',
            },
        },
        features: featBuffer.filter(Boolean),
    };

    // write out stuff to file
    const pathPre = fileData.f.slice(0, fileData.f.length - 4);

    const filename = pathPre.split('/').pop() || 'mystery';

    if (fileData.y === CURR_YEAR) {
        // enhance with detail page fields
        finalGeoJSON.features.forEach((f) => {
            f.properties.DETAIL_FIELD_TOKEN =
                '<a href="' +
                DETAIL_URL_PREFIX +
                '?id=' +
                f.properties.keyval +
                '&GoCTemplateCulture=DETAIL_LANG_TOKEN" target="_blank">TEXT_LANG_TOKEN</a>';
        });

        const tokenString = JSON.stringify(finalGeoJSON);

        // english
        const enFinal = tokenString
            .replaceAll('DETAIL_FIELD_TOKEN', 'E_DetailPageURL')
            .replaceAll('DETAIL_LANG_TOKEN', 'en-CA')
            .replaceAll('TEXT_LANG_TOKEN', 'More information');
        await writeFile(pathPre + '.en', filename, enFinal, ZIP_OUTPUT);

        // french
        const frFinal = tokenString
            .replaceAll('DETAIL_FIELD_TOKEN', 'F_DetailPageURL')
            .replaceAll('DETAIL_LANG_TOKEN', 'fr-CA')
            .replaceAll('TEXT_LANG_TOKEN', "Plus d'information");
        await writeFile(pathPre + '.fr', filename, frFinal, ZIP_OUTPUT);
    } else {
        const finalAsString = JSON.stringify(finalGeoJSON);
        await writeFile(pathPre, filename, finalAsString, ZIP_OUTPUT);
    }

    console.log('Done Thanks: ' + filename);
}

async function parseAll(files: Array<GrdMetadata>, trendData: Map<string, number>) {
    if (files.length > 0) {
        const file = files.pop()!;
        await parser(file, trendData);
        await parseAll(files, trendData);
    }
}

// currently using file format t<year>13.grd
const yearGen: Array<number> = new Array(13).fill(2011);
const batch = yearGen
    .map((start, i) => start + i)
    .map((year) => ({ f: `./grids/t${year}13.grd`, y: year }));

const trendFile = './grids/tmean_annual_trends.csv';

parseTrend(trendFile).then((trendNugget) => {
    parseAll(batch, trendNugget);
});
