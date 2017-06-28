#!/usr/bin/env bash
meteor reset
meteor npm install
METEOR_PACKAGE_DIRS=../../ meteor test --driver-package practicalmeteor:mocha
