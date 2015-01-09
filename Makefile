.PHONY: install install-npm install-tsd lint test unittest cucumber compile
.PHONY: clean clean-doc clean-obj clean-tsd clean-npm clean-unittest clean-cucumber

default: test

clean: clean-doc clean-obj clean-tsd clean-npm clean-unittest clean-cucumber

clean-doc:
	rm -rf doc

clean-tsd:
	rm -rf typings

clean-npm:
	rm -rf node_modules

clean-obj:
	rm -f $(TS_OBJ)

clean-unittest:
	rm -rf o

clean-cucumber:
	rm -rf o.features

install:
	$(MAKE) install-npm
	$(MAKE) install-tsd

install-npm:
	npm install

TSD=./node_modules/.bin/tsd

install-tsd:
	$(TSD) reinstall

# We run lint as part of compile, so this is a dummy target
lint:

documentation :
	node_modules/.bin/groc --except "**/node_modules/**" --except "**/typings/**" "**/*.ts" README.md

test: unittest cucumber

unittest: lint compile
	./node_modules/.bin/mocha --timeout 5s --reporter=spec --ui tdd

cucumber: lint compile
	./node_modules/.bin/cucumber-js --tags '~@todo'

TS_SRC=$(filter-out %.d.ts,$(wildcard bin/*.ts test/*.ts test/data/*/*.ts features/step_definitions/*.ts))
TS_OBJ=$(patsubst %.ts,%.js,$(TS_SRC))
TSC=./node_modules/.bin/tsc
TSC_OPTS=--module commonjs --target ES5 --sourceMap --declaration

TSLINT=./node_modules/.bin/tslint --config tslint.json --file

compile: $(TS_OBJ)

%.js: %.ts
	$(TSLINT) $<
	$(TSC) $(TSC_OPTS) $<
	stat $@ > /dev/null

# Explicit dependencies for files that are referenced

bin/ts-pkg-installer.js: bin/util.js

test/test.js: bin/util.js
