import content from '../../config/pakej-deep-cleaning-rumah-kl-content.json';
import imageManifest from '../../config/pakej-deep-cleaning-rumah-kl-images.json';

export const pakejDeepCleaningRumahKl = content;
export const cleaningImages = Object.fromEntries(imageManifest.images.map((image) => [image.role, image]));
export const cleaningImageManifest = imageManifest;
