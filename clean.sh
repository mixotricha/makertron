#!/bin/bash
# Delete all containers
sudo docker rm $(sudo docker ps -a -q)
# Delete all images
sudo docker rmi $(sudo docker images -q)
