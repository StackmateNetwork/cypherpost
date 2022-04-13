#!/bin/bash -e
# Change CERTBOT_RUNMODE to dry-run
head -n -1 .env > temp.env ; mv temp.env .env
echo "CERTBOT_RUNMODE=--dry-run" >> .env

REPO="$(dirname $(dirname $(pwd)))"
NGINX_CONF="$REPO/infra/nginx/prod/nginx-conf"
cp $NGINX_CONF/post.conf $NGINX_CONF/default.conf

# Re-run docker-compose up
docker-compose up -d