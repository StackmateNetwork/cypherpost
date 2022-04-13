#!/bin/bash -e
# A few essential tools to get a fresh debian system equipped to download new software over secure channels

sudo apt-get update
sudo apt-get install -y \
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

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

sudo groupadd -f docker
sudo usermod -aG docker $(whoami)
sudo chgrp docker /usr/bin/docker 
sudo chgrp docker /usr/bin/docker-compose
echo "[*] Installed docker."
# test docker
docker run hello-world
echo "[*] Tested docker,"
# Pull repos
git clone https://github.com/StackmateNetwork/cypherpost.git
git clone https://github.com/SatoshiPortal/cyphernode.git
echo "[*] Cloned cypherpost and cyphernode from github."

sudo chmod -R 700 cypherpost
sudo chmod -R 700 cyphernode
sudo chown -R $(whoami) cypherpost 
sudo chown -R $(whoami) cypherpost 

echo "[*] Permissions Set."

echo "[*] Server initialization complete!"
echo "[*] Logout of ssh and log back in for group permissions to be loaded!"


exit 0