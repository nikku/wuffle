const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');

function S3() {

  const {
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    S3_BUCKET: bucket,
    S3_REGION: region,
    S3_KEY: key = 'storedump.json',
    S3_ENDPOINT: endpoint
  } = process.env;

  const s3client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  var params = {
    Bucket: bucket,
    Key: key
  };


  // API

  this.upload = function(dump) {
    return s3client.send(new PutObjectCommand({
      ...params,
      Body: dump
    }));
  };

  this.download = function() {
    return s3client.send(new GetObjectCommand(params)).then(
      data => streamToBuffer(/** @type {import('stream').Readable} */ (data.Body))
    ).then(
      buffer => buffer.toString('utf8')
    );
  };

  this.params = Object.freeze(params);
}

module.exports = S3;


// helpers /////////////////

/**
 * Converts a stream to a buffer.
 *
 * @param {import('stream').Readable} readable
 *
 * @return {Promise<Buffer>}
 */
function streamToBuffer(readable) {
  return new Promise((resolve, reject) => {
    const buffers = [];

    readable.on('error', reject);
    readable.on('data', (data) => buffers.push(data));
    readable.on('end', () => resolve(Buffer.concat(buffers)));
  });
}
