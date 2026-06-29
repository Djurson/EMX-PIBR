# EMX - PIBR (Product Image Batcher And Renamer)

This is a tool to import excel sheets (`.xlsx`) or csv files (`.csv`) in order to rename product item numbers, download corresponding image files and rename them to their new corresponding item number, and which bikes/brands the product fits.

## Base project requirements

- [ ] Able to preview the `.xlsx` or `.csv`file in order to select which column is which
- [ ] Extract product description and item numbers
- [ ] Define a manufacturer prefix that will be set before all item numbers
- [ ] Export new `.xlsx` file with the new renamed item numbers, original item numbers, image name
- [ ] Export folder with manufacturer prefix that contains all images

**_If possible_**

- [ ] Use a already defined GO binary to extract which bikes/brands the product fits

Supported platforms

| Platform/Operating System | Support | Notes                               |
| ------------------------- | :-----: | ----------------------------------- |
| `macOS`                   |    ✓    | Develop platform                    |
| `Windows 10`/`Windows 11` |    ✓    | Should mainly support               |
| `Windows 7`               |    -    | Should partialy support if possible |

## Workflow

1. Import the `.csv` or `.xlsx` file
2. Get a preview of the file
3. Do a _guess_ of which columns that belongs to which, and show the _guesses_ visually in a preview of the spreadsheet
4. Make the user either input manually a manufacturer prefix for all item numbers
5. Based on the links in the spreadsheet, download all the images linked to all products
6. Save them to the folder with the defined prefix that was defined
7. Simultaneously as the image download, process all item numbers
8. Export new `.xlsx` file with a `EMX item number`, `Manufacturer item number`, `Product Description`,`Image`, `Bike`. `Bike` field is optional if time exists

## Development

This is the official Wails React-TS template.

You can configure the project by editing `wails.json`. More information about the project settings can be found on the [wails documentation](https://wails.io/docs/reference/project-config)

### Requirements

- [`Go 1.21+`](https://go.dev/dl/)
- [`NPM (Node 15+)`](https://nodejs.org/en/download)

### Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on [localhost:34115](http://localhost:34115). Connect
to this in your browser, and you can call your Go code from devtools.

### Building

To build a redistributable, production mode package, use `wails build`.
