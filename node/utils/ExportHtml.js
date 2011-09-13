/**
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var async = require("async");
var Changeset = require("./Changeset");
var padManager = require("../db/PadManager");

function getPadPlainText(pad, revNum)
{
  var atext = ((revNum !== undefined) ? pad.getInternalRevisionAText(revNum) : pad.atext());
  var textLines = atext.text.slice(0, -1).split('\n');
  var attribLines = Changeset.splitAttributionLines(atext.attribs, atext.text);
  var apool = pad.pool();

  var pieces = [];
  for (var i = 0; i < textLines.length; i++)
  {
    var line = _analyzeLine(textLines[i], attribLines[i], apool);
    if (line.listLevel)
    {
      var numSpaces = line.listLevel * 2 - 1;
      var bullet = '*';
      pieces.push(new Array(numSpaces + 1).join(' '), bullet, ' ', line.text, '\n');
    }
    else
    {
      pieces.push(line.text, '\n');
    }
  }

  return pieces.join('');
}

function getPadHTML(pad, revNum, callback)
{
  var atext = pad.atext;
  var html;
  async.waterfall([
  // fetch revision atext


  function (callback)
  {
    if (revNum != undefined)
    {
      pad.getInternalRevisionAText(revNum, function (err, revisionAtext)
      {
        atext = revisionAtext;
        callback(err);
      });
    }
    else
    {
      callback(null);
    }
  },

  // convert atext to html


  function (callback)
  {
    html = getHTMLFromAtext(pad, atext);
    callback(null);
  }],
  // run final callback


  function (err)
  {
    callback(err, html);
  });
}

function getHTMLFromAtext(pad, atext)
{
  var apool = pad.apool();
  var textLines = atext.text.slice(0, -1).split('\n');
  var attribLines = Changeset.splitAttributionLines(atext.attribs, atext.text);

  var tags = ['h1', 'h2', 'strong', 'em', 'u', 's'];
  var props = ['heading1', 'heading2', 'bold', 'italic', 'underline', 'strikethrough'];
  var anumMap = {};

  props.forEach(function (propName, i)
  {
    var propTrueNum = apool.putAttrib([propName, true], true);
    if (propTrueNum >= 0)
    {
      anumMap[propTrueNum] = i;
    }
  });

  function getLineHTML(text, attribs)
  {
    var propVals = [false, false, false];
    var ENTER = 1;
    var STAY = 2;
    var LEAVE = 0;

    // Use order of tags (b/i/u) as order of nesting, for simplicity
    // and decent nesting.  For example,
    // <b>Just bold<b> <b><i>Bold and italics</i></b> <i>Just italics</i>
    // becomes
    // <b>Just bold <i>Bold and italics</i></b> <i>Just italics</i>
    var taker = Changeset.stringIterator(text);
    var assem = Changeset.stringAssembler();

    function emitOpenTag(i)
    {
      assem.append('<');
      assem.append(tags[i]);
      assem.append('>');
    }

    function emitCloseTag(i)
    {
      assem.append('</');
      assem.append(tags[i]);
      assem.append('>');
    }

    var urls = _findURLs(text);

    var idx = 0;

    function processNextChars(numChars)
    {
      if (numChars <= 0)
      {
        return;
      }

      var iter = Changeset.opIterator(Changeset.subattribution(attribs, idx, idx + numChars));
      idx += numChars;

      while (iter.hasNext())
      {
        var o = iter.next();
        var propChanged = false;
        Changeset.eachAttribNumber(o.attribs, function (a)
        {
          if (a in anumMap)
          {
            var i = anumMap[a]; // i = 0 => bold, etc.
            if (!propVals[i])
            {
              propVals[i] = ENTER;
              propChanged = true;
            }
            else
            {
              propVals[i] = STAY;
            }
          }
        });
        for (var i = 0; i < propVals.length; i++)
        {
          if (propVals[i] === true)
          {
            propVals[i] = LEAVE;
            propChanged = true;
          }
          else if (propVals[i] === STAY)
          {
            propVals[i] = true; // set it back
          }
        }
        // now each member of propVal is in {false,LEAVE,ENTER,true}
        // according to what happens at start of span
        if (propChanged)
        {
          // leaving bold (e.g.) also leaves italics, etc.
          var left = false;
          for (var i = 0; i < propVals.length; i++)
          {
            var v = propVals[i];
            if (!left)
            {
              if (v === LEAVE)
              {
                left = true;
              }
            }
            else
            {
              if (v === true)
              {
                propVals[i] = STAY; // tag will be closed and re-opened
              }
            }
          }

          for (var i = propVals.length - 1; i >= 0; i--)
          {
            if (propVals[i] === LEAVE)
            {
              emitCloseTag(i);
              propVals[i] = false;
            }
            else if (propVals[i] === STAY)
            {
              emitCloseTag(i);
            }
          }
          for (var i = 0; i < propVals.length; i++)
          {
            if (propVals[i] === ENTER || propVals[i] === STAY)
            {
              emitOpenTag(i);
              propVals[i] = true;
            }
          }
          // propVals is now all {true,false} again
        } // end if (propChanged)
        var chars = o.chars;
        if (o.lines)
        {
          chars--; // exclude newline at end of line, if present
        }
        var s = taker.take(chars);

        assem.append(_escapeHTML(s));
      } // end iteration over spans in line
      for (var i = propVals.length - 1; i >= 0; i--)
      {
        if (propVals[i])
        {
          emitCloseTag(i);
          propVals[i] = false;
        }
      }
    } // end processNextChars
    if (urls)
    {
      urls.forEach(function (urlData)
      {
        var startIndex = urlData[0];
        var url = urlData[1];
        var urlLength = url.length;
        processNextChars(startIndex - idx);
        assem.append('<a href="' + url.replace(/\"/g, '&quot;') + '">');
        processNextChars(urlLength);
        assem.append('</a>');
      });
    }
    processNextChars(text.length - idx);

    return _processSpaces(assem.toString());
  } // end getLineHTML
  var pieces = [];

  // Need to deal with constraints imposed on HTML lists; can
  // only gain one level of nesting at once, can't change type
  // mid-list, etc.
  // People might use weird indenting, e.g. skip a level,
  // so we want to do something reasonable there.  We also
  // want to deal gracefully with blank lines.
  var lists = []; // e.g. [[1,'bullet'], [3,'bullet'], ...]
  for (var i = 0; i < textLines.length; i++)
  {
    var line = _analyzeLine(textLines[i], attribLines[i], apool);
    var lineContent = getLineHTML(line.text, line.aline);

    if (line.listLevel || lists.length > 0)
    {
      // do list stuff
      var whichList = -1; // index into lists or -1
      if (line.listLevel)
      {
        whichList = lists.length;
        for (var j = lists.length - 1; j >= 0; j--)
        {
          if (line.listLevel <= lists[j][0])
          {
            whichList = j;
          }
        }
      }

      if (whichList >= lists.length)
      {
        lists.push([line.listLevel, line.listTypeName]);
        pieces.push('<ul><li>', lineContent || '<br />');
      }
      else if (whichList == -1)
      {
        if (line.text)
        {
          // non-blank line, end all lists
          pieces.push(new Array(lists.length + 1).join('</li></ul\n>'));
          lists.length = 0;
          pieces.push(lineContent, '<br />');
        }
        else
        {
          pieces.push('<br /><br />');
        }
      }
      else
      {
        while (whichList < lists.length - 1)
        {
          pieces.push('</li></ul>');
          lists.length--;
        }
        pieces.push('</li><li>', lineContent || '<br />');
      }
    }
    else
    {
      pieces.push(lineContent, '<br />');
    }
  }
  pieces.push(new Array(lists.length + 1).join('</li></ul>'));

  return pieces.join('');
}

function _analyzeLine(text, aline, apool)
{
  var line = {};

  // identify list
  var lineMarker = 0;
  line.listLevel = 0;
  if (aline)
  {
    var opIter = Changeset.opIterator(aline);
    if (opIter.hasNext())
    {
      var listType = Changeset.opAttributeValue(opIter.next(), 'list', apool);
      if (listType)
      {
        lineMarker = 1;
        listType = /([a-z]+)([12345678])/.exec(listType);
        if (listType)
        {
          line.listTypeName = listType[1];
          line.listLevel = Number(listType[2]);
        }
      }
    }
  }
  if (lineMarker)
  {
    line.text = text.substring(1);
    line.aline = Changeset.subattribution(aline, 1);
  }
  else
  {
    line.text = text;
    line.aline = aline;
  }

  return line;
}

exports.getPadHTMLDocument = function (padId, revNum, noDocType, callback)
{
  var doctype_xhtml1_transitional = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
  
  /*
     In order to use other doctypes then xhtml1_transitional the resulting
     html has to conform these specs, which is not the case right now.

     You can use http://validator.w3.org/check to check the resulting file.

  var doctype_xhtml1_strict = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
  var doctype_xhtml1_frameset = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">';
  var doctype_xhtml11 = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';

  */

  // select the doctype you want to use for the exported xhtml files 
  var doctype = doctype_xhtml1_transitional;

  // select if you want the <?xml version="1.0" ?> tag (some old browsers might not like it)
  var noXmlTag = false;

  padManager.getPad(padId, function (err, pad)
  {
    if (err)
    {
      callback(err);
      return;
    }

    var head = (noXmlTag ? '' : '<?xml version="1.0" encoding="UTF-8" ?>\n') + (noDocType ? '' : doctype + '\n') + '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">\n' + (noDocType ? '' : '<head>\n' + '<title>' + padId + '</title>\n' + '<style type="text/css"> * { font-family: arial, sans-serif;\n' + 'font-size: 13px;\n' + 'line-height: 17px; }</style>\n' + '</head>\n') + '<body>';

    var foot = '</body>\n</html>\n';

    getPadHTML(pad, revNum, function (err, html)
    {
      callback(err, head + html + foot);
    });
  });
}

