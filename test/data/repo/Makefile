# Makefile
# This makefile is currently just for running the tests of all packages.
# We assume that each package as a Makefile with a target test.
# By default, this script first runs npm install on each package,
# and then runs 'make test' on each package.
# The install target must be run on a new repository, and only occasionally
# thereafter, so developers will typically just run 'make test'.

# To add a new package, add to the PKGS variable.  Keep packages in alphabetical order.

PKGS=\
	leaf1 \
	leaf2 \
	spine \

PKGS_ALL=$(patsubst %,%-all,$(PKGS))
PKGS_TEST=$(patsubst %,%-test,$(PKGS))
PKGS_INSTALL=$(patsubst %,%-install,$(PKGS))
PKGS_CUCUMBER=$(patsubst %,%-cucumber,$(PKGS))
PKGS_UNITTEST=$(patsubst %,%-unittest,$(PKGS))
PKGS_LINT=$(patsubst %,%-lint,$(PKGS))

.PHONY : all test unittest cucumber install
.PHONY : clean clean-node clean-tsd
.PHONY : $(PKGS_ALL) $(PKGS_TEST) $(PKGS_INSTALL) $(PKGS_CUCUMBER) $(PKGS_UNITTEST) $(PKGS_LINT)

default: all

all : $(PKGS_ALL)

$(PKGS_ALL): %-all: %-install
	$(MAKE) $*-test

install : $(PKGS_INSTALL)

$(PKGS_INSTALL): %-install:
	$(MAKE) -C $* install

test : $(PKGS_TEST)

$(PKGS_TEST): %-test:
	$(MAKE) -C $* test

unittest : $(PKGS_UNITTEST)

$(PKGS_UNITTEST): %-unittest:
	$(MAKE) -C $* unittest

cucumber : $(PKGS_CUCUMBER)

$(PKGS_CUCUMBER): %-cucumber:
	$(MAKE) -C $* cucumber

lint : $(PKGS_LINT)

$(PKGS_LINT): %-lint:
	$(MAKE) -C $* lint

clean: clean-node clean-tsd

clean-node:
	rm -rf node_modules */node_modules

clean-tsd :
	rm -rf typings */typings
