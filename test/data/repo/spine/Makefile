.PHONY: install install-npm install-tsd lint test unittest cucumber compile
.PHONY: clean clean-obj clean-tsd clean-npm

default: test

clean: clean-obj clean-tsd clean-npm

clean-tsd:
	rm -rf typings

clean-npm:
	rm -rf node_modules

clean-obj:
	rm -f $(TS_OBJ)

install:
	$(MAKE) install-npm
	$(MAKE) install-tsd

install-npm:
	npm install

TSD=./node_modules/.bin/tsd

install-tsd:
	$(TSD) reinstall
	$(TSD) --config node_modules/tsd.json reinstall

lint:
	ls $(TS_SRC) | xargs -n1 node_modules/.bin/tslint --config ../tslint.json --file

documentation :
	node_modules/.bin/groc --except "**/node_modules/**" --except "**/typings/**" "**/*.ts" README.md

test: unittest cucumber

unittest: lint compile
	node_modules/.bin/mocha --timeout 5s --reporter=spec --ui tdd

cucumber:
	echo "No cucumber tests defined for this module."

TS_SRC=$(filter-out %.d.ts,$(wildcard lib/*.ts test/*.ts features/step_definitions/*.ts))
TS_OBJ=$(patsubst %.ts,%.js,$(TS_SRC))
TSC=./node_modules/.bin/tsc
TSC_OPTS=--module commonjs --target ES5 --sourceMap

compile: $(TS_OBJ)

%.js: %.ts
	$(TSC) $(TSC_OPTS) $<
	stat $@ > /dev/null
