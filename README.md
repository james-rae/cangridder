# Cangridder

The CanGrid can!

Converts a CanGrid `GRD` file to a collection of GeoJSON polygons.

## Setup

1. Clone this repo
1. `npm ci`

## Configuration

### Files to Process

Put the GRD files you want to convert somewhere under the repo folder. At the bottom of `index.ts`, edit the values of the `batch` array to contain the paths to every file, and the year the files represent. E.g. if I have two files in the `grids` folder

```js
const batch = [
    { f: './grids/file1.grd', y: 2007 },
    { f: './grids/file2.grd', y: 2008 },
];
```

If the files have a nice pattern, you can write fancier code to generate the `batch` contents. E.g. I have 20 files, one per year (2004-2023), with name `grid<year>.grd`

```js
const yearGen = new Array(20).fill(2004);
const batch = yearGen
    .map((start, i) => start + i)
    .map(year => ({ f: `./grids/grid${year}.grd`, y: year }));
```

There also needs to be a trend data `csv` file path provided to the `trendFile` variable.

```js
const trendFile = './grids/tmean_annual_trends.csv';
```

### Zipped Output

As is, the GeoJSON files will be zipped. To just output text files, change the var `ZIP_OUTPUT` to `false` at the top of `index.ts`.

### Current Year Enhancements

The "current year" layer typically wants an extra field containing the URL to the detail page. It will also generate two output files for the dataset, an English and French one. And a new bonus, two "attribute only" files to feed the Data pages. These files contain a JSON object that mimics an attribute query result from an ArcGIS server, one for each language.

There are a few settings that can be tweaked, all at the top of `index.ts`.

`CURR_YEAR` contains the year of the grd source that is the current year. Something in the `batch` array should match it (via the `y` property of one of the objects). To have no file be the current year, just set this to 0.

```js
const CURR_YEAR = 2022;
```

`DETAIL_URL_PREFIX` contains the server domain path for the details URL. This would be updated depending on where the processed files are going to be deployed. It should contain the full URL up to but not including the parameter `?` token.

```js
const DETAIL_URL_PREFIX = 'https://indicators-map.canada.ca/App/Detail';
```

## Usage

After doing the setup and configuration, run this magic command. The output files will appear in the same location as their source `grd` file.

```
npm run start
```
