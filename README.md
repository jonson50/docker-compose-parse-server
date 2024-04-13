This is an example project using the [Parse Server](https://github.com/ParsePlatform/parse-server) module on Express and using Docker compose file to generate three containers:
- mongo container
- parse dashboard container
- parse server on express container

This repository could be used for local development using parse server and parse dashboard.
Please adapt the docker compose file to fit prod environment.

# For Local Development
Just clone the repository and run:
```sh
docker compose up -d --build --force-recreate
```
or simple run:
```sh
docker compose up -d --build
```
