#!/bin/bash -e

# ***DO NOT MOVE***
# The following block cannot be moved to the end of issue_ssl; incase issue_ssl fails this wont be run; 
# Needs review if being moved.
perl -i -pe"s/--force-renewal/--dry-run/g" docker-compose.yaml

REPO="$(dirname $(dirname $(pwd)))"
NGINX_CONF="$REPO/infra/nginx/prod/nginx-conf"
cp $NGINX_CONF/post $NGINX_CONF/default.conf
# ***DO NOT MOVE***

docker compose -p "cypherpost" up -d