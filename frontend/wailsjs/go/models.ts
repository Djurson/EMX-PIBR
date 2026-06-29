export namespace main {
	
	export class SpreadsheetInfo {
	    path: string;
	    filename: string;
	    size: number;
	    totalRows: number;
	    isExcel: boolean;
	    numberOfSheets: number;
	    totalExcelTables: number;
	    headers: string[];
	
	    static createFrom(source: any = {}) {
	        return new SpreadsheetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.filename = source["filename"];
	        this.size = source["size"];
	        this.totalRows = source["totalRows"];
	        this.isExcel = source["isExcel"];
	        this.numberOfSheets = source["numberOfSheets"];
	        this.totalExcelTables = source["totalExcelTables"];
	        this.headers = source["headers"];
	    }
	}

}

