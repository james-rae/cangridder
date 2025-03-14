import proj4 from 'proj4';
import { applyConverter } from '@terraformer/spatial';

const latLongProj = 'EPSG:4326';
const lambertProj = 'EPSG:3978';

proj4.defs(
    lambertProj,
    '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);

/**
 * Reproject a GeoJSON object in place.
 * Note the .crs of the object will not be updated or corrected.
 * Valid formats for the spatial reference parameters is WKT string, or EPSG:#### string
 *
 * @param {Object} geojson the GeoJSON to be reprojected, this will be modified in place
 * @param {String } inputSR spatial reference of the GeoJSON.
 * @param {String} outputSR spatial reference to project to.
 * @returns {Object} projected geoJson
 */
const projectGeoJson = (geoJson: any, inputSR: string, outputSR: string): any => {
    if (inputSR === outputSR) {
        // no projection needed.
        return geoJson;
    }

    const projFunc = proj4(inputSR, outputSR).forward;

    return applyConverter(geoJson, projFunc);
};

export { lambertProj, latLongProj, projectGeoJson };
