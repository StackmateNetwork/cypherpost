#!/bin/bash -e
source .env
# echo $SECRET
# echo "Enter your admin password to decrypt your invitation code for docker:"
# read -p "Enter password: " -s admin_password
# PHASH=$(echo $admin_password | shasum -a 256)

# printf "\n"

# INVITE_CODE=$(echo $SECRET | openssl aes-256-cbc -nopad -a -d -k $PHASH)
# echo $INVITE_CODE
# echo "[*] Successfully decrypted invite code for docker."

# printf $INVITE_CODE | docker secret create invite_code -
docker-compose up -d
echo "[!] Run ./stop.sh to gracefully stop containers"