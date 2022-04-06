#!/bin/bash

touch .env
REPO=$(dirname $(pwd))
echo REPO
echo "REPO=$REPO/app" > .env
mkdir ~/.keys
openssl genrsa -out ~/.keys/sats_sig.pem 2048
openssl rsa -in ~/.keys/sats_sig.pem -outform PEM -pubout -out $HOME/.keys/sats_sig.pub
echo "KEYS=$HOME/.keys" >> .env
