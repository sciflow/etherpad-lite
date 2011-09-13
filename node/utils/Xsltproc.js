/**
 * Controls the communication with the xsltproc application
 */

/*
 * 2011 Michael Sievers (University of Paderborn)
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
 
var util  = require('util');
var spawn = require('child_process').spawn;
var async = require("async");
var settings = require("./Settings");
var os = require('os');
var fs = require('fs');
var sys = require('sys');

var doConvertTask;
var stdoutBuffer = '';

doConvertTask = function(task, callback)
{
  debugger;
  var xslt_style_sheet = 'xh2latex.xsl';
   
  //TODO: Check whether xsltproc exists or handle the error of spawn

  //span an xsltproc process to perform the conversion
  var xsltproc = spawn('xsltproc', [xslt_style_sheet, task.srcFile],{cwd:'/tmp'});
    
  //delegate the processing of stdout to another function
  xsltproc.stdout.on('data', function (data)
  {
    //add data to buffer
    stdoutBuffer+=data.toString();
  });

  //append error messages to the buffer
  xsltproc.stderr.on('data', function (data) 
  {
    stdoutBuffer += data.toString();
  });

  //throw exceptions if xsltproc is dieing
  xsltproc.on('exit', function (code)
  {
    if(code != 0) {
      throw "xsltproc died with exit code " + code;
    }

    if(stdoutBuffer != "")
    {
      console.log(stdoutBuffer);

      fs.writeFile(task.destFile, stdoutBuffer, function(err) {
        if(err) {
          sys.puts(err);
        }
      }); 
    }

    callback();
  });
}
  
exports.convertFile = function(srcFile, destFile, type, callback)
{
  doConvertTask({"srcFile": srcFile, "destFile": destFile, "type": type}, callback);
};


/*  
  //Queue with the converts we have to do
  var queue = async.queue(doConvertTask, 1);
  
  exports.convertFile = function(srcFile, destFile, type, callback)
  {	
    queue.push({"srcFile": srcFile, "destFile": destFile, "type": type, "callback": callback});
  };
*/
