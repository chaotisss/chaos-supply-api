#!/bin/sh

mv ./wrangler.toml ./wrangler.backup.toml

yarn envsub ./wrangler.backup.toml ./wrangler.toml

echo "${ADMIN_TOKEN}" | yarn wrangler secret put ADMIN_TOKEN

yarn wrangler publish

mv ./wrangler.backup.toml ./wrangler.toml
