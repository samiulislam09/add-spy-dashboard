import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "./env";

export interface ObjectStorage {
  putJson(key: string, payload: unknown): Promise<string>;
}

class S3ObjectStorage implements ObjectStorage {
  private readonly client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials:
      env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  async putJson(key: string, payload: unknown): Promise<string> {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET is required when using S3 object storage");
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: JSON.stringify(payload),
        ContentType: "application/json",
      }),
    );

    return `${env.S3_BUCKET}/${key}`;
  }
}

class NoopObjectStorage implements ObjectStorage {
  async putJson(key: string): Promise<string> {
    return `noop://${key}`;
  }
}

export function createObjectStorage(): ObjectStorage {
  if (env.S3_ENDPOINT && env.S3_BUCKET) {
    return new S3ObjectStorage();
  }

  return new NoopObjectStorage();
}
