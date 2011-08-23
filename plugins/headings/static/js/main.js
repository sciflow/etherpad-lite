if(typeof dojo != "undefined"){
  dojo.require("dijit.form.Button");
  dojo.require("dijit.Menu");
}

function headingsInit() {
  this.hooks = ['aceAttribsToClasses', 'aceCreateDomLine', 'aceInitInnerdocbodyHead', 'collectContentPre'];
  this.aceAttribsToClasses = aceAttribsToClasses;
  this.aceCreateDomLine = aceCreateDomLine;
  this.collectContentPre = collectContentPre;
  this.aceInitInnerdocbodyHead = aceInitInnerdocbodyHead;
}

if(typeof dojo != "undefined")
{
  dojo.addOnLoad(function() {
  
    var menu = new dijit.Menu({
      style: "display: none;"
    });
  
    var menuItem0 = new dijit.MenuItem({
      label: "Normal Text",
      onClick: function() {
        dijit.byId("headingsPluginComboBox").setLabel(this.label);
        headingsPluginComboBoxChanged('normalText');
      }
    });
    menu.addChild(menuItem0);

    var menuItem1 = new dijit.MenuItem({
      label: "Heading 1",
      onClick: function() {
        dijit.byId("headingsPluginComboBox").setLabel(this.label);
        headingsPluginComboBoxChanged('heading1');
      }
    });
    menu.addChild(menuItem1);
  
    var menuItem2 = new dijit.MenuItem({
      label: "Heading 2",
      onClick: function() {
        dijit.byId("headingsPluginComboBox").setLabel(this.label);
        headingsPluginComboBoxChanged('heading2');
      }
    });
    menu.addChild(menuItem2);
  
    var menuItem3 = new dijit.MenuItem({
      label: "Heading 3",
      onClick: function() {
        dijit.byId("headingsPluginComboBox").setLabel(this.label);
        headingsPluginComboBoxChanged('heading3');
      }
    });
    menu.addChild(menuItem3);
    
    var menuItem4 = new dijit.MenuItem({
      label: "Heading 4",
      onClick: function() {
        dijit.byId("headingsPluginComboBox").setLabel(this.label);
        headingsPluginComboBoxChanged('heading4');
      }
    });
    menu.addChild(menuItem4);
  
    var menuItem5 = new dijit.MenuItem({
      label: "Heading 5",
      onClick: function() {
        dijit.byId("headingsPluginComboBox").setLabel(this.label);
        headingsPluginComboBoxChanged('heading5');
      }
    });
    menu.addChild(menuItem5);
  
    var menuItem6 = new dijit.MenuItem({
      label: "Heading 6",
      onClick: function() {
        dijit.byId("headingsPluginComboBox").setLabel(this.label);
        headingsPluginComboBoxChanged('heading6');
      }
    });
    menu.addChild(menuItem6);
            
    var button = new dijit.form.ComboButton({
      dropDown: menu,
      id : "headingsPluginComboBox"
    });
  
    dojo.byId("headingsPluginComboBoxDiv").appendChild(button.domNode);
    dijit.byId("headingsPluginComboBox").setLabel(
      dijit.byId("headingsPluginComboBox").dropDown.getChildren()[0].label
    );
  });
}

function aceInitInnerdocbodyHead(args) {
  args.iframeHTML.push('\'<link rel="stylesheet" type="text/css" href="/static/css/plugins/headings/headingsPlugin.css"/>\'');
}

function aceAttribsToClasses(args) {

  if (args.key == 'heading1' && args.value != "")
    return ["headings:h1"];

  if (args.key == 'heading2' && args.value != "")
    return ["headings:h2"];

  if (args.key == 'heading3' && args.value != "")
    return ["headings:h3"];

  if (args.key == 'heading4' && args.value != "")
    return ["headings:h4"];

  if (args.key == 'heading5' && args.value != "")
    return ["headings:h5"];

  if (args.key == 'heading6' && args.value != "")
    return ["headings:h6"];

}

function aceCreateDomLine(args) {

  if (args.cls.indexOf('headings:') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '', extraCloseTags: ''}];
  }

}

function headingsPluginComboBoxChanged(arg) {

  var attributeName = null;

  switch (arg) {
    case 'normalText':
      break;
    case 'heading1':
      attributeName= 'heading1';
      break;
    case 'heading2':
      attributeName= 'heading2';
      break;
    case 'heading3':
      attributeName= 'heading3';
      break;
    case 'heading4':
      attributeName= 'heading4';
      break;
    case 'heading5':
      attributeName= 'heading5';
      break;
    case 'heading6':
      attributeName= 'heading6';
      break;
    default:
      return;
  }

  padeditor.ace.callWithAce(function (ace) {
    rep = ace.ace_getRep();

    // Setting a heading is something you probably want to do for the whole line.
    // To accomplish this, we manipulate the rep.selStart and rep.selEnd before
    // calling setAttributeOnSelection and toggleAttributeOnSelection to fit the
    // whole line. After calling this functions, we restore the original values.
    var originalSelStart = [rep.selStart[0], rep.selStart[1]];
    var originalSelEnd = [rep.selEnd[0], rep.selEnd[1]];
    
    rep.selStart[0] = rep.selStart[0];
    rep.selStart[1] = 0;
    
    rep.selEnd[0] = rep.selEnd[0];
    rep.selEnd[1] = rep.lines.atIndex(rep.selEnd[0]).width - 1;  // here's the magic

    // When we set a selection to heading level x, we must take care of
    // the case, that this selection might allready be a heading of either
    // level x or some other level y. So we simply set all heading attributes
    // of the current selection to '', thus deleting all heading formats so far
    ace.ace_setAttributeOnSelection('heading1','');
    ace.ace_setAttributeOnSelection('heading2','');
    ace.ace_setAttributeOnSelection('heading3','');
    ace.ace_setAttributeOnSelection('heading4','');
    ace.ace_setAttributeOnSelection('heading5','');
    ace.ace_setAttributeOnSelection('heading6','');

    if(attributeName!== null) ace.ace_toggleAttributeOnSelection(attributeName);

    // Restore the original rep.selStart and rep.selEnd values
    rep.selStart[0] = originalSelStart[0];
    rep.selStart[1] = originalSelStart[1];
    rep.selEnd[0] = originalSelEnd[0];
    rep.selEnd[1] = originalSelEnd[1];
  }, "headings", true);

}

function collectContentPre(args) {

  // TODO: Speed the whole function up. It runs every time a character is typed.
  var attributesToApply = [];
  
  if(args.cls == 'ace-line') return;

  if(args.cls.indexOf('h1') >= 0) attributesToApply.push('heading1');
  else if(args.cls.indexOf('h2') >= 0) attributesToApply.push('heading2');
  else if(args.cls.indexOf('h3') >= 0) attributesToApply.push('heading3');
  else if(args.cls.indexOf('h4') >= 0) attributesToApply.push('heading4');
  else if(args.cls.indexOf('h5') >= 0) attributesToApply.push('heading5');
  else if(args.cls.indexOf('h6') >= 0) attributesToApply.push('heading6');

  while(attributesToApply.length > 0) {
    args.cc.doAttrib(args.state, attributesToApply.pop());
  }
}

/* used on the client side only */
headings = new headingsInit();
