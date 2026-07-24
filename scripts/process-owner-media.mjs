import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const auditFile = path.join(root, '.audit-cache', 'owner-media', 'metadata.json');
const inventoryFile = path.join(root, 'reports', 'public', 'owner-media-inventory.csv');
const placementFile = path.join(root, 'reports', 'public', 'owner-media-placement-plan.md');
const gapFile = path.join(root, 'reports', 'public', 'photography-gap-register.csv');
const assetDir = path.join(root, 'public', 'assets', 'media', 'owner');

const subject = [
  'Worker aligning an aircond mounting rail','Empty room with wall-mounted aircond','Residential exterior with outdoor aircond units',
  'Worker aligning an aircond mounting rail','Residential exterior with outdoor condenser units','Outdoor unit on a roof area',
  'Daikin outdoor condenser unit','Residential entrance and outdoor condenser','Indoor wall, distribution board and partial hand',
  'Worker beside aircond conduit','Wall-mounted indoor aircond unit','Wall-mounted aircond unit with trunking',
  'Residential exterior with condenser unit','Close-up of hand sealing trim','Close-up of hand finishing a surface',
  'Wall-mounted aircond unit with bracket and trunking','Worker, ladder and outdoor condenser','Worker taking an indoor measurement',
  'Worker at an open distribution board','Brush work near outlets and trunking','Worker servicing an open indoor aircond',
  'Worker on ladder servicing open aircond','Panasonic outdoor condenser','Worker at an open distribution board',
  'Worker servicing indoor aircond','Worker servicing aircond near household shelving','Ceiling fan',
  'Worker wiping an indoor aircond','Worker servicing open indoor aircond','Worker servicing open indoor aircond',
];
const category = [
  'Aircond installation','Aircond installation','Aircond installation','Aircond installation','Aircond installation',
  'Aircond installation','Aircond installation','Aircond installation','Aircond installation','Aircond installation',
  'Aircond installation','Aircond installation','Aircond installation','Aircond installation','Aircond installation',
  'Aircond installation','Aircond installation','Aircond installation','Electrical work','Unclear finishing work',
  'Aircond servicing','Aircond servicing','Aircond installation','Electrical work','Aircond servicing','Aircond servicing',
  'Electrical work','Aircond servicing','Aircond servicing','Aircond servicing',
];
const quality = [
  'GOOD','FAIR','GOOD','GOOD','GOOD','FAIR','GOOD','FAIR','POOR','FAIR','GOOD','GOOD','GOOD','FAIR','FAIR',
  'GOOD','FAIR','GOOD','FAIR','FAIR','GOOD','GOOD','FAIR','FAIR','GOOD','FAIR','FAIR','FAIR','GOOD','GOOD',
];
const related = {
  1:'RELATED_SEQUENCE_01_04',3:'RELATED_SEQUENCE_03_05_08_13',4:'RELATED_SEQUENCE_01_04',5:'RELATED_SEQUENCE_03_05_08_13',
  8:'RELATED_SEQUENCE_03_05_08_13',11:'RELATED_SEQUENCE_11_12_16',12:'RELATED_SEQUENCE_11_12_16',
  13:'RELATED_SEQUENCE_03_05_08_13',14:'RELATED_SEQUENCE_14_15',15:'RELATED_SEQUENCE_14_15',
  16:'RELATED_SEQUENCE_11_12_16',19:'RELATED_SEQUENCE_19_24',21:'RELATED_SEQUENCE_21_22',
  22:'RELATED_SEQUENCE_21_22',24:'RELATED_SEQUENCE_19_24',25:'RELATED_SEQUENCE_25_26_29_30',
  26:'RELATED_SEQUENCE_25_26_29_30',29:'RELATED_SEQUENCE_25_26_29_30',30:'RELATED_SEQUENCE_25_26_29_30',
};
const selected = {
  7: {
    stem: 'rk-reno-aircond-outdoor-condenser', widths: [480, 720],
    pages: '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/', section: 'Page hero',
    alt: 'Owner-supplied image of an outdoor aircond condenser unit',
    caption: 'Outdoor aircond condenser unit; location and project details are not published.',
  },
  11: {
    stem: 'rk-reno-wall-mounted-aircond-unit', widths: [480, 960],
    pages: '/aircond-installation-kl/; /aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
    section: 'Page hero; article lead image',
    alt: 'Owner-supplied image of a wall-mounted aircond unit',
    caption: 'Wall-mounted aircond unit; location and project details are not published.',
  },
  12: {
    stem: 'rk-reno-aircond-unit-trunking', widths: [480, 960],
    pages: '/upah-pasang-aircond-selangor/', section: 'Page hero',
    alt: 'Imej pemilik bagi unit aircond pada dinding dengan trunking',
    caption: 'Unit aircond dengan trunking; lokasi dan butiran projek tidak diterbitkan.',
  },
  16: {
    stem: 'rk-reno-aircond-indoor-unit-service-access', widths: [480, 960],
    pages: '/servis-aircond-murah-kl/; /servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
    section: 'Page hero; article lead image',
    alt: 'Owner-supplied image of a wall-mounted aircond unit and service access area',
    caption: 'Wall-mounted aircond unit and service access area; location and project details are not published.',
  },
};
const rejected = new Set([2, 9, 14, 15, 20, 23, 27]);
const branded = new Set([1,4,10,17,18,21,22,25,26,29,30]);
const people = new Set([1,4,9,10,14,15,17,18,19,20,21,22,24,25,26,28,29,30]);
const privateContext = new Set([3,5,6,8,9,13,17,18,19,21,22,24,25,26,28,29,30]);
const safetyContext = new Set([17,19,21,22,24,25,26,29,30]);

