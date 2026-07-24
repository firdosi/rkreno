import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import exifr from 'exifr';
import { chromium } from 'playwright';

const mediaRoot = path.resolve('Media');
const outputRoot = path.resolve('.audit-cache', 'owner-media');
const thumbRoot = path.join(outputRoot, 'thumbnails');
const videoRoot = path.join(outputRoot, 'video-frames');
await fs.mkdir(thumbRoot, { recursive: true });
await fs.mkdir(videoRoot, { recursive: true });

const files = (await fs.readdir(mediaRoot, { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => path.join(mediaRoot, entry.name))
  .sort((left, right) => left.localeCompare(right, 'en'));
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const sha256 = async (file) =>
  crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
const orientation = (width, height) =>
  width === height ? 'square' : width > height ? 'landscape' : 'portrait';

async function differenceHash(file) {
  const { data } = await sharp(file).rotate().resize(9, 8, { fit: 'fill' })
    .greyscale().raw().toBuffer({ resolveWithObject: true });
  let bits = '';
  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      bits += data[row * 9 + column] > data[row * 9 + column + 1] ? '1' : '0';
    }
  }
  return bits;
}

function hamming(left, right) {
  let distance = 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) distance++;
  }
  return distance;
}

const records = [];
let imageNumber = 0;
for (const file of files.filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))) {
  imageNumber++;
  const stats = await fs.stat(file);
  const metadata = await sharp(file).metadata();
  const displayedWidth = metadata.autoOrient?.width || metadata.width;
  const displayedHeight = metadata.autoOrient?.height || metadata.height;
  let exif = {};
  try {
    exif = await exifr.parse(file, {
      tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: false,
    }) || {};
  } catch {
    exif = {};
  }
  const id = `photo-${String(imageNumber).padStart(2, '0')}`;
  const thumbnail = path.join(thumbRoot, `${id}.png`);
  await sharp(file).rotate().resize(480, 360, {
    fit: 'contain', background: '#222',
  }).png().toFile(thumbnail);
  records.push({
    id,
    originalFilename: path.basename(file),
    absolutePath: file,
    fileType: metadata.format || path.extname(file).slice(1),
    fileSize: stats.size,
    width: displayedWidth,
    height: displayedHeight,
    orientation: orientation(displayedWidth, displayedHeight),
    originalOrientationTag: metadata.orientation || null,
    sha256: await sha256(file),
    differenceHash: await differenceHash(file),
    metadata: {
      hasExif: Boolean(metadata.exif),
      hasIcc: Boolean(metadata.icc),
      hasXmp: Boolean(metadata.xmp),
      hasGps: Number.isFinite(exif.latitude) || Number.isFinite(exif.longitude)
        || Object.keys(exif).some((key) => /^GPS/i.test(key)),
      hasAuthorOrCopyright: Boolean(exif.Artist || exif.Copyright || exif.Creator),
      make: exif.Make || null,
      model: exif.Model || null,
      capturedAtPresent: Boolean(exif.DateTimeOriginal || exif.CreateDate),
    },
    thumbnail,
  });
}

const videos = files.filter((file) => path.extname(file).toLowerCase() === '.mp4');
if (videos.length) {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [videoIndex, file] of videos.entries()) {
      const stats = await fs.stat(file);
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      const video = page.locator('video').first();
      await video.waitFor({ state: 'visible', timeout: 15_000 });
      await page.waitForFunction(() => {
        const element = document.querySelector('video');
        return element && Number.isFinite(element.duration) && element.videoWidth > 0;
      });
      const videoMetadata = await video.evaluate((element) => ({
        width: element.videoWidth,
        height: element.videoHeight,
        duration: element.duration,
      }));
      const id = `video-${String(videoIndex + 1).padStart(2, '0')}`;
      const frames = [];
      for (const [frameIndex, fraction] of [.15, .5, .85].entries()) {
        await video.evaluate(async (element, time) => {
          element.pause();
          element.currentTime = time;
          await new Promise((resolve) =>
            element.addEventListener('seeked', resolve, { once: true }));
        }, videoMetadata.duration * fraction);
        const frame = path.join(videoRoot, `${id}-${frameIndex + 1}.png`);
        await video.screenshot({ path: frame });
        frames.push(frame);
      }
      records.push({
        id,
        originalFilename: path.basename(file),
        absolutePath: file,
        fileType: 'mp4',
        fileSize: stats.size,
        width: videoMetadata.width,
        height: videoMetadata.height,
        duration: videoMetadata.duration,
        orientation: orientation(videoMetadata.width, videoMetadata.height),
        sha256: await sha256(file),
        frames,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

const photos = records.filter(({ differenceHash }) => differenceHash);
for (const photo of photos) {
  photo.exactDuplicates = photos
    .filter((other) => other.id !== photo.id && other.sha256 === photo.sha256)
    .map(({ id }) => id);
  photo.nearDuplicates = photos
    .filter((other) => other.id !== photo.id
      && other.sha256 !== photo.sha256
      && hamming(photo.differenceHash, other.differenceHash) <= 6)
    .map(({ id }) => id);
}

const cells = await Promise.all(photos.map(async (record, index) => {
  const image = await sharp(record.thumbnail).resize(360, 270, { fit: 'fill' }).toBuffer();
  const label = Buffer.from(
    `<svg width="360" height="310"><rect width="360" height="310" fill="#eee"/>
      <text x="10" y="25" font-family="Arial" font-size="18" font-weight="700">${record.id}</text>
    </svg>`,
  );
  return {
    input: await sharp(label).composite([{ input: image, top: 40, left: 0 }]).png().toBuffer(),
    left: (index % 4) * 370,
    top: Math.floor(index / 4) * 320,
  };
}));
await sharp({
  create: {
    width: 1470,
    height: Math.ceil(photos.length / 4) * 320 - 10,
    channels: 3,
    background: '#ccc',
  },
}).composite(cells).png().toFile(path.join(outputRoot, 'photo-contact-sheet.png'));

await fs.writeFile(
  path.join(outputRoot, 'metadata.json'),
  `${JSON.stringify(records, null, 2)}\n`,
);
console.log(`Audited ${photos.length} photos and ${videos.length} videos in ${outputRoot}`);
