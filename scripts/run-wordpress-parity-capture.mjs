import { captureParityBatch, finalizeParityCapture } from './capture-wordpress-parity.mjs';

const phase = process.argv[2] || 'after';
const astroBase = process.argv[3] || 'http://127.0.0.1:4321/';
const batchSize = Number(process.argv[4] || 2);

for (let start = 0; start < 42; start += batchSize) {
  console.log(await captureParityBatch(phase, start, batchSize, astroBase));
}
console.log(await finalizeParityCapture(phase));
