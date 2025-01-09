# Cangridder

The CanGrid can!

Converts a CanGrid `GRD` file to a collection of GeoJSON polygons.

## Setup

1. Clone this repo
1. `npm ci`

## Configuration

### Files to Process

Put the GRD files you want to convert somewhere under the repo folder. At the bottom of `index.ts`, edit the values of the `batch` array to contain the paths to every file. E.g. if I have two files in the `grids` folder

```js
const batch = ['./grids/file1.grd', './grids/file2.grd'];
```

If the files have a nice pattern, you can write fancier code to generate the `batch` contents. E.g. I have 20 files, one per year (2004-2024), with name `grid<year>.grd`

```js
const yearGen = new Array(20).fill(2004);
const batch = yearGen.map((start, i) => `./grids/grid${start + i}.grd`);
```

### Zipped Output

As is, the GeoJSON files will be zipped. To just output text files, change the var `ZIP_OUTPUT` to `false` at the top of `index.ts`.

## Usage

After doing the setup and configuration, run this magic command. The output files will appear in the same location as their source `grd` file.

```
npm run start
```
