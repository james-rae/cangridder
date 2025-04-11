// this takes a geojson layer and converts it into an object of attributes,
// having the same format as if you asked an ArcGIS server for the attributes
// via the `/query` rest endpoint.

// we do a bit of sillyness un-converting stringified json, but saves us
// writing nonsense elsewhere and computer loves to do it, trust me I asked.

const toEsriData = (geoJsonAsString: string, french: boolean): string => {
    const geoJson = JSON.parse(geoJsonAsString);

    // TODO not sure if the method that eats this data requires the actual field aliases here or if thats hardcoded in the page.
    //      can hardcode here unless an even lazier solution presents itself

    const domparoo = {
        displayFieldName: 'cellval',
        fieldAliases: {
            // "CompanyName":"Company",
            // "Name":"Name",
        },
        fields: [
            { name: 'keyval', type: 'esriFieldTypeString', alias: '', length: 20 },

            { name: 'cellval', type: 'esriFieldTypeDouble', alias: '' },
            { name: 'trend', type: 'esriFieldTypeDouble', alias: '' },
            { name: 'year', type: 'esriFieldTypeDouble', alias: '' },
            { name: 'lat', type: 'esriFieldTypeDouble', alias: '' },
            { name: 'lon', type: 'esriFieldTypeDouble', alias: '' },

            {
                name: (french ? 'F' : 'E') + '_DetailPageURL',
                type: 'esriFieldTypeString',
                alias: '',
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
