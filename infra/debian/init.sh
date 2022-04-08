#!/bin/bash -e
# A few essential tools to get a fresh debian system equipped to download new software over secure channels
apt-get update
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg2 \
    software-properties-common \
    dirmngr \
    unzip \
    git \
    expect \
    jq \
    lsb-release

echo "[*] Installed basic tools"

# Install docker
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install docker-ce docker-ce-cli containerd.io
echo "[*] Installed docker."
# test docker
docker run hello-world
echo "[*] Tested docker,"
# Pull repos
git clone https://github.com/StackmateNetwork/cypherpost.git
git clone https://github.com/SatoshiPortal/cyphernode.git


echo "[*] Cloned cypherpost and cyphernode from github."
echo "[*] Server initialization complete!"

exit 0