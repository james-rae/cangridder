// this takes a geojson layer and converts it into an object of attributes,
// having the same format as if you asked an ArcGIS server for the attributes
// via the `/query` rest endpoint.

// we do a bit of sillyness un-converting stringified json, but saves us
// writing nonsense elsewhere and computer loves to do it, trust me I asked.

const frAlias = {
    keyval: '',
    cellval: 'Écart de température par rapport à la valeur de référence 1961-1990 en °C',
    trend: 'Tendance des changements de température depuis 1948 en °C',
    year: 'Année',
    lat: 'Latitude',
    lon: 'Longitude',
    F_DetailPageURL: 'Détails',
};

const enAlias = {
    keyval: '',
    cellval: 'Temperature departure from the 1961-1990 reference value (°C)',
    trend: 'Temperature change trend since 1948 (°C)',
    year: 'Report year',
    lat: 'Latitude',
    lon: 'Longitude',
    E_DetailPageURL: 'Details',
};

const toEsriData = (geoJsonAsString: string, french: boolean): string => {
    const geoJson = JSON.parse(geoJsonAsString);

    // TODO not sure if the method that eats this data requires the actual field aliases here or if thats hardcoded in the page.
    //      can hardcode here unless an even lazier solution presents itself

    const domparoo = {
        displayFieldName: 'cellval',
        fieldAliases: french ? frAlias : enAlias,
        fields: [
            { name: 'keyval', type: 'esriFieldTypeString', length: 20 },
            { name: 'cellval', type: 'esriFieldTypeDouble' },
            { name: 'trend', type: 'esriFieldTypeDouble' },
            { name: 'year', type: 'esriFieldTypeDouble' },
            { name: 'lat', type: 'esriFieldTypeDouble' },
            { name: 'lon', type: 'esriFieldTypeDouble' },
            {
                name: (french ? 'F' : 'E') + '_DetailPageURL',
                type: 'esriFieldTypeString',
                length: 500,
            },
        ],
        features: geoJson.features.map((gjf: any) => ({
            attributes: gjf.properties,
        })),
    };

    return JSON.stringify(domparoo);
};

export { toEsriData };
