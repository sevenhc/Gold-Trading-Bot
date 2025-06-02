#
#   Docker Build Script
#   Build the docker image and push it to the docker hub
#   Tag with the appropriate version number before executing the script
#

docker build -t v2-api .
docker tag v2-api pulseid/offerwall-v2-api:dev-0.36
docker push pulseid/offerwall-v2-api:dev-0.36
