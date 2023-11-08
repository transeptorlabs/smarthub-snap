# Simple local development makefile.

bundler:
	chmod +x ./start-bundler.sh
	./start-bundler.sh

start:
	@echo "Start snap and site."
	yarn start

snap:
	@echo "Start snap and site."
	yarn start-snap

site:
	@echo "Start site and site."
	yarn start-site