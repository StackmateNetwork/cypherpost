# cypherpost

## A centralized encrypted data store, enabling client-side applications that require end-to-end encryption and selective visibility of content.

- Your identity on the platform is a `username:pubkey`
- All your posts are encrypted custom json strings.
- Posts can be decrypted only by the identities you give visibility to.
- You give identities visibility by sharing decryption keys with them.
- ECDSA Shared Secrets are used per identity, to encrypt decryption keys in transit.
- Badges form a reputation system and help build a trusted network.
- Value of badges are subjective and based on who the givers are.
- Issuance of badges can be verified by all clients
=======

### Server LIVE at https://cypherpost.io/api/v2

### Reference client UNDER CONSTRUCTION at https://cypherpost.io.

![cypherpost](design/assets/owl.png)

## Run on localhost


You must have npm installed.
To get the latest version of npm visit: https://nodejs.org/en/

```
# Install typescript and browserify
sudo npm i -g typescript browserify
```

```
git clone git@github.com:StackmateNetwork/cypherpost.git
```

```
cd cypherpost/app
# add node_modules and compiled ts code in dist
npm i
tsc
// If changes are made to any .ts file, run tsc again and restart container
```

```
# install client dependencies
cd src/services/client/public/js
npm i
# compile.bash compiles each client side js module into  *_bundle.js files containing all dependency code
cd ..
./compile.bash
# If changes are made to any files in public/js, run compile.bash again
```

### NOTE: MAC users will need to use Docker Desktop < v4.6 and disable gRPC File Sharing in Preferences for volume mounting to work.

### NOTE: SETUP DEV ENVIRONMENT AS PRIVATE SERVER (PUBLIC SERVER WILL FAIL TESTS WITH 402:Payment Required). Tests for public server with payment is still under development.

```
# setup dev compose environment
cd ../../../../../compose
./setup.sh
docker-compose -f dev-compose.yaml up -d
```

YOU CAN NOW ACCESS THE CLIENT ON `localhost` in your browser.

### NOTE: The development client does not work on Safari. Use Firefox or Chromium.

```
# to stop all containers
docker-compose -f dev-compose.yaml down
```

```
# if changes made to Dockerfiles -  rebuild all containers
docker-compose -f dev-compose.yaml up -d --build --force-recreate
```

```
# rebuild single container : node
docker-compose -f dev-compose.yaml up -d --build --force-recreate --no-deps node
```

```
# for errors related to volumes
bash delete_volumes.sh
```

```
# Add localhost to /etc/hosts to access client on the browser as localhost

echo "::1     localhost" | sudo tee -a /etc/hosts
```

```
# log node
docker logs -f application
# log nginx
docker logs -f server
# log mongo
docker logs -f database
```

```
# restart a container
docker restart application
```


## Run tests

```bash
# Integration test
docker exec -it application sh -c "npm test"

# Unit tests
docker exec -it application sh -c "bash units.bash"

```

## Inspect Database

```bash
# to initialize with genesis user
docker exec -it database sh -c "mongo scripts/genesis.js"

docker exec -it database mongo

use cypherpost
db.auth('cp','secret')
db.identities.find().pretty()
db.badges.find().pretty()
db.posts.find().pretty()
db.post_keys.find().pretty()


# Checkout infra/mongo/scripts for more.

```
