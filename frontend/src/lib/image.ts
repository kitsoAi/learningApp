export async function resizeImageToAspect(
  file: File,
  width: number,
  height: number
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const passthroughTypes = new Set([
    "image/svg+xml",
    "image/gif",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/heic",
    "image/heif",
  ]);

  if (passthroughTypes.has(file.type)) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    let image: HTMLImageElement;
    try {
      image = await loadImage(imageUrl);
    } catch {
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    const targetRatio = width / height;
    const sourceRatio = image.width / image.height;

    let sourceWidth = image.width;
    let sourceHeight = image.height;
    let sourceX = 0;
    let sourceY = 0;

    // Center-crop to the target ratio before resizing.
    if (sourceRatio > targetRatio) {
      sourceWidth = image.height * targetRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else if (sourceRatio < targetRatio) {
      sourceHeight = image.width / targetRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });

    if (!blob) {
      return file;
    }

    const basename = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${basename}-course.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image for resizing"));
    image.src = src;
  });
}
