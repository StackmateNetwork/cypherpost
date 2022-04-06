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

echo "Cypherpost can be run as a public or private server."
echo "A public server requires payment for spam protection. A private server requires a secret invitation code.";
echo "Would you like to setup as a (pub)lic or (priv)ate server?"

read -r server_type
printf "\n"

if [[ $server_type == *"priv"* ]] || [[ $server_type == *"PRIV"* ]] ; then
  if [[ $(uname) == "Darwin" ]]; then
    SECRET=$(echo test | md5 );
  else
    SECRET=$(echo test | md5sum );
  fi
  echo "[*] Setting up as a private server."
  echo "[!] Use the following secret to invite members to your cypherpost server: $SECRET"
else
  server_type="public"
  SECRET="public"
  echo "[*] Setting up as public server."
fi

TYPE=$server_type
REPO="$(dirname $(pwd))/app"
echo "[*] Using $REPO as path to development codebase."


mkdir ~/.keys 2> /dev/null
openssl genrsa -out ~/.keys/sats_sig.pem 4096 2> /dev/null
openssl rsa -in ~/.keys/sats_sig.pem -outform PEM -pubout -out $HOME/.keys/sats_sig.pub 2> /dev/null
echo "[*] Generated new server signing keys."

touch .env
echo "REPO=$REPO" > .env
echo "KEYS=$HOME/.keys" >> .env
echo "TYPE=$TYPE" >> .env
echo "SECRET=$SECRET" >> .env

echo "[*] SETUP COMPLETE!"