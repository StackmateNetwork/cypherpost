#!/bin/bash -e

echo "
──────╔╗────────╔═╦╗
╔═╦╦╦═╣╚╦═╦╦╦═╦═╣═╣╚╗
║═╣║║╬║║║╩╣╔╣╬║╬╠═║╔╣
╚═╬╗║╔╩╩╩═╩╝║╔╩═╩═╩═╝
──╚═╩╝──────╚╝";

printf "\n"

if test -f .env; then
    echo "[!] .env file exists"
    cat .env
    echo "Would you like to reconfigure setup? (Y/n)"
    read -r reconfigure
    if [[ $reconfigure == "n" ]]; then
      exit;
    fi
fi

echo "Cypherpost can be run as a public or private server."
echo "As a spam protection measure, public servers requires payment and private servers require a secret invitation code.";
echo "Which server type would you prefer? (PUB/priv)"
read -r TYPE
printf "\n"

echo "At what domain name would you like to host cypherpost on?"
read -r MY_DOMAIN_NAME
printf "\n"

echo "Provide an email at which you will recieve notifications regarding your SSL certificate."
read -r EMAIL
printf "\n"

echo "We will now setup directories on your host which will be used as volumes with each container."
echo "You will only need to provide the parent directory. We will check if child directories for each contianer exists. If not we will create them."
echo "Provide a full path to parent directory for container volumes:"
read -r VOLUMES_PARENT_DIR
printf "\n"

if [[ "$VOLUMES_PARENT_DIR" == */ ]]; then
  VOLUMES_PARENT_DIR=${VOLUMES_PARENT_DIR%?}
fi
NODE_VOLUME="$VOLUMES_PARENT_DIR/node"
MONGO_VOLUME="$VOLUMES_PARENT_DIR/mongo"
CERTS_VOLUME="$VOLUMES_PARENT_DIR/certs"

mkdir -p "$NODE_VOLUME/.keys" 2> /dev/null
mkdir -p "$NODE_VOLUME/winston" 2> /dev/null
mkdir -p "$MONGO_VOLUME/data/db" 2> /dev/null
mkdir -p "$MONGO_VOLUME/configdb" 2> /dev/null
mkdir -p "$CERTS_VOLUME" 2> /dev/null

echo "[*] Container volume parent directories are setup."
printf "\n"

if [[ -f "$CERTS_VOLUME/dhparam.pem" ]]; then
    echo "[*] DHParam exists for nginx server."
else
  openssl dhparam -out "$CERTS_VOLUME/dhparam.pem" 2048
  echo "[*] DHParam setup for nginx server."
fi



if [[ $TYPE == *"priv"* ]] || [[ $TYPE == *"PRIV"* ]] ; then
  if [[ $(uname) == "Darwin" ]]; then
    SECRET=$(echo $RANDOM | md5 );
  else
    SECRET=$(echo $RANDOM | md5sum |  cut -d' ' -f1);
  fi
  echo "[*] Setting up as a private server."
  echo "[!] Use the following secret to invite members to your cypherpost server: $SECRET"
else
  TYPE="public"
  SECRET="public"
  echo "[*] Setting up as public server."
fi

mkdir -p ~/.keys 2> /dev/null
openssl genrsa -out ~/.keys/sats_sig.pem 4096 2> /dev/null
openssl rsa -in ~/.keys/sats_sig.pem -outform PEM -pubout -out ~/.keys/sats_sig.pub 2> /dev/null
echo "[*] Generated new server signing keys."

## NGINX CONFIG
REPO="$(dirname $(dirname $(pwd)))"
REPO_NGINX_CONF="$REPO/infra/nginx/prod/nginx-conf"
rm -rf "$REPO_NGINX_CONF/default.conf"
rm -rf "$REPO_NGINX_CONF/pre" "$REPO_NGINX_CONF/post"

cp "$REPO_NGINX_CONF/pre_template" "$REPO_NGINX_CONF/pre" 
perl -i -pe"s/___DOMAIN___/$MY_DOMAIN_NAME/g" "$REPO_NGINX_CONF/pre"

cp "$REPO_NGINX_CONF/post_template" "$REPO_NGINX_CONF/post" 
perl -i -pe"s/___DOMAIN___/$MY_DOMAIN_NAME/g" "$REPO_NGINX_CONF/post"

echo "[*] Created nginx pre & post conf files with $MY_DOMAIN_NAME as hostname."

touch .env
echo "COMPOSE_PROJECT_NAME=cypherpost-prod" >> .env
echo "REPO=$REPO/app" > .env
echo "KEYS=$HOME/.keys" >> .env
echo "TYPE=$TYPE" >> .env
echo "SECRET=$SECRET" >> .env
echo "DOMAIN=$MY_DOMAIN_NAME" >> .env
echo "EMAIL=$EMAIL" >> .env
echo "NODE_VOLUME=$NODE_VOLUME" >> .env
echo "MONGO_VOLUME=$MONGO_VOLUME" >> .env
echo "CERTS_VOLUME=$CERTS_VOLUME" >> .env
echo "CERTBOT_RUNMODE=--force-renewal" >> .env

echo "[*] SETUP COMPLETE! VERIFY YOUR .ENV"
cat .env
echo "[!] Make sure your domain name points to this server's IP."
echo "[!] Run issue_ssl.sh OR start.sh directly if you have ssl certs issued."