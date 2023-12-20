import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { ExifTool } from 'exiftool-vendored';
import { exifData, JSONData, State } from './interface';

// EDIT PATHS HERE \/

const src =
	'C:\\Users\\bplic\\Downloads\\Takeout\\Zdjęcia Google\\Photos from 2023';
const dest = src + '\\ready\\';

//////   DANGER ZONE BELOW   //////

async function transferPhotoTags(
	sourceFolderPath: string,
	destinationFolderPath: string
) {
	const exiftool = new ExifTool();

	createDestFolder(destinationFolderPath);

	const state: State = { processedFiles: 0, errors: 0 };

	try {
		const files = await fs.promises.readdir(sourceFolderPath);
		await Promise.all(
			files.map((fileName) => {
				return processFile(
					exiftool,
					sourceFolderPath,
					destinationFolderPath,
					fileName,
					state
				);
			})
		);
	} catch (error: any) {
		console.error(chalk.bgRed(`Error processing folder: ${error.message}`));
	} finally {
		console.log(
			chalk.green.bold(
				`Done. Transferred metadata for ${
					state.processedFiles
				} files to folder: ${chalk.dim(destinationFolderPath)}. ${
					state.errors > 0
						? `${state.errors} error(s) occurred. Check history above.`
						: ''
				}`
			)
		);
		exiftool.end();
	}
}

async function processFile(
	exiftool: ExifTool,
	sourceFolderPath: string,
	destinationFolderPath: string,
	fileName: string,
	state: State
) {
	console.log(chalk.inverse(`Processing file:`), ` ${chalk.dim(fileName)}`);
	try {
		if (path.extname(fileName) === '.json') {
			const jsonFilePath = path.join(sourceFolderPath, fileName);
			const mediaFileName = path.basename(fileName, '.json');
			const mediaFilePath = path.join(sourceFolderPath, mediaFileName);
			const outputPath = path.join(destinationFolderPath, mediaFileName);

			if (!fs.existsSync(mediaFilePath)) {
				console.log(
					chalk.yellow(`Media file does not exist: ${chalk.dim(mediaFilePath)}`)
				);
				return;
			}

			const metadataObject: JSONData = await readMetadata(jsonFilePath);
			const exifData: exifData = createExifData(metadataObject, fileName);

			await copyFile(mediaFilePath, outputPath);
			await writeExifData(exiftool, outputPath, exifData, state);
			await updateFileTimestamp(
				outputPath,
				metadataObject.photoTakenTime.timestamp
			);
		}
	} catch (error: any) {
		console.error(
			chalk.bgRed(`Error processing file ${fileName}: ${error.message}`)
		);
		state.errors++;
	}
}

function createDestFolder(destinationFolderPath: string) {
	fs.existsSync(destinationFolderPath)
		? console.log(
				chalk.yellow(
					`Warning! folder: ${destinationFolderPath} - already exist`
				)
		  )
		: fs.mkdirSync(destinationFolderPath);
}

async function readMetadata(jsonFilePath: string) {
	console.log(`Reading metadata from: ${chalk.dim(jsonFilePath)}`);
	const metadata = await fs.promises.readFile(jsonFilePath, 'utf8');
	return JSON.parse(metadata);
}

function createExifData(metadataObject: JSONData, fileName: string) {
	console.log(`Creating Exif data for: ${chalk.dim(fileName)}`);
	return {
		Title: metadataObject.title,
		Description: metadataObject.description,
		DateTimeOriginal: new Date(
			Number(metadataObject.photoTakenTime.timestamp) * 1000
		)
			.toISOString()
			.substring(0, 19),
		GPSLatitude: metadataObject.geoData.latitude,
		GPSLongitude: metadataObject.geoData.longitude,
		GPSAltitude: metadataObject.geoData.altitude,
	};
}

async function copyFile(sourcePath: string, destinationPath: string) {
	console.log(
		`Copying file from ${chalk.dim(sourcePath)} to ${chalk.dim(
			destinationPath
		)}`
	);
	const readStream = fs.createReadStream(sourcePath);
	const writeStream = fs.createWriteStream(destinationPath);

	readStream.pipe(writeStream);
}

async function writeExifData(
	exiftool: ExifTool,
	filePath: string,
	exifData: exifData,
	state: State
) {
	console.log(`Writing Exif data to: ${chalk.dim(filePath)}`);
	await exiftool.write(filePath, exifData, ['-overwrite_original']);
	state.processedFiles++;
}

async function updateFileTimestamp(filePath: string, timestamp: string) {
	console.log(`Updating file timestamp for: ${chalk.dim(filePath)}`);
	await fs.promises.utimes(
		filePath,
		new Date(),
		new Date(Number(timestamp) * 1000)
	);
}

transferPhotoTags(src, dest);
