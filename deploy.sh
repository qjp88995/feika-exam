#!/bin/sh
ssh root@mytx "rm -r /mnt/feika-exam/volumes/app/*"
scp -r dist/* root@mytx:/mnt/feika-exam/volumes/app/