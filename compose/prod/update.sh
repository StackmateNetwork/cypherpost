#!/bin/bash -e
./stop.sh
docker image rm cypherpost-node-ts
git pull
./stop.sh