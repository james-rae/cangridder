import { fileToLines } from './file';
import { GridCenters } from './grid';

/**
 * Generates a map of cell key (RyCx) to trend value
 *
 * @param path
 * @returns
 */
const parseTrend = async (path: string): Promise<Map<string, string>> => {
    // read CSV
    const csvLines = await fileToLines(path);

    // ~4500 trend values
    // ~12000 possible cells
    // use a temp map to avoid the double loop

    // maps mash of "long~lat" key to RyCx grid cell id
    const cellMapFeeder = GridCenters.flatMap((gridColSet, cId) =>
        gridColSet.map((gridRow, rId): [string, string] => [gridRow.join('~'), `R${rId}C${cId}`]),
    );
    const cellMap: Map<string, string> = new Map(cellMapFeeder);

    const finalFeeder = csvLines.map((csvLine, lineNum): [string, string] => {
        if (lineNum === 0) {
            // header. return dummynugget
            return ['NOTHING', 'BURGER'];
        } else if (csvLine.trim() === '') {
            // empty line
            return ['EMPTY' + lineNum, 'BURGER'];
        } else {
            const csvCols = csvLine.split(',');
            const lat = csvCols[1];
            const lon = csvCols[2];
            const trend = csvCols[6];

            // find what the cell id is for this latlon
            const cellKey = cellMap.get(lon + '~' + lat);
            if (cellKey) {
                return [cellKey, trend];
            } else {
                throw new Error(
                    'Lat Lon in trend file didnt match to official lat lon: ' + lat + ' , ' + lon,
                );
            }
        }
    });

    return new Map(finalFeeder);
};

export { parseTrend };
