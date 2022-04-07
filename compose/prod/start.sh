#!/bin/bash -e

# Create default.conf nginx using pre.conf
REPO="$(dirname $(dirname $(pwd)))"
NGINX_CONF="$REPO/infra/nginx/dev/nginx-conf"
cp $NGINX_CONF/pre.conf $NGINX_CONF/default.conf
# Run docker-compose up to aquire SSL certificates
docker-compose up -d
# Run docker-compose down
docker-compose down
# Create default.conf nginx using post.conf
cp $NGINX_CONF/post.conf $NGINX_CONF/default.conf
# Change CERTBOT_RUNMODE to dry-run
head -n -1 .env > temp.env ; mv temp.env .env
echo "CERTBOT_RUNMODE=--dry-run" >> .env
# Re-run docker-compose up
docker-compose up -d