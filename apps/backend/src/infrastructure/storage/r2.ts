export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  file: File,
  publicBaseUrl: string,
): Promise<string> {
  const buffer = await file.arrayBuffer();
  await bucket.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });
  return `${publicBaseUrl}/${key}`;
}
