const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

function optimizeVideo(inputFilePath) {
	return new Promise((resolve, reject) => {
		const outputFilePath = './optimized.mp4';
		const targetFileSize = 15 * 1024 * 1024; // 15MB in bytes
		const initialCrfValue = 23;
		const targetResolution = '1280x720';
		const maxDuration = 300; // seconds

		// Check initial file size
		const stats = fs.statSync(inputFilePath);
		const initialFileSize = stats.size;

		if (initialFileSize < targetFileSize) {
			resolve(inputFilePath);
			return;
		}

		// Perform optimization
		let currentCrfValue = initialCrfValue;

		const performOptimization = () => {
			ffmpeg(inputFilePath)
				.outputOptions('-vf', `scale=-1:${targetResolution}`)
				.outputOptions('-t', maxDuration)
				.videoCodec('libx264')
				.outputOptions('-crf', currentCrfValue)
				.output(outputFilePath)
				.on('end', () => {
					// Check the optimized file size
					const optimizedStats = fs.statSync(outputFilePath);
					const optimizedFileSize = optimizedStats.size;

					if (optimizedFileSize < targetFileSize) {
						resolve(outputFilePath);
					} else {
						// Increase CRF value and continue optimization
						currentCrfValue++;

						if (currentCrfValue > 51) {
							reject(new Error('Unable to optimize video within the target file size limit.'));
						} else {
							performOptimization();
						}
					}
				})
				.on('error', (err) => {
					reject(err);
				})
				.run();
		};

		performOptimization();
	});
}

// Example usage
const inputFilePath = '/path/to/input.mp4';
optimizeVideo(inputFilePath)
.then((outputFilePath) => {
	console.log(`Optimized video created: ${outputFilePath}`);
})
.catch((err) => {
	console.error('Error optimizing video:', err);
});
