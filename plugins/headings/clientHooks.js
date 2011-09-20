//TODO: Find a better name for this
exports.entryPoint(arg) {

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

exports.aceAttribsToClasses = function(args) {

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

exports.aceCreateDomLine = function(args) {

  if (args.cls.indexOf('headings:') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '', extraCloseTags: ''}];
  }
}

exports.collectContentPre = function(args) {

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
