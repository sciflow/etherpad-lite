import("etherpad.log");
import("plugins.headings.hooks");
import("plugins.headings.static.js.main");

function headingsInit() {
  this.hooks = ['editBarItemsLeftPad', 'aceAttribsToClasses', 'aceCreateDomLine'];
  this.description = 'Gives the opportunity to format text as headings.';
  this.client = new main.headingsInit();
  this.editBarItemsLeftPad = hooks.editBarItemsLeftPad;
  this.aceAttribsToClasses = main.aceAttribsToClasses;
  this.aceCreateDomLine = main.aceCreateDomLine;
  this.install = install;
  this.uninstall = uninstall;
}

function install() {
  log.info("Installing headings plugin");
}

function uninstall() {
  log.info("Uninstalling headings plugin");
}