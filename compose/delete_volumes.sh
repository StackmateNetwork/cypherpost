#!/bin/bash

docker volume rm     cypherpost-development_cp-configdb
docker volume rm     cypherpost-development_cp-datadb
docker volume rm     cypherpost-development_cp-server-code
docker volume rm     cypherpost-development_cp-server-keys
docker volume rm     cypherpost-development_cp-server-logs
docker volume rm     cypherpost-development_cp-web-root
docker volume rm     cypherpost-development_cn-gatekeeper-certs

docker volume rm     cypherpost-production_certbot-etc
docker volume rm     cypherpost-production_certbot-var
docker volume rm     cypherpost-production_cp-configdb
docker volume rm     cypherpost-production_web-root
docker volume rm     cypherpost-production_cp-configdb
docker volume rm     cypherpost-production_cp-datadb
docker volume rm     cypherpost-production_cp-server-keys
docker volume rm     cypherpost-production_cp-server-logs
docker volume rm     cypherpost-production_dhparam