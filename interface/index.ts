export interface exifData {
	Title: string;
	Description: string;
	DateTimeOriginal: string;
	GPSLatitude: number;
	GPSLongitude: number;
	GPSAltitude: number;
}

export interface JSONData {
	title: string;
	description: string;
	imageViews: string;
	creationTime: NTime;
	photoTakenTime: NTime;
	geoData: GeoData;
	geoDataExif: GeoData;
	url: string;
	googlePhotosOrigin: GooglePhotosOrigin;
}

export interface NTime {
	timestamp: string;
	formatted: string;
}

export interface GeoData {
	latitude: number;
	longitude: number;
	altitude: number;
	latitudeSpan: number;
	longitudeSpan: number;
}

export interface GooglePhotosOrigin {
	mobileUpload: MobileUpload;
}

export interface MobileUpload {
	deviceType: string;
}

export interface State {
	processedFiles: number;
	errors: number;
}
