#!/bin/bash

docker volume rm      dev_cp-configdb
docker volume rm      dev_cp-datadb
docker volume rm      dev_cp-server-code
docker volume rm      dev_cp-server-keys
docker volume rm      dev_cp-server-logs
docker volume rm      dev_cp-web-root

docker volume rm     prod_certbot-etc
docker volume rm     prod_certbot-var
docker volume rm     prod_cp-configdb
docker volume rm     prod_cp-datadb
docker volume rm     prod_cp-server-keys
docker volume rm     prod_cp-server-logs
docker volume rm     prod_dhparam
docker volume rm     prod_web-root