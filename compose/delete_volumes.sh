#!/bin/bash

docker volume rm     cypherpost-development_cp-configdb
docker volume rm     cypherpost-development_cp-datadb
docker volume rm     cypherpost-development_cp-server-code
docker volume rm     cypherpost-development_cp-server-keys
docker volume rm     cypherpost-development_cp-server-logs
docker volume rm     cypherpost-development_cp-web-root
docker volume rm     cypherpost-development_cn-gatekeeper-certs

docker volume rm     cypherpost_certbot-etc
docker volume rm     cypherpost_certbot-var
docker volume rm     cypherpost_cp-configdb
docker volume rm     cypherpost_web-root
docker volume rm     cypherpost_cp-configdb
docker volume rm     cypherpost_cp-datadb
docker volume rm     cypherpost_cp-server-keys
docker volume rm     cypherpost_cp-server-logs
docker volume rm     cypherpost_dhparam


#  
# CAREFUL with that axe, Eugene docker volume rm $(docker volume ls -q)

