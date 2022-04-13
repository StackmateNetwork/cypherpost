#!/bin/bash -e
# A few essential tools to get a fresh debian system equipped to download new software over secure channels
echo "Provide the admin username to set permissions in their home directory: "
read -r ADMIN
printf "\n"

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
apt-get install -y docker-ce docker-ce-cli containerd.io

curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
#chmod +x /usr/local/bin/docker-compose
#ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
echo "[*] Installed docker."
# test docker
docker run hello-world
echo "[*] Tested docker,"
# Pull repos
git clone https://github.com/StackmateNetwork/cypherpost.git
git clone https://github.com/SatoshiPortal/cyphernode.git
echo "[*] Cloned cypherpost and cyphernode from github."

chmod -R 700 cypherpost
chmod -R 700 cyphernode
chown -R $ADMIN cypherpost 
chown -R $ADMIN cypherpost 

newgrp docker
chgrp docker /usr/bin/docker 
chgrp docker /usr/bin/docker
usermod -aG docker $ADMIN

echo "[*] Set Permissions."

echo "[*] Server initialization complete!"

exit 0