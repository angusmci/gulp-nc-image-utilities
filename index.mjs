import gulp from "gulp";
import rename from "gulp-rename";
import changed from "gulp-changed";
import sharp from "sharp";
import through2 from "through2";
import lqip from "lqip-modern";
import File from "vinyl";
import path from "path";

const webpEffort = 5;
const avifEffort = 7;

/**
 * Convert files to JPEG according to the specifications given in a configuration.
 *
 * @param {*} configuration
 * @returns
 */

const resizeImageJpg = (configuration) => {
  return new Promise((resolve, reject) => {
    try {
      configuration.versions.forEach(function (version) {
        gulp
          .src(configuration.source + "/**/*." + configuration.sourceExt)
          .pipe(
            changed(configuration.dest, { extension: version.suffix + ".jpg" })
          )
          .pipe(
            through2.obj(async function (file, _, cb) {
              let metadata = await getImageMetadata(file.contents);
              let width = Math.floor((metadata.width * version.percent) / 100);
              let converted = sharp(file.contents)
                .withMetadata()
                .resize({ width: width })
                .jpeg({
                  quality: Math.floor(version.quality.jpg * 100),
                  mozjpeg: true,
                })
                .toBuffer();
              return converted
                .then(function (buffer) {
                  file.contents = buffer;
                  return cb(null, file);
                })
                .catch(function (err) {
                  console.error(err);
                  return cb(null, file);
                });
            })
          )
          .pipe(
            rename(function (path) {
              path.extname = version.suffix + ".jpg";
            })
          )
          .pipe(gulp.dest(configuration.dest));
      });
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Convert files to WebP according to the specifications given in a configuration.
 *
 * @param {*} configuration
 * @returns
 */

const resizeImageWebp = (configuration) => {
  return new Promise((resolve, reject) => {
    try {
      configuration.versions.forEach(function (version) {
        gulp
          .src(configuration.source + "/**/*." + configuration.sourceExt)
          .pipe(
            changed(configuration.dest, { extension: version.suffix + ".webp" })
          )
          .pipe(
            through2.obj(async function (file, _, cb) {
              let metadata = await getImageMetadata(file.contents);
              let width = Math.floor((metadata.width * version.percent) / 100);
              let converted = sharp(file.contents)
                .withMetadata()
                .resize({ width: width })
                .webp({
                  quality: Math.floor(version.quality.webp * 100),
                  preset: "photo",
                  effort: webpEffort,
                })
                .toBuffer();
              return converted
                .then(function (buffer) {
                  file.contents = buffer;
                  return cb(null, file);
                })
                .catch(function (err) {
                  console.error(err);
                  return cb(null, file);
                });
            })
          )
          .pipe(
            rename(function (path) {
              path.extname = version.suffix + ".webp";
            })
          )
          .pipe(gulp.dest(configuration.dest));
      });
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Use `sharp` to get the metadata for an image.
 *
 * @param {*} input
 * @returns
 */
const getImageMetadata = async (input) => {
  return await sharp(input).metadata();
};

/**
 * Convert files to AVIF according to the specifications given in a configuration.
 *
 * @param {*} configuration
 * @returns
 */
const resizeImageAvif = (configuration) => {
  return new Promise((resolve, reject) => {
    try {
      configuration.versions.forEach(function (version) {
        gulp
          .src(configuration.source + "/**/*." + configuration.sourceExt)
          .pipe(
            changed(configuration.dest, { extension: version.suffix + ".avif" })
          )
          .pipe(
            through2.obj(async function (file, _, cb) {
              let metadata = await getImageMetadata(file.contents);
              let width = Math.floor((metadata.width * version.percent) / 100);
              let converted = sharp(file.contents)
                .withMetadata()
                .resize({ width: width })
                .avif({
                  quality: Math.floor(version.quality.avif * 100),
                  effort: avifEffort,
                })
                .toBuffer();
              return converted
                .then(function (buffer) {
                  file.contents = buffer;
                  return cb(null, file);
                })
                .catch(function (err) {
                  console.error(err);
                  return cb(null, file);
                });
            })
          )
          .pipe(
            rename(function (path) {
              path.extname = version.suffix + ".avif";
            })
          )
          .pipe(gulp.dest(configuration.dest));
      });
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate placeholders according to a configuration. The configuration should
 * specify `configuration.source`, `configuration.dest`, and optionally,
 * `configuration.format` ('jpeg' or 'webp', defaults to 'webp').
 *
 * @param {*} configuration
 * @returns
 */
const generatePlaceholders = async (configuration) => {
  return new Promise(async (resolve, reject) => {
    const imgFormat = configuration.format || "webp";
    try {
      gulp
        .src(configuration.source + "/**/*.png")
        .pipe(changed(configuration.dest, { extension: "." + imgFormat }))
        .pipe(
          through2.obj(async function (file, _, cb) {
            var filePath = path.join(
              configuration.source,
              path.relative(file.base, file.path)
            );
            const result = await lqip(filePath, { outputFormat: imgFormat });
            var outputFile = new File();
            outputFile.path = path.relative(file.base, file.path);
            outputFile.contents = result.content;
            this.push(outputFile);
            cb();
          })
        )
        .pipe(
          rename(function (path) {
            path.extname = "." + imgFormat;
          })
        )
        .pipe(gulp.dest(configuration.dest));
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
};

/* ======================================================================
 * EXPORTS
 * ====================================================================== */

export {
  resizeImageJpg,
  resizeImageWebp,
  resizeImageAvif,
  generatePlaceholders,
};
