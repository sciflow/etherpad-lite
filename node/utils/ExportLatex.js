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

function generateExportTags(attributeName, attributeValue, tagType)
{
  if(attributeName === 'bold')                return (tagType === 'openTag') ? '\\textbf{'                           : '}';
  else if (attributeName === 'italic')        return (tagType === 'openTag') ? '\\textit{'                           : '}';
  else if (attributeName === 'underline')     return (tagType === 'openTag') ? '\\underline{'                        : '}';
  else if (attributeName === 'strikethrough') return (tagType === 'openTag') ? '\\sout{'                             : '}';
  else if (attributeName === 'heading1')      return (tagType === 'openTag') ? '\\chapter{'                          : '}\n';
  else if (attributeName === 'heading2')      return (tagType === 'openTag') ? '\\section{'                          : '}\n';
  else if (attributeName === 'heading3')      return (tagType === 'openTag') ? '\\subsection{'                       : '}\n';
  else if (attributeName === 'heading4')      return (tagType === 'openTag') ? '\\subsubsection{'                    : '}\n';
  else if (attributeName === 'heading5')      return (tagType === 'openTag') ? '\\paragraph{'                        : '}\n';
  else if (attributeName === 'heading6')      return (tagType === 'openTag') ? '\\subparagraph{'                     : '}\n';
  else if (attributeName === 'graphic')
    return (tagType === 'openTag') ? '\\includegraphics{' + JSON.parse(attributeValue).url                           : '}';
  else if (attributeName === 'cite')          return (tagType === 'openTag') ? '\\cite{'            + attributeValue : '}';
  else if (attributeName === 'footnote')      return (tagType === 'openTag') ? '\\footnote{'        + attributeValue : '}';
  else return '';
}

function getLatexFromAtext(pad, atext)
{
  // get the attribute pool
  var attributePool = pad.apool();

  // build the attributes array which we will need through out the export
  var attributes = [];

  for(var attribute in attributePool.attribToNum)
  {
    var attributeId = attributePool.attribToNum[attribute];
    var attributeName = String(attribute).split(',')[0];
    var attributeValue = String(attribute).split(',')[1];

    attributes[attributeId] = {};

    attributes[attributeId].name = attributeName;
    attributes[attributeId].value = attributeValue;
    attributes[attributeId].currentState = undefined;

    attributes[attributeId].openTag = generateExportTags(attributeName, attributeValue, 'openTag');
    attributes[attributeId].closeTag = generateExportTags(attributeName, attributeValue, 'closeTag');
  }

  var pieces = [];

  //an array containing the operations introduced by the attribs string
  var operations = atext.attribs.replace(/(\*[a-zA-Z-0-9]+)/g, "$1 ").replace(/(\+[a-zA-Z0-9]+)/g, "$1 ").replace(/(\|[a-zA-Z0-9]\+[a-zA-Z0-9]+)/g, "$1 ").replace(/(?: ){2,}/g, " ").split(' ');

  var currentMode = 'alterAttributesToApply';
  var currentCursorPosition = 0;

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

        for(var attributeId in attributes)
        {
          if(typeof(attributes[attributeId].currentState) !== 'undefined')
          {
            attributes[attributeId].currentState = 'leftoverAttribute';
          }
        }
      }

      //at this point we have to be in alterAppliedAttributes mode
      var attributeId = parseInt(regExpMatch[1], 36);
      
      if(typeof(attributes[attributeId].currentState) === 'undefined')
      {
        attributes[attributeId].currentState = 'newlyAddedAttribute';
      }
      else
      {
        attributes[attributeId].currentState = 'remainingAttribute'; //do we need this ?
      }
    }
    else if(regExpMatch = currentOperation.match(/^(?:\|([a-zA-Z0-9]+))?\+([a-zA-Z0-9]+)$/))
    {
      //if we are currentliy in alterAppliedAttributes mode, switch to applyAttributesMode
      if(currentMode === 'alterAttributesToApply')
      {
        currentMode = 'applyAttributes';

        //remove all attributes which are leftover from the second last alterAppliedAttributes turn and push the appropriate close tags
        for(var attributeId in attributes)
        {
          if(attributes[attributeId].currentState === 'leftoverAttribute')
          {
            //handle the case that the closing tag follows a newline
            var lastPiece = pieces.pop();

            if(lastPiece.match(/\n$/))
            {
              pieces.push(attributes[attributeId].closeTag + lastPiece);
            }
            else
            {
              pieces.push(lastPiece);
              pieces.push(attributes[attributeId].closeTag);
            }

            attributes[attributeId].currentState = undefined;
          }
        }

        //now look, which tags we have to open for newly added attributes
        for(var attributeId in attributes)
        {
          if(attributes[attributeId].currentState === 'newlyAddedAttribute')
          {
            pieces.push(attributes[attributeId].openTag);
            attributes[attributeId].currentState = 'remainingAttribute'; 
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
