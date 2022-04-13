#!/bin/bash -e

head -n -1 .env > temp.env ; mv temp.env .env
echo "CERTBOT_RUNMODE=--force-renewal" >> .env
# Create default.conf nginx using pre.conf
REPO="$(dirname $(dirname $(pwd)))"
NGINX_CONF="$REPO/infra/nginx/prod/nginx-conf"
cat $NGINX_CONF/pre.conf
cp $NGINX_CONF/pre.conf $NGINX_CONF/default.conf
# Run docker-compose up to aquire SSL certificates
docker-compose up -d
# Run docker-compose down
docker-compose down
