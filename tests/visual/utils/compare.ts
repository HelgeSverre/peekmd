import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CompareResult {
  match: boolean;
  diffPixels: number;
  totalPixels: number;
  diffPercentage: number;
  diffImagePath?: string;
  actualImagePath?: string;
  dimensions: {
    actual: ImageDimensions;
    expected: ImageDimensions;
    compared: ImageDimensions;
    sizeMismatch: boolean;
  };
}

export interface CompareOptions {
  threshold?: number; // Pixelmatch threshold (0-1), default 0.1
  maxDiffPercentage?: number; // Max allowed diff percentage, default 0.5
  diffOutputPath?: string; // Path to save diff image on failure
  actualOutputPath?: string; // Path to save actual image on failure
}

export async function compareImages(
  actualBuffer: Buffer,
  expectedBuffer: Buffer,
  options: CompareOptions = {}
): Promise<CompareResult> {
  const { threshold = 0.1, maxDiffPercentage = 0.5, diffOutputPath, actualOutputPath } = options;

  const actualPng = PNG.sync.read(actualBuffer);
  const expectedPng = PNG.sync.read(expectedBuffer);

  // Track dimensions
  const actualDimensions: ImageDimensions = { width: actualPng.width, height: actualPng.height };
  const expectedDimensions: ImageDimensions = { width: expectedPng.width, height: expectedPng.height };
  const sizeMismatch = actualPng.width !== expectedPng.width || actualPng.height !== expectedPng.height;

  // Log dimension mismatch
  if (sizeMismatch) {
    console.warn(
      `Dimension mismatch: actual ${actualPng.width}x${actualPng.height}, expected ${expectedPng.width}x${expectedPng.height}`
    );
  }

  // Handle size differences by padding/cropping to match
  const width = Math.max(actualPng.width, expectedPng.width);
  const height = Math.max(actualPng.height, expectedPng.height);

  // Resize images to same dimensions if needed
  const normalizedActual = normalizeImage(actualPng, width, height);
  const normalizedExpected = normalizeImage(expectedPng, width, height);

  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    normalizedActual.data,
    normalizedExpected.data,
    diff.data,
    width,
    height,
    { threshold }
  );

  const totalPixels = width * height;
  const diffPercentage = (diffPixels / totalPixels) * 100;
  const match = diffPercentage <= maxDiffPercentage;

  let diffImagePath: string | undefined;
  let actualImagePath: string | undefined;

  // Save diff and actual images if comparison failed and output paths provided
  if (!match) {
    if (diffOutputPath) {
      diffImagePath = diffOutputPath;
      await saveDiffImage(diff, diffOutputPath);
    }
    if (actualOutputPath) {
      actualImagePath = actualOutputPath;
      await saveActualImage(actualBuffer, actualOutputPath);
    }
  }

  return {
    match,
    diffPixels,
    totalPixels,
    diffPercentage,
    diffImagePath,
    actualImagePath,
    dimensions: {
      actual: actualDimensions,
      expected: expectedDimensions,
      compared: { width, height },
      sizeMismatch,
    },
  };
}

function normalizeImage(png: PNG, targetWidth: number, targetHeight: number): PNG {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png;
  }

  const normalized = new PNG({ width: targetWidth, height: targetHeight });

  // Fill with white background
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (targetWidth * y + x) << 2;
      normalized.data[idx] = 255; // R
      normalized.data[idx + 1] = 255; // G
      normalized.data[idx + 2] = 255; // B
      normalized.data[idx + 3] = 255; // A
    }
  }

  // Copy original image data
  for (let y = 0; y < png.height && y < targetHeight; y++) {
    for (let x = 0; x < png.width && x < targetWidth; x++) {
      const srcIdx = (png.width * y + x) << 2;
      const dstIdx = (targetWidth * y + x) << 2;
      normalized.data[dstIdx] = png.data[srcIdx];
      normalized.data[dstIdx + 1] = png.data[srcIdx + 1];
      normalized.data[dstIdx + 2] = png.data[srcIdx + 2];
      normalized.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }

  return normalized;
}

async function saveDiffImage(png: PNG, outputPath: string): Promise<void> {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const buffer = PNG.sync.write(png);
  await Bun.write(outputPath, buffer);
}

async function saveActualImage(buffer: Buffer, outputPath: string): Promise<void> {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  await Bun.write(outputPath, buffer);
}

export async function saveBaseline(buffer: Buffer, baselinePath: string): Promise<void> {
  const dir = dirname(baselinePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  await Bun.write(baselinePath, buffer);
}

export async function loadBaseline(baselinePath: string): Promise<Buffer | null> {
  if (!existsSync(baselinePath)) {
    return null;
  }

  return Buffer.from(await Bun.file(baselinePath).arrayBuffer());
}
