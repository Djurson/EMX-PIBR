export namespace main {
	
	export class Project {
	    supplierPath: string;
	    emxPath: string;
	    combined?: parsing.Workbook;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.supplierPath = source["supplierPath"];
	        this.emxPath = source["emxPath"];
	        this.combined = this.convertValues(source["combined"], parsing.Workbook);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
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

export namespace parsing {
	
	export class SheetData {
	    name: string;
	    headers: string[];
	    rows: string[][];
	
	    static createFrom(source: any = {}) {
	        return new SheetData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.headers = source["headers"];
	        this.rows = source["rows"];
	    }
	}
	export class Workbook {
	    fileName: string;
	    sheets: SheetData[];
	
	    static createFrom(source: any = {}) {
	        return new Workbook(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileName = source["fileName"];
	        this.sheets = this.convertValues(source["sheets"], SheetData);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

