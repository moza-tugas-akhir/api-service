import * as Minio from 'minio';

export async function minioConnect() {
  const minioClient = new Minio.Client({
    endPoint: 'bucket-production-6220.up.railway.app',
    port: 443,
    useSSL: true,
    accessKey: 'KtrxDhMlwW8VWbFtzal2sdd1G7oMD3xw',
    secretKey: 'SZoCbveQZTeEDvHtcAqAFN6EO3kWR3pFZIhEAIQdnvtivRFD',
  });

  try {
    await minioClient.makeBucket('test-bucket', '');
    console.log('Bucket created successfully in "us-east-1"');
  } catch (err) {
    if (
      err.code !== 'BucketAlreadyOwnedByYou' &&
      err.code !== 'BucketAlreadyExists'
    ) {
      console.log('Error creating bucket with object lock.', err);
    }
  }

  return minioClient;
}

export function listBuckets(minioClient) {
  minioClient.listBuckets(function (err, buckets) {
    if (err) return console.log(err);
    console.log('Buckets \n', buckets);
  });
}
