import("etherpad.globals.*");
import("etherpad.helpers");
import("etherpad.log");
import("etherpad.utils.*");
import("dispatch.{Dispatcher,PrefixMatcher,forward}");
import("faststatic");

function editBarItemsLeftPad(arg) {
  // TODO: This does not seem to be the right place for this
  helpers.addToHead('<script src="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dojo/dojo.xd.js" djConfig="parseOnLoad: true"></script>');
  helpers.addToHead('<link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dijit/themes/claro/claro.css" />');

  // This fixes some Dijit CSS issues - taken from github.com/xmbms/pad
  helpers.addToHead('<link rel="stylesheet" type="text/css" href="/static/css/plugins/headings/dijitClaroThemePatch.css" />');
  
  // TODO: maybe one could bind that class only to the controls, not to the whole body
  helpers.addBodyClass("claro");

  return arg.template.include('headingsPluginEditbarControls.ejs', undefined, ['headings']);
}
