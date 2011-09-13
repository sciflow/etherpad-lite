/**
 * Handles the export requests
 */

/*
 * 2011 Peter 'Pita' Martischka (Primary Technology Ltd)
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

var exporthtml = require("../utils/ExportHtml");
var padManager = require("../db/PadManager");
var async = require("async");
var fs = require("fs");
var settings = require('../utils/Settings');
var os = require('os');
var xsltproc = require("../utils/Xsltproc");

var tempDirectory = "/tmp";

//tempDirectory changes if the operating system is windows 
if(os.type().indexOf("Windows") > -1)
{
  tempDirectory = process.env.TEMP;
}
  
/**
 * do a requested export
 */ 
exports.doExport = function(req, res, padId, type)
{
  debugger;
  //tell the browser that this is a downloadable file
  res.attachment(padId + "." + type);

  //if this is a plain text export, we can do this directly
  if(type == "tex")
  {
    var html;
    var randNum;
    var srcFile, destFile;

    async.series([
      //render the html document
      function(callback)
      {
        exporthtml.getPadHTMLDocument(padId, null, true, function(err, _html)
        {
          html = _html;
          callback(err);
        });   
      },
      //decide what to do with the html export
      function(callback)
      {
        randNum = Math.floor(Math.random()*new Date().getTime());
        srcFile = tempDirectory + "/eplite_export_" + randNum + ".html";
        fs.writeFile(srcFile, html, callback); 
      },
      //send the convert job to abiword
      function(callback)
      {
        //ensure html can be collected by the garbage collector
        html = null;
      
        destFile = tempDirectory + "/eplite_export_" + randNum + "." + type;
        xsltproc.convertFile(srcFile, destFile, type, callback);
	//callback();
      },
      //send the file
      function(callback)
      {
        //res.sendfile(destFile, null, callback);
        res.sendfile(destFile, null, callback);
      },
      //clean up temporary files
      function(callback)
      {
        async.parallel([
          function(callback)
          {
            fs.unlink(srcFile, callback);
          },
          function(callback)
          {
            //100ms delay to accomidate for slow windows fs
            setTimeout(function() 
            {
              fs.unlink(destFile, callback);
            }, 100);
          }
        ], callback);
      }
    ], function(err)
    {
      if(err && err != "stop") throw err;
    })
  }
};
