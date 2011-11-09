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
  var attributePool = pad.pool();

  var pieces = [];
  for (var i = 0; i < textLines.length; i++)
  {
    var line = _analyzeLine(textLines[i], attribLines[i], attributePool);
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

function getPadLatex(pad, revNum, callback)
{
  var atext = pad.atext;
  var latex;
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

  // convert atext to latex 
  function (callback)
  {
    latex = getLatexFromAtext(pad, atext);
    callback(null);
  }],

  // run final callback
  function (err)
  {
    callback(err, latex);
  });
}

function getLatexFromAtext(pad, atext)
{
  var attributePool = pad.apool();
  var textLines = atext.text.slice(0, -1).split('\n');
  var attribLines = Changeset.splitAttributionLines(atext.attribs, atext.text);

  // build the attributes array which we will need through out the export
  var attributes = [];

  for(var attribute in attributePool.attribToNum)
  {
    var attributeId = attributePool.attribToNum[attribute];
    var attributeName = String(attribute).split(',')[0];
    var attributeValue = String(attribute).split(',')[1]; 

    attributes[attributeId] =
    {
      name: attributeName,
      value: attributeValue,
      currentState: 'FALSE'
    };
  }

  // for the attributes we want to appear in our output, add the corresponding latex tags
  var attributeToLatexTagMapping = {
    bold:          { openTag: '\\textbf{',        closeTag: '}' },
    italic:        { openTag: '\\textit{',        closeTag: '}' },
    underline:     { openTag: '\\underline{',     closeTag: '}' },
    strikethrough: { openTag: '\\sout{',          closeTag: '}' },
    heading1:      { openTag: '\\chapter{',       closeTag: '}\n' },
    heading2:      { openTag: '\\section{',       closeTag: '}\n' },
    heading3:      { openTag: '\\subsection{',    closeTag: '}\n' },
    heading4:      { openTag: '\\subsubsection{', closeTag: '}\n' },
    heading5:      { openTag: '\\paragraph{',     closeTag: '}\n' },
    heading6:      { openTag: '\\subparagraph{',  closeTag: '}\n' },
  };

  for(var attributeId in attributes)
  {
    attributes[attributeId].latexOpenTag = '';
    attributes[attributeId].latexCloseTag = '';
   
    if(typeof(attributeToLatexTagMapping[attributes[attributeId].name]) !== 'undefined') 
    {
      attributes[attributeId].latexOpenTag = attributeToLatexTagMapping[attributes[attributeId].name].openTag;
      attributes[attributeId].latexCloseTag = attributeToLatexTagMapping[attributes[attributeId].name].closeTag;
    }
    // we can put latex tags around some more special attributes too
    else if(attributes[attributeId].name === 'author')
    {
      //attributes[attributeId].latexOpenTag = '<span class="author-' + attributes[attributeId].value.replace(/\./g,'-') + '">';
      //attributes[attributeId].latexCloseTag = '</span>';
    }
  }

  var pieces = [];

  //an array containing the operations introduced by the attribs string
  var operations = atext.attribs.replace(/(\*[a-zA-Z-0-9]+)/g, "$1 ").replace(/(\+[a-zA-Z0-9]+)/g, "$1 ").replace(/(\|[a-zA-Z0-9]\+[a-zA-Z0-9]+)/g, "$1 ").replace(/(?: ){2,}/g, " ").split(' ');

  var currentMode = 'alterAttributesToApply';
  var currentCursorPosition = 0;
  var attributesToApply = []; //an object with members referenced by the attributeId

  //we need to declare these in order for them not to be global
  var currentOperation = undefined;
  var regExpMatch = undefined;

  while(currentOperation = operations.shift())
  {
    if(regExpMatch = currentOperation.match(/^\*([a-zA-Z0-9]+)$/))
    {
      //if we are currently in applyAttributes mode, switch to alterAppliedAttributes mode
      if(currentMode === 'applyAttributes')
      {
        currentMode = 'alterAttributesToApply';

        for(var attributeId = 0; attributeId < attributesToApply.length; attributeId++)
        {
          if(typeof(attributesToApply[attributeId]) !== 'undefined')
          {
            attributesToApply[attributeId] = 'leftoverAttribute';
          }
        }
      }

      //at this point we have to be in alterAppliedAttributes mode
      var attributeId = parseInt(regExpMatch[1], 36);
      
      if(typeof(attributesToApply[attributeId]) === 'undefined')
      {
        attributesToApply[attributeId] = 'newlyAddedAttribute';
      }
      else
      {
        attributesToApply[attributeId] = 'remainingAttribute'; //do we need this ?
      }
    }
    else if(regExpMatch = currentOperation.match(/^(?:\|([a-zA-Z0-9]+))?\+([a-zA-Z0-9]+)$/))
    {
      //if we are currentliy in alterAppliedAttributes mode, switch to applyAttributesMode
      if(currentMode === 'alterAttributesToApply')
      {
        currentMode = 'applyAttributes';

        //remove all attributes which are leftover from the second last alterAppliedAttributes turn and push the appropriate close tags
        for(var attributeId = 0; attributeId < attributesToApply.length; attributeId++)
        {
          if(attributesToApply[attributeId] === 'leftoverAttribute')
          {
            //handle the case that the closing tag follows a newline
            var lastPiece = pieces.pop();

            if(lastPiece.match(/\n$/))
            {
              pieces.push(attributes[attributeId].latexCloseTag + lastPiece);
            }
            else
            {
              pieces.push(lastPiece);
              pieces.push(attributes[attributeId].latexCloseTag);
            }

            attributesToApply[attributeId] = undefined;
          }
        }

        //now look, which tags we have to open for newly added attributes
        for(var attributeId = 0; attributeId < attributesToApply.length; attributeId++)
        {
          if(attributesToApply[attributeId] === 'newlyAddedAttribute')
          {
            pieces.push(attributes[attributeId].latexOpenTag);
            attributesToApply[attributeId] = 'remainingAttribute'; 
          }
        }
      }

      //put out the text
      pieces.push(atext.text.slice(currentCursorPosition, currentCursorPosition + parseInt(regExpMatch[2], 36) ));
      
      //update to current cursor
      currentCursorPosition += parseInt(regExpMatch[2], 36);
    }
  }

  return pieces.join('');
}

function _analyzeLine(text, aline, attributePool)
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
      var listType = Changeset.opAttributeValue(opIter.next(), 'list', attributePool);
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

exports.getPadLatexDocument = function (padId, revNum, callback)
{
  padManager.getPad(padId, function (err, pad)
  {
    if (err)
    {
      callback(err);
      return;
    }

    var head = '';

    var foot = '';

    getPadLatex(pad, revNum, function (err, latex)
    {
      callback(err, head + latex + foot);
    });
  });
}
