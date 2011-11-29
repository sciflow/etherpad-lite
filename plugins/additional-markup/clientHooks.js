// command is an object containing the command name and the parameters
exports.handleCommand = function(command)
{
  return sciflow.hookFunctions.handleCommand(command); 

  /*
  //check if this is a supported command
  if(!(command.name.match(/^(?:changeHeading|addGraphic|addCite)$/)))
  {
    return;
  }

  //handle changeHeading
  if(command.name === 'changeHeading')
  {
    var attributeName = null;

    switch (command.parameters.headingType) {
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
  //handle addGraphic
  else if(command.name === 'addGraphic')
  {
    // replace the current selection with a space character
    padeditor.ace.callWithAce(function (ace)
    {
      var rep = ace.ace_getRep();
     
      ace.ace_replaceRange(rep.selStart, rep.selEnd, ' ');
    });

    // After doing the replace, the current selection has changed. There is no
    // selection anymore, but the selStart and selEnd point to the same location
    // which is right after the last replaced character. In order to get the
    // inserted space, we have to go 1 character back from that position.
    padeditor.ace.callWithAce(function (ace)
    {
      var rep = ace.ace_getRep();

      // After doing the replace, the current selection has changed. There is no
      // selection anymore, but the selStart and selEnd point to the same location
      // which is right after the last replaced character. In order to get the
      // inserted space, we have to go 1 character back from that position.
      if(rep.selStart[1] > -1)
      {
        rep.selStart[1]--;
      }
      else
      {
        return; //this should never happen
      }

      ace.ace_setAttributeOnSelection('graphic', JSON.stringify(command.parameters));

      rep.selStart[1]++;

    },'additional-markup');  //till now I dont understand the semantics of etherpads callstack mechanism, but it has to be at *this* point

  }
  //handle addCite
  else if(command.name === 'addCite')
  {

  }

   var regExpmatch = 'foo'.match(/^bla/);
   */
}

exports.aceAttribsToClasses = function(args) {

  return sciflow.hookFunctions.aceAttribsToClasses(args);

  /*

  if(args.key === 'graphic') return ['graphic:' + args.value];
  else if(args.key === 'cite') return ['cite'];
  else if(args.key === 'footnote') return ['footnote'];

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

  */
}

exports.aceCreateDomLine = function(args) {

  return sciflow.hookFunctions.aceCreateDomLine(args);

  /*

  if(args.cls.indexOf('graphic') >= 0)
  {
    var result = {};

    result.cls = args.cls.replace(/(^| )graphic:(\{[^\}]+\})/, function(matchedSubstring, space, graphicParameters)
    {
      result.extraOpenTags = '<img src="' + JSON.parse(graphicParameters).url + '">';
      result.extraCloseTags = '</img>';
      return space + 'graphic';
    });

    return [result];

  };

  if (args.cls.indexOf('headings:h1') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '<div style="font-size:32px; line-height:36px">', extraCloseTags: '</div>'}];
  }

  if (args.cls.indexOf('headings:h2') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '<div style="font-size:24px; line-height:28px">', extraCloseTags: '</div>'}];
  }

  if (args.cls.indexOf('headings:h3') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '<div style="font-size:19px; line-height:23px">', extraCloseTags: '</div>'}];
  }

  if (args.cls.indexOf('headings:h4') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '<div style="font-size:16px; line-height:18px">', extraCloseTags: '</div>'}];
  }

  if (args.cls.indexOf('headings:h5') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '<div style="font-size:15px; line-height:17px">', extraCloseTags: '</div>'}];
  }

  if (args.cls.indexOf('headings:h6') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '<div style="font-size:13px; line-height:15px">', extraCloseTags: '</div>'}];
  }
/*
  if (args.cls.indexOf('headings:') >= 0) {
    cls = args.cls.replace(/(^| )headings:(\S+)/g, function(x0, space, typOfHeading) { return space + typOfHeading; });
    return [{cls: cls, extraOpenTags: '', extraCloseTags: ''}];
  }
*/
}

exports.collectContentPre = function(args) {

  return sciflow.hookFunctions.collectContentPre(args);

  /*
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
  */
}

exports.collectContentPost = function(args)
{
  return sciflow.hookFunctions.collectContentPost(args);
}
