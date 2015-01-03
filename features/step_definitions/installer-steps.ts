// installer-steps.ts

interface ICallback {
  (error?: string): void;
  pending(): void;
}

function wrapper() {

  this.Given(/^an NPM package "([^"]*)" written in TypeScript$/, function (pkg: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^a single file "([^"]*)" describing the interface$/, function (file: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^"([^"]*)" package is installed$/, function (pkg: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^the TypeScript package installer runs as a postinstall hook$/, function (callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^"([^"]*)" will be copied into the typings directory\.$/, function (file: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^an NPM package under development$/, function (callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^I run tests with "([^"]*)"$/, function (command: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^the tests will execute\.$/, function (callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^two NPM packages "([^"]*)" and "([^"]*)" written in TypeScript$/, function (pkg1: string, pkg2: string,
                                                                                           callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Given(/^each package depends on Node package described by "([^"]*)"$/, function (file: string,
                                                                                        callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.When(/^both packages are installed$/, function (callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^they will depend on a single copy of "([^"]*)"$/, function (file: string, callback: ICallback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

}

export = wrapper;
