#!/usr/bin/env bash
mv -v ./tests /tmp/
meteor publish
mv -v /tmp/tests ./