function _escapeHTML(s)
{
  var re = /[&<>]/g;
  if (!re.MAP)
  {
    // persisted across function calls!
    re.MAP = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
    };
  }
  
  s = s.replace(re, function (c)
  {
    return re.MAP[c];
  });
  
  return s.replace(/[^\x21-\x7E\s\t\n\r]/g, function(c)
  {
    return "&#" +c.charCodeAt(0) + ";"
  });
}

// copied from ACE


function _processSpaces(s)
{
  var doesWrap = true;
  if (s.indexOf("<") < 0 && !doesWrap)
  {
    // short-cut
    return s.replace(/ /g, '&nbsp;');
  }
  var parts = [];
  s.replace(/<[^>]*>?| |[^ <]+/g, function (m)
  {
    parts.push(m);
  });
  if (doesWrap)
  {
    var endOfLine = true;
    var beforeSpace = false;
    // last space in a run is normal, others are nbsp,
    // end of line is nbsp
    for (var i = parts.length - 1; i >= 0; i--)
    {
      var p = parts[i];
      if (p == " ")
      {
        if (endOfLine || beforeSpace) parts[i] = '&nbsp;';
        endOfLine = false;
        beforeSpace = true;
      }
      else if (p.charAt(0) != "<")
      {
        endOfLine = false;
        beforeSpace = false;
      }
    }
    // beginning of line is nbsp
    for (var i = 0; i < parts.length; i++)
    {
      var p = parts[i];
      if (p == " ")
      {
        parts[i] = '&nbsp;';
        break;
      }
      else if (p.charAt(0) != "<")
      {
        break;
      }
    }
  }
  else
  {
    for (var i = 0; i < parts.length; i++)
    {
      var p = parts[i];
      if (p == " ")
      {
        parts[i] = '&nbsp;';
      }
    }
  }
  return parts.join('');
}


// copied from ACE
var _REGEX_WORDCHAR = /[\u0030-\u0039\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u1FFF\u3040-\u9FFF\uF900-\uFDFF\uFE70-\uFEFE\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFDC]/;
var _REGEX_SPACE = /\s/;
var _REGEX_URLCHAR = new RegExp('(' + /[-:@a-zA-Z0-9_.,~%+\/\\?=&#;()$]/.source + '|' + _REGEX_WORDCHAR.source + ')');
var _REGEX_URL = new RegExp(/(?:(?:https?|s?ftp|ftps|file|smb|afp|nfs|(x-)?man|gopher|txmt):\/\/|mailto:)/.source + _REGEX_URLCHAR.source + '*(?![:.,;])' + _REGEX_URLCHAR.source, 'g');

// returns null if no URLs, or [[startIndex1, url1], [startIndex2, url2], ...]


function _findURLs(text)
{
  _REGEX_URL.lastIndex = 0;
  var urls = null;
  var execResult;
  while ((execResult = _REGEX_URL.exec(text)))
  {
    urls = (urls || []);
    var startIndex = execResult.index;
    var url = execResult[0];
    urls.push([startIndex, url]);
  }

  return urls;
}
