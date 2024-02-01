import { expect } from 'chai';

import S3 from 'wuffle/lib/apps/dump-store/s3/S3.js';

const configured = [
  process.env.AWS_ACCESS_KEY_ID,
  process.env.AWS_SECRET_ACCESS_KEY,
  process.env.S3_BUCKET,
  process.env.S3_KEY
].every(f => f);


(configured ? describe : describe.skip)('apps/dump-store/s3 - S3', function() {

  it('should dump and restore', async function() {

    // given
    const s3 = new S3();

    const dump = JSON.stringify({
      foo: {
        bar: 'yea'
      },
      other: 1111111
    });

    // when
    await s3.upload(dump);

    const updated = await s3.download();

    // then
    expect(updated).to.eql(dump);
  });

});
