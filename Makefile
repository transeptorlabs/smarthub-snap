# Simple local development makefile for bundler.

bundler:
	chmod +x ./start-bundler
	./start-bundler

start:
	@echo "Start bundler and site."
	yarn start

snap:
	@echo "Start snap and site."
	yarn start-snap

site:
	@echo "Start site and site."
	yarn start-site