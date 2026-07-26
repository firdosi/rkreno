import { startPrivateRuntime, stopPrivateRuntime, simulatorOrigin, previewHost } from './lib/private-runtime.mjs';

const runtime = await startPrivateRuntime();
console.log(JSON.stringify({
  ready: true,
  simulationUrl: simulatorOrigin,
  simulatedHost: previewHost,
  authentication: 'required',
  releaseId: runtime.packageResult.releaseId,
  note: 'Use X-Forwarded-Host and Basic authorization; this is local only.',
}, null, 2));
const stop = async () => {
  await stopPrivateRuntime(runtime);
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
await new Promise(() => {});
