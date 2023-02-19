# Storage

This document explains how the board stores data and what is being stored.


## Persist and Restore

The board attempts to restore existing data using the [configured storage provider](#storage-providers).

While running, it periodically dumps the data back to persistent storage.


## Storage Providers

The board supports the following storage providers.


#### Local Store

The [local provider](https://github.com/nikku/wuffle/blob/main/packages/app/lib/apps/dump-store/local/DumpStoreLocal.js) stores and retrieves data to/from the file `{cwd}/tmp/storedump.json` on the local disk.

That is the default provider.


#### S3 Store

The [S3 provider](https://github.com/nikku/wuffle/blob/main/packages/app/lib/apps/dump-store/s3/DumpStoreS3.js) stores and retrieves data to/from S3.

It enables once you provide the [required configuration properties for it](https://github.com/nikku/wuffle/blob/main/docs/CONFIG.md#persistence).


## What is Being Stored

* Everything synchronized from GitHub
* Two additional entries per issue, `column` and `order`
