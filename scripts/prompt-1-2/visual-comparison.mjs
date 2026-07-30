import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { visualThreshold } from './shared-config.mjs';

const exists = async (file) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

const paddedRaw = async (file, width, height) => {
  const metadata = await sharp(file).metadata();
  const result = await sharp(file)
    .ensureAlpha()
    .extend({
      right: width - metadata.width,
      bottom: height - metadata.height,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .raw()
    .toBuffer();
  return { data: result, metadata };
};

export const compareImages = async ({ sourcePath, stagingPath, differencePath }) => {
  if (!(await exists(sourcePath)) || !(await exists(stagingPath))) {
    return {
      evidenceComplete: false,
      sourceExists: await exists(sourcePath),
      stagingExists: await exists(stagingPath),
      differenceExists: false,
      differences: ['capture-missing'],
    };
  }
  const sourceMeta = await sharp(sourcePath).metadata();
  const stagingMeta = await sharp(stagingPath).metadata();
  const width = Math.max(sourceMeta.width, stagingMeta.width);
  const height = Math.max(sourceMeta.height, stagingMeta.height);
  const [source, staging] = await Promise.all([
    paddedRaw(sourcePath, width, height),
    paddedRaw(stagingPath, width, height),
  ]);
  const pixels = width * height;
  let changedPixels = 0;
  let absoluteChannelDelta = 0;
  const difference = Buffer.alloc(pixels * 4);
  for (let index = 0; index < pixels; index += 1) {
    const offset = index * 4;
    const red = Math.abs(source.data[offset] - staging.data[offset]);
    const green = Math.abs(source.data[offset + 1] - staging.data[offset + 1]);
    const blue = Math.abs(source.data[offset + 2] - staging.data[offset + 2]);
    const maximum = Math.max(red, green, blue);
    if (maximum > visualThreshold.channelDelta) changedPixels += 1;
    absoluteChannelDelta += red + green + blue;
    difference[offset] = Math.min(255, red * 4);
    difference[offset + 1] = Math.min(255, green * 4);
    difference[offset + 2] = Math.min(255, blue * 4);
    difference[offset + 3] = 255;
  }
  await mkdir(path.dirname(differencePath), { recursive: true });
  await sharp(difference, { raw: { width, height, channels: 4 } }).png().toFile(differencePath);
  const changedPixelPercent = pixels ? (changedPixels / pixels) * 100 : 100;
  const dimensionsEqual = sourceMeta.width === stagingMeta.width && sourceMeta.height === stagingMeta.height;
  const differences = [];
  if (!dimensionsEqual) differences.push('dimensions');
  if (changedPixelPercent > visualThreshold.changedPixelPercent) differences.push('pixel-threshold');
  return {
    evidenceComplete: true,
    sourceExists: true,
    stagingExists: true,
    differenceExists: true,
    sourceDimensions: { width: sourceMeta.width, height: sourceMeta.height },
    stagingDimensions: { width: stagingMeta.width, height: stagingMeta.height },
    comparisonDimensions: { width, height },
    dimensionsEqual,
    changedPixels,
    totalPixels: pixels,
    changedPixelPercent,
    meanAbsoluteChannelDelta: absoluteChannelDelta / (pixels * 3),
    channelDeltaThreshold: visualThreshold.channelDelta,
    allowedChangedPixelPercent: visualThreshold.changedPixelPercent,
    differencePath,
    differences,
  };
};

export const boxDifferences = (source, staging, label) => {
  if (!source && !staging) return [];
  if (!source || !staging) return [{ field: label, kind: 'box-missing', source, staging }];
  const differences = [];
  for (const property of ['x', 'y', 'width', 'height']) {
    const delta = Math.abs(source[property] - staging[property]);
    if (delta > visualThreshold.boundingBoxPixels) {
      differences.push({ field: `${label}.${property}`, kind: 'bounding-box', source: source[property], staging: staging[property], delta });
    }
  }
  return differences;
};
