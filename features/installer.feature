Feature: TypeScript package installer

As a Node.js + TypeScript developer
I want to write TypeScript packages managed with NPM that can reuse one another
so that I can have modular source code.

  Scenario: NPM postinstall
    Given an NPM package "leaf1" written in TypeScript
    And a single file "lib/export/leaf1.d.ts" describing the interface
    When "leaf1" package in installed
    And the TypeScript package installer runs as a postinstall hook
    Then the file will be copied into the typings directory.

  Scenario: Local development
    Given an NPM package under development
    And a single file "lib/export/leaf1.d.ts" describing the interface
    When I run tests with "make test"
    Then the tests will execute.

  Scenario: Multiple reuse
    Given two NPM packages "leaf1" and "leaf2" written in TypeScript
    And each package depends on Node package described by "node.d.ts"
    When both packages are installed
    Then they will depend on a single copy of "node.d.ts"
