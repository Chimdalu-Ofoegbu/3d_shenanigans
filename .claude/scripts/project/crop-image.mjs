#!/usr/bin/env node
import { execFile } from "node:child_process";
import path from "node:path";
import { ensureDir, one, parseArgs, pathExists } from "../asset-pipeline/fal-queue.mjs";
import { artifactPath, nextIndex, parseIndexedName } from "../asset-pipeline/request-metadata.mjs";

// Crops a source image (e.g. a phone screenshot) to the photo region as a new indexed source artifact,
// so downstream steps that pick the highest-index source image use the cropped version.

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        error.message = `${command} failed: ${error.message}\n${stderr}`;
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function imageSize(image) {
  const stdout = await run("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", image]);
  const [width, height] = stdout.trim().split(",").map(Number);
  return { width, height };
}

function parseCrop(value) {
  const match = String(value).match(/^(\d+):(\d+):(\d+):(\d+)$/);
  if (!match) throw new Error("--crop must be <width>:<height>:<x>:<y> in pixels.");
  const [width, height, x, y] = match.slice(1).map(Number);
  return { width, height, x, y };
}

async function main() {
  const { flags } = parseArgs();
  const image = one(flags, "image");
  const cropFlag = one(flags, "crop");

  if (!image) {
    throw new Error(
      "Usage: node crop-image.mjs --image <path> [--crop <w>:<h>:<x>:<y>] [--output-dir <dir>] [--output-slug <slug>]\nWithout --crop, prints the image size so a crop box can be chosen."
    );
  }
  if (!(await pathExists(image))) throw new Error(`Input file does not exist: ${image}`);

  const size = await imageSize(image);
  if (!cropFlag) {
    console.log(JSON.stringify({ image, ...size }, null, 2));
    return;
  }

  const crop = parseCrop(cropFlag);
  if (crop.x + crop.width > size.width || crop.y + crop.height > size.height) {
    throw new Error(`Crop box exceeds image bounds (${size.width}x${size.height}).`);
  }

  const outputDir = one(flags, "output-dir", path.dirname(image));
  const sourceSlug = parseIndexedName(image)?.slug || path.basename(image, path.extname(image));
  const slug = one(flags, "output-slug", `${sourceSlug}-crop`);
  const extension = path.extname(image).toLowerCase() || ".png";
  await ensureDir(outputDir);
  const index = await nextIndex(outputDir);
  const outputPath = artifactPath(outputDir, index, slug, extension);

  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", image,
    "-vf", `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`,
    "-q:v", "2",
    outputPath
  ]);

  console.log(JSON.stringify({ input: image, input_size: size, crop, output: outputPath, index }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