const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const formatBytes = (bytes) => `${bytes} bytes`;
const metadata = JSON.parse(await fs.readFile(auditFile, 'utf8'));
await fs.mkdir(assetDir, { recursive: true });

for (const item of metadata.filter((entry) => entry.id.startsWith('photo-'))) {
  const number = Number(item.id.split('-')[1]);
  const choice = selected[number];
  if (!choice) continue;
  for (const width of choice.widths) {
    await sharp(item.absolutePath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(path.join(assetDir, `${choice.stem}-${width}.webp`));
  }
}

const headers = [
  'Original filename','File type','File size','Image dimensions','Video dimensions','Video duration','Orientation',
  'Quality','Duplicate or near-duplicate status','Main subject','Service category','Location if identifiable/appropriate',
  'People visible','Branding or logos visible','Private or sensitive information visible','Appears to show genuine RK Reno work',
  'Suggested website page','Suggested website section','Recommended use','Selected or rejected','Rejection reason','Public filename','Alt text',
  'Caption','Crop requirement','Compression requirement','Privacy correction requirement','Owner confirmation required',
];
const rows = metadata.map((item) => {
  if (item.id === 'video-01') return [
    item.originalFilename,item.fileType,formatBytes(item.fileSize),'',`${item.width}x${item.height}`,`${item.duration.toFixed(3)} seconds`,
    item.orientation,'GOOD','UNIQUE','Handheld power tool polishing or sanding a wet light-coloured surface','Service category unclear',
    'NOT_IDENTIFIABLE','HAND_ONLY','NO','NO_OBVIOUS_SENSITIVE_INFORMATION','POSSIBLE_OWNER_SUPPLIED_WORK_NOT_VERIFIED',
    'None until service and consent are confirmed','None','Keep original local; no public derivative','HOLD_OWNER_CONFIRMATION',
    'Service context is unclear; public use requires confirmation that this is RK Reno work and is safe to present.','','','','NONE',
    'REQUIRED_IF_SELECTED','NONE','YES',
  ];
  const number = Number(item.id.split('-')[1]);
  const choice = selected[number];
  const state = choice ? 'SELECTED' : rejected.has(number) ? 'REJECTED' : 'HOLD_OWNER_CONFIRMATION';
  const flags = [
    branded.has(number) && 'alternate phone number visible on worker shirt',
    privateContext.has(number) && 'private residence or household context',
    safetyContext.has(number) && 'PPE or electrical-safety context needs confirmation',
  ].filter(Boolean);
  const rejectReason = choice ? '' : rejected.has(number)
    ? ({
        2:'Weak composition and limited service context',9:'Poor composition and private interior context',
        14:'Very tight, unclear finishing detail',15:'Very tight, unclear finishing detail',
        20:'Service category is unclear',23:'Low-context manufacturer-focused image',
        27:'Ceiling fan alone does not evidence electrical service work',
      })[number]
    : flags.join('; ') || 'Context or ownership needs confirmation before public use';
  return [
    item.originalFilename,item.fileType,formatBytes(item.fileSize),`${item.width}x${item.height}`,'','',item.orientation,
    quality[number - 1],related[number] || 'UNIQUE',subject[number - 1],category[number - 1],'NOT_IDENTIFIABLE',
    people.has(number) ? 'YES' : 'NO',
    branded.has(number) ? 'RK Reno shirt plus 014-3319006 and 01111-334496' : ([7,23].includes(number) ? 'MANUFACTURER_LOGO_ONLY' : 'NO'),
    flags.length ? flags.join('; ') : 'NO_OBVIOUS_SENSITIVE_INFORMATION',
    choice ? 'OWNER_SUPPLIED_SERVICE_IMAGERY_NOT_PROJECT_VERIFIED' : 'POSSIBLE_OWNER_SUPPLIED_WORK_NOT_VERIFIED',
    choice?.pages || 'None pending review',choice?.section || 'None',
    choice ? 'Responsive WebP derivative' : (rejected.has(number) ? 'Keep original local only' : 'Hold locally pending owner confirmation'),
    state,rejectReason,choice ? choice.widths.map((width) => `${choice.stem}-${width}.webp`).join('; ') : '',
    choice?.alt || '',choice?.caption || '','NONE',choice ? 'WEBP_QUALITY_80_METADATA_STRIPPED' : 'NONE',
    flags.length ? 'OWNER_APPROVAL_REQUIRED; do not edit people, branding, or objects without separate approval' : 'NONE',
    choice || rejected.has(number) ? 'NO' : 'YES',
  ];
});
await fs.writeFile(inventoryFile, [headers, ...rows].map((row) => row.map(csv).join(',')).join('\n') + '\n');

const placement = `# Owner Media Placement Plan

## Audit outcome

- Reviewed: **31 originals** (30 JPEG photos and 1 MP4 video).
- Selected: **4 photos**, exported as **8 responsive WebP derivatives**.
- Website routes receiving owner media: **9** (6 direct page/article placements and 3 archive-card views).
- Neutral primary images replaced: **6**. Neutral imagery remains on **36** tracked photography-gap routes where this aircond set was unsuitable or incomplete.
- Held for owner confirmation: **20 files**.
- Rejected from public use: **7 files**.
- Exact duplicates: **0**. Twelve files are alternates within visually related capture sequences.
- Privacy/safety review: **20 files flagged** for one or more owner-confirmation issues; this includes 11 with an unconfirmed alternate shirt phone number, 17 with private-property context, and 9 with PPE/electrical-safety context (categories overlap).
- Performance impact: **245,542 bytes** across all 8 WebP derivatives; responsive source selection is enabled and below-fold article/archive images lazy-load.
- Files committed to website assets: **8 image derivatives**. Videos selected: **0**.
- Files intentionally kept local: **31 originals**, including the video and all rejected/held media.
- Originals remain local under ignored \`Media/\`; no original, EXIF/GPS data, or video was copied into public assets.

## Approved placements

| Owner photo | Public derivative | Placement | Why it is suitable |
|---|---|---|---|
| photo-11 | \`rk-reno-wall-mounted-aircond-unit-{480,960}.webp\` | \`/aircond-installation-kl/\` and its installation guide | Clear aircond subject; no people, private identifiers, or unverified location claim |
| photo-12 | \`rk-reno-aircond-unit-trunking-{480,960}.webp\` | \`/upah-pasang-aircond-selangor/\` | Relevant installation detail; no people or private identifiers |
| photo-07 | \`rk-reno-aircond-outdoor-condenser-{480,720}.webp\` | Selangor installation price guide | Useful outdoor-unit context; manufacturer mark is incidental |
| photo-16 | \`rk-reno-aircond-indoor-unit-service-access-{480,960}.webp\` | \`/servis-aircond-murah-kl/\` and its maintenance guide | Relevant service-access context; no people or private identifiers |

The same derivative may appear on its directly related service page and guide, but unrelated services retain neutral imagery. Alt text and captions identify these only as owner-supplied aircond imagery. They do **not** claim a completed RK Reno project, customer, address, or location.

## Held or rejected media

Worker images are held where shirts show an additional phone number (\`014-3319006\`) that has not been confirmed against the site contact number. Residence exteriors/interiors and open electrical-board or ladder scenes are also held until privacy, consent, service ownership, and safe-work context are confirmed. No faces, people, branding, or objects were edited.

The short video is clear enough to review, but the exact service and surface are ambiguous. It remains local and should not be published until the owner confirms what it depicts, that it is RK Reno work, and that public use is appropriate.

## Future capture gaps

Still recommended: consent-cleared team/worksite photography, electrical work with appropriate PPE and safe context, renovation before/during/after sets, waterproofing, plaster ceiling, cleaning, painting, commercial fit-out, repair work, and exterior/property imagery that cannot identify a private customer. Capture location details separately and publish them only with owner/customer approval.
`;
await fs.writeFile(placementFile, placement);

const parseCsvLine = (line) => {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else value += character;
  }
  values.push(value);
  return values;
};
const resolvedRoutes = new Set([
  '/servis-aircond-murah-kl/','/aircond-installation-kl/','/upah-pasang-aircond-selangor/',
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/',
]);
const routeImages = {
  '/servis-aircond-murah-kl/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
  '/aircond-installation-kl/': '/assets/media/owner/rk-reno-wall-mounted-aircond-unit-960.webp',
  '/upah-pasang-aircond-selangor/': '/assets/media/owner/rk-reno-aircond-unit-trunking-960.webp',
  '/upah-pasang-aircond-selangor-panduan-harga-pemasangan-2026/': '/assets/media/owner/rk-reno-aircond-outdoor-condenser-720.webp',
  '/aircond-installation-kl-the-ultimate-2026-guide-rk-reno-solution/': '/assets/media/owner/rk-reno-wall-mounted-aircond-unit-960.webp',
  '/servis-aircond-murah-kl-the-ultimate-2026-guide-to-a-colder-home/': '/assets/media/owner/rk-reno-aircond-indoor-unit-service-access-960.webp',
};
const partialRoutes = new Set(['/category/hvac-guides/','/category/maintenance/','/category/technical-guides/']);
const confirmationRoutes = new Set(['/','/services/','/about-us/']);
const unsuitableRoutes = new Set([
  '/electrical-services-selangor/',
  '/electrical-services-selangor-the-complete-safety-pricing-guide-2026-edition/',
]);
const gapLines = (await fs.readFile(gapFile, 'utf8')).trim().split(/\r?\n/).map(parseCsvLine);
const gapHeaders = gapLines[0];
const existingStatusIndex = gapHeaders.indexOf('Owner media resolution');
if (existingStatusIndex === -1) gapHeaders.push('Owner media resolution');
for (const row of gapLines.slice(1)) {
  const route = row[0];
  const resolution = resolvedRoutes.has(route) ? 'RESOLVED_WITH_OWNER_MEDIA'
    : partialRoutes.has(route) ? 'PARTIALLY_RESOLVED'
    : confirmationRoutes.has(route) ? 'OWNER_CONFIRMATION_REQUIRED'
    : unsuitableRoutes.has(route) ? 'OWNER_MEDIA_NOT_SUITABLE'
    : 'STILL_RECOMMENDED_AFTER_LAUNCH';
  if (existingStatusIndex === -1) row.push(resolution);
  else row[existingStatusIndex] = resolution;
  if (routeImages[route]) {
    row[gapHeaders.indexOf('Current image')] = routeImages[route];
    row[gapHeaders.indexOf('General service image')] = 'NO';
    row[gapHeaders.indexOf('Verified RK Reno project image')] = 'OWNER-SUPPLIED - COMPLETED PROJECT NOT CLAIMED';
    row[gapHeaders.indexOf('Image quality')] = 'GOOD';
    row[gapHeaders.indexOf('Owner replacement recommended')] = 'NO';
    row[gapHeaders.indexOf('Notes')] = 'Reviewed owner-supplied aircond imagery. Metadata was stripped; no customer, completed-project, or location claim is made.';
  }
}
await fs.writeFile(gapFile, gapLines.map((row) => row.map(csv).join(',')).join('\n') + '\n');
console.log(`Processed ${Object.keys(selected).length} photos and wrote owner-media reports.`);
