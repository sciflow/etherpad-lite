/**
 * Copyright 2011 Michael Sievers
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

exports.getPadPlainText = function(padId, revNum)
{
  var plainText;

  async.series([
    function(callback)
    {
      padManager.getPad(padId, function (err, pad)
      {
        if(typeof(err) === 'undefined' || err === null)
        {
          if(typeof(revNum) !== undefined && revNum !== null)
          { 
            plainText = pad.atext.text;
            callback(null);
          }
          else
          {
            pad.getInternalRevisionAText(revNum, function(err, atext)
            {
              plainText = atext.text;
              callback(err);
            });
          }
        }
        else
        {
          callback(err);
        }
      });
    }
  ]);

  return plainText;
}
