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
