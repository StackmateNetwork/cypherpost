#!/bin/bash

echo ":'######::'##:::'##:'########::'##::::'##:'########:'########::'########:::'#######:::'######::'########:
'##... ##:. ##:'##:: ##.... ##: ##:::: ##: ##.....:: ##.... ##: ##.... ##:'##.... ##:'##... ##:... ##..::
 ##:::..:::. ####::: ##:::: ##: ##:::: ##: ##::::::: ##:::: ##: ##:::: ##: ##:::: ##: ##:::..::::: ##::::
 ##:::::::::. ##:::: ########:: #########: ######::: ########:: ########:: ##:::: ##:. ######::::: ##::::
 ##:::::::::: ##:::: ##.....::: ##.... ##: ##...:::: ##.. ##::: ##.....::: ##:::: ##::..... ##:::: ##::::
 ##::: ##:::: ##:::: ##:::::::: ##:::: ##: ##::::::: ##::. ##:: ##:::::::: ##:::: ##:'##::: ##:::: ##::::
. ######::::: ##:::: ##:::::::: ##:::: ##: ########: ##:::. ##: ##::::::::. #######::. ######::::: ##::::
:......::::::..:::::..:::::::::..:::::..::........::..:::::..::..::::::::::.......::::......::::::..:::::";

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
echo "A public server requires payment for spam protection. A private server requires a secret invitation code.";
echo "Which server type would you prefer? (PUB/priv)"
read -r TYPE
printf "\n"

echo "At what domain name would you like to host cypherpost on?"
read -r DOMAIN
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

openssl dhparam -out "$CERTS_VOLUME/dhparam.pem" 4096
echo "[*] DHParam setup for nginx server."


if [[ $TYPE == *"priv"* ]] || [[ $TYPE == *"PRIV"* ]] ; then
  if [[ $(uname) == "Darwin" ]]; then
    SECRET=$(echo $RANDOM | md5 );
  else
    SECRET=$(echo $RANDOM | md5sum );
  fi
  echo "[*] Setting up as a private server."
  echo "[!] Use the following secret to invite members to your cypherpost server: $SECRET"
else
  TYPE="public"
  SECRET="public"
  echo "[*] Setting up as public server."
fi

mkdir ~/.keys 2> /dev/null
openssl genrsa -out ~/.keys/sats_sig.pem 4096 2> /dev/null
openssl rsa -in ~/.keys/sats_sig.pem -outform PEM -pubout -out $HOME/.keys/sats_sig.pub 2> /dev/null
echo "[*] Generated new server signing keys."

touch .env
echo "REPO=$REPO/app" > .env
echo "KEYS=$HOME/.keys" >> .env
echo "TYPE=$TYPE" >> .env
echo "SECRET=$SECRET" >> .env
echo "DOMAIN=$DOMAIN" >> .env
echo "EMAIL=$EMAIL" >> .env
echo "NODE_VOLUME=$NODE_VOLUME" >> .env
echo "MONGO_VOLUME=$MONGO_VOLUME" >> .env
echo "CERTS_VOLUME=$CERTS_VOLUME" >> .env
echo "CERTBOT_RUNMODE=--dry-run" >> .env

echo "[*] SETUP COMPLETE!"