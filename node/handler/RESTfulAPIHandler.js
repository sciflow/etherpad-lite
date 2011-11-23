/**
 * The RESTful API Handler handles all API requests to RESTful API urls
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

var fs = require("fs");
var path = require("path");
var async = require('async');

var api = require("../db/API");
var db = require("../db/DB").db;
var exportLatex = require("../utils/ExportLatex.js");

/**
 * Handles a RESTful HTTP API call
 */
exports.handleApiCall = function(req, res, next)
{
  /*
   * In order to stay flexible, this is implemented as an express route middleware.
   *
   * There are somethings hard coded in here which has to be moved to seperate
   * modules later on. Unfortunatly there is not much time now, so is has to be.
   */

  var result = null;

  if(!(req.method.match(/^(get|put|post|delete)$/i)))
  {
    //this is a unsupported http verb, so send http 405 (method not allowed)
    res.send(405);
    return;
  }
  
  //define which request is handled by which function
  urlToHandlerMapping = [
    {
      regEx: /^authors\/?$/,
      getHandler: getListOfAuthors,
      postHandler: createAuthor
    },
/*    {
      regEx: /^authors\/a.[0-9a-zA-Z]{16}\/?$/,
      getHandler: getAuthor,
      putHandler: putAuthor,
      deleteHandler: deleteAuthor
    },
    {
      regEx: /^groups\/?$/,
      getHandler: getListOfGroups,
      postHandler: createGroup
    },
    {
      regEx: /^groups\/g.[0-9a-zA-Z]{16}\/?$/,
      getHandler: getGroup,
      putHandler: putGroup,
      deleteHandler: deleteAuthor
    },
    {
      regEx: /^sessions\/?$/,
      getHandler: getListOfSessions,
      postHandler: createSession
    },
    {
      regEx: /^sessions\/s.[0-9a-zA-Z]{16}\/?$/,
      getHandler: getSession,
      putHandler: putSession,
      deleteHandler: deleteSession
    },
    {
      regEx: /^tokens\/?$/,
      postHandler: createToken
    },
    {
      regEx: /^tokens\/t.[0-9a-zA-Z]{16}\/?$/,
      deleteHandler: deleteToken
    },
    {
      regEx: /^pads\/?$/,
      getHandler: getListOfPads,
      postHandler: createPad
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/?$/,
      getHandler: getListOfPadRevisions,
      deleteHandler: deletePad
    },
*/
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/revisions\/?$/,
      getHandler: getPadRevisionHead
    },
/*    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/[0-9]+\/?$/,
      getHandler: getPadRevision,
      deleteHandler: deletePadRevision
    },
*/    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/revisions\/[0-9]+\/exports\/?$/,
      getHandler: getListOfAvailableExportFormats
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/revisions\/[0-9]+\/exports\/[0-9a-zA-Z_]+\/?$/,
      getHandler: exportPadRevision
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/?$/,
      getHandler: getListOfPadDatastores,
      postHandler: createDatastore,
      deleteHandler: deleteDatastores
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/[0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*\/?$/,
      getHandler: getListOfDatastoreElements,
      postHandler: createDatastoreElement,
      deleteHandler: deleteDatastore
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/[0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*\/[0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*\/?$/,
      getHandler: getDatastoreElement,
      putHandler: changeDatastoreElement,
      deleteHandler: deleteDatastoreElement
    }
  ];

  //lets figure out what the requester wants us to do
  var requestHandled = false;

  //if the request is just for /api/2 return the supported collections  
  if(typeof(req.params[0]) === 'undefined' ||  req.params[0] === '')
  {
    if(req.method.match(/^get$/i))
    {
      //respond with a list of functions
      getApiCollections(req, res, handleResult);
    }
    else
    {
      //method not allowed
      res.send(405);
    }

    requestHandled = true;
  }
  else
  {
    while(!requestHandled && urlToHandlerMapping.length > 0)
    {
      if(req.params[0].match(urlToHandlerMapping[0].regEx))
      {
        if(req.method.match(/^get$/i) && urlToHandlerMapping[0].getHandler)
        {
          urlToHandlerMapping[0].getHandler(req, res, handleResult);
        }
        else if(req.method.match(/^put$/i) && urlToHandlerMapping[0].putHandler)
        {
          urlToHandlerMapping[0].putHandler(req, res, handleResult);
        }
        else if(req.method.match(/^post$/i) && urlToHandlerMapping[0].postHandler)
        {
          urlToHandlerMapping[0].postHandler(req, res, handleResult);
        }
        else if(req.method.match(/^delete$/i) && urlToHandlerMapping[0].deleteHandler)
        {
          urlToHandlerMapping[0].deleteHandler(req, res, handleResult);
        }
        else
        {
          //method not allowed
          res.send(405);
        }

        requestHandled = true;
      }
      
      //remove the first element of the mapping an try again
      urlToHandlerMapping.shift();
    }
  }

  if(!requestHandled)
  {
    res.send(404);
  }
}

/**
 * Returns the available collections below /api/2
 */
function getApiCollections(req, res, handleResult)
{
  var result = [
    'authors',
    'groups',
    'pads',
    'sessions',
    'tokens'
  ];

  handleResult(null, req, res, result);
}

function getListOfAuthors(req, res, handleResult)
{

  var result = [
    'a.Q1u123F42o0Kiubv',
    'a.PfJRFFvnwgajkBcB',
    'a.va1lSccxNIMEuuOk'
  ];

  handleResult(null, req, res, result);
}

function createAuthor(req, res, handleResult)
{

}

function getPadRevisionHead(req, res, handleResult)
{
  //which pad do we need to grab the revisions head for ?
  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/revisions\/?$/))
  {
    db.getSub("pad:" + regExpResult[1], ["head"], function(err, result)
    {
      res.header('Pragma', 'no-cache');
      res.header('Cache-Control', 'no-cache');
      handleResult(null, req, res, result);
    });
  }
}

/**
 * Return the MIME-Types of the exprotable export formats.
 */
function getListOfAvailableExportFormats(req, res, handleResult)
{
  //first check, if there is such a pad

  var result = [
    'text/html',
    'text/xhtml+xml',
    'application/pdf',
    'application/x-latex',
    'application/x-latex+pdf'   //I know, there is no such MIME typ, but we have to distinguish between Abiword pdf export and pdflatex
  ];

  handleResult(null, req, res, result);
}

function exportPadRevision(req, res, handleResult)
{
  //we need to know, which pad, which revision and which output format
  var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/revisions\/([0-9]+)\/exports\/([0-9a-zA-Z_]+)\/?$/);

  if(regExpResult[3].match(/^pdflatex$/i))
  {
    exportLatex.getPadLatexDocument(regExpResult[1], regExpResult[2], function(err, result)
    {
      res.contentType('application/pdf');
      res.sendfile(path.normalize(__dirname + '/../../tmp/sigproc-sp.pdf'));
    });

    /*
    //send pdf
    fs.readFile(path.normalize(__dirname + '/../../tmp/sigproc-sp.pdf'), function(err, content) {
      res.contentType('application/pdf');
      res.send('Here comes the file');
    });
    */
  }
  else if(regExpResult[3].match(/^latex$/i))
  {
    exportLatex.getPadLatexDocument(regExpResult[1], regExpResult[2], function(err, result)
    {
      res.contentType('application/x-latex');
      res.send(result, 200);
    });
  }
  else
  {
    res.send(404);
  }
}

function getListOfPadDatastores(req, res, handleResult)
{
  //which pad do we need to grab the datastores list for ?
  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/?$/))
  {
    db.get("pad:" + regExpResult[1] + ":datastores", function(err, result)
    {
      //make the result null if there are no datastores
      result = (typeof(result) === 'undefined') ? null : result; 

      res.header('Pragma', 'no-cache');
      res.header('Cache-Control', 'no-cache');
      handleResult(null, req, res, result);
    });
  }
  else
  {
    res.send(403);
  }
}

function createDatastore(req, res, handleResult)
{
  var regExpResult;
  var datastoreId;

  //check if the request contains a datastoreId or if we have to generate one
  if(typeof(req.body) === 'undefined' || typeof(req.body.datastoreId) === 'undefined')
  {
    //there is no datastoreId, so let's generate one
    datastoreId = 'd.' + randomString(16);
  }
  else
  {
    datastoreId = req.body.datastoreId;
  }

  //the results of that api call should not be cached by the client
  res.header('Pragma', 'no-cache');
  res.header('Cache-Control', 'no-cache');

  //which pad do we need to create a datastore in ?
  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/?$/))
  {
    //check if a datastore with the given (or computed) datastoreId already exists
    db.get("pad:" + regExpResult[1] + ":datastores:" + datastoreId, function(err, result)
    {
      //if the result is not undefined, than there is already such a datastore
      if(typeof(result) !== 'undefined')
      {
        res.send('Datastore already exists!', 403);
        return;
      }
      else
      {
        //update the datastores list of that pad (no need for async here, this and the next db.set can be executed parallel)
        db.get("pad:" + regExpResult[1] + ":datastores", function(err, result)
        {
          //if there are no datastores for that pad yet, initialize the according array
          if(typeof(result) !== 'object')
          {
            db.set("pad:" + regExpResult[1] + ":datastores", [datastoreId]);
          }
          //if there are already datastores for that pad, add the given datastoreId to the existing ones
          else
          {
            //it should never happen, that there is a entry in the datastores list without a corresponding datastore, but for the sake of safety
            if(result.indexOf(datastoreId) === -1)
            {
              result.push(datastoreId);
            }

            db.set("pad:" + regExpResult[1] + ":datastores", result);
          }
        });

        //initialize the new datastores element list
        db.set("pad:" + regExpResult[1] + ":datastores:" + datastoreId, []);
      }

      //response with datastoreId to signal a successfull operation 
      handleResult(null, req, res, datastoreId);
    });
  }
  else
  {
    res.send(403);
  }
}

function deleteDatastores(req, res, handleResult)
{

}

function getListOfDatastoreElements(req, res, handleResult)
{
  //which pad and which datastore we need to grab the element list for ?
  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/?$/))
  {
    db.get("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2], function(err, result)
    {
      //make the result null if there is no such datastore
      result = (typeof(result) === 'undefined') ? null : result;

      res.header('Pragma', 'no-cache');
      res.header('Cache-Control', 'no-cache');
      handleResult(null, req, res, result);
    });
  }
  else
  {
    res.send(403);
    return;
  }
}

function createDatastoreElement(req, res, handleResult)
{
  var regExpResult;
  var elementId;
  var elementData;

  //handle the "post to a datastore" case, which means that the elementId is created by the server
  if((regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/?$/)) && (req.method.match(/^post$/i)))
  {
    elementId = 'e.' +  randomString(16);

    //if the content-type is not JSON, build the elementData object
    if(req.is('application/x-www-form-urlencoded') && typeof(req.body) === 'object')
    {
      var element;

      //intialize elementData as an empty object
      elementData = {};

      //we assume, that when the data comes www-form-urlencoded that the data is
      //flat, so we need to build an object before storing this in the db.
      for(element in req.body)
      {
        elementData[element] = req.body[element];
      }
    }
    else if(req.is('json') && typeof(req.body) === 'object')
    {
      elementData = req.body;
    }

    if(typeof(elementData) !== 'undefined')
    {
      //update the element list for that datastore
      db.get("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2], function(err, result)
      { 
        //handle the case that such a datastore does not exist
        if(typeof(result) === 'undefined')
        {
          //add the datastore to the list of datastores for that pad
          db.get("pad:" + regExpResult[1] + ":datastores", function(err, result)
          {
            if(typeof(result) === 'undefined')
            {
              result = [ regExpResult[2] ];
            }
            else
            {
              result.push(regExpResult[2]);
            }

            db.set("pad:" + regExpResult[1] + ":datastores", result);
          });

          //create the element list for that datastore
          db.set("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2], [ elementId ]);

          //store the received data
          db.set("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2] + ":" + elementId, elementData);
          
          //signal that everything's ok and return
          res.send(200);
          return;
        }
        else if(result.indexOf(elementId) === -1)
        {
          result.push(elementId);
          db.set("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2], result);
        
          //store the elementData object in the db
          db.set("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2] + ":" + elementId, elementData);

          res.send(200);
          return;
        }
        else
        {
          //http conflict
          res.send(409);
          return;
        }
      });
    }
    else
    {
      res.send('No object to store!', 403);
      return;
    }
  }
  else
  {
    res.send(403);
    return;
  }
}

function deleteDatastore(req, res, handleResult)
{

}

function getDatastoreElement(req, res, handleResult)
{
  var regExpResult;

  //which pad, which datastore and which element we need to grab ?
  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/?$/))
  {
    db.get("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2] + ":" + regExpResult[3], function(err, result)
    {
      //make the result null if there is no such datastore
      result = (typeof(result) === 'undefined') ? null : result;

      handleResult(null, req, res, result);
    });
  }
  else
  {
    res.send(403);
    return;
  }

}

function changeDatastoreElement(req, res, handleResult)
{
  var padId;
  var datastoreId;
  var elementId;
  var parameterObject;
  var datastoreObject;

  function preChecks()
  {
    var checksPassed = false;

    async.series([      
      //check if we can extract the needed parameters from the calling url
      function(callback)
      {
        var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/?$/)
      
        if(regExpResult === null || typeof(regExpResult[1]) !== 'string' || typeof(regExpResult[2]) !== 'string' || typeof(regExpResult[3]) !== 'string')
        {
          //signal an error
          callback(['The requested url does not match the calling conventions.', 403]);
        }
        else
        {
          //save the results for further usage
          padId = regExpResult[1];
          datastoreId = regExpResult[2];
          elementId = regExpResult[3];
         
          //call next function in series
          callback(null);
        }
      },
      //check if req.body is an object
      function(callback)
      {
        if(typeof(req.body) !== 'object')
        {
          //signal an error
          callback(['The request contains no application/x-www-form-urlencoded or application/json encoded parameter object.', 403]);
        }
        else
        {
          //save req.body for further usage
          parameterObject = req.body;

          //call next function in series
          callback(null);
        }
      },
      //check if there is a datastore entry with the given elementId
      function(callback)
      {
        db.get('pad:' + padId + ':datastores:' + datastoreId + ':' + elementId, function(err, result)
        {
          if(typeof(result) !== 'object')
          {
            //signal an error
            callback(['The requested datastore object you wished to replace does not exist.', 403]);

            //TODO: It should be possible to PUT datastore elements even if they don't exist prior
          }
          else
          {
            datastoreObject = result;

            //call next function in series
            callback(null);
          }
        });
      }
    ],
    //final callback
    function(err, results)
    {
      if(typeof(err) === 'object')
      {
        res.send(err[0] + '\n', err[1]);
        checksPassed = false;;
      }
      else
      {
        checksPassed = true;;
      }
    });

    return checksPassed;
  }

  //perform pre-checks
  if(preChecks() === false) return;

  //put the object in the datastore
  db.set("pad:" + padId + ":datastores:" + datastoreId + ":" + elementId, parameterObject, function(err, result)
  {
    res.send(200);
  });
}

function deleteDatastoreElement(req, res, handleResult)
{
  var regExpResult;

  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/?$/))
  {
    //get the element list for that datastore
    db.get("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2], function(err, result)
    {
      //if there exists such an element in that datastore, 
      if(result.indexOf(regExpResult[3]) !== -1)
      {
        //use splice to remove the element from the list
        result.splice(result.indexOf(regExpResult[3]), 1);

        //update the element list in the db
        db.set("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2], result);

        //remove the element from the datastore
        db.remove("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2] + ":" + regExpResult[3]);

        res.send(200);
        return;
      }
      else
      {
        res.send(404);
        return;
      }
    });
  }
  else
  {
    res.send(403);
    return;
  }
}

/**
 * Formates the response according to the "Accept" http header and send it
 */
function handleResult(err, req, res, result)
{
  if(!err)
  {
    if(req.accepts('json'))
    {
      res.contentType('application/json');
      res.send(JSON.stringify(result));
    }
    else if(req.accepts('html'))
    {
      res.contentType('text/html');
      res.send('<html><head><title>Etherpad-lite API</title></head><body>' + result + '</body></html>');
    }
    else
    {
      // http 406 (not acceptable)
      res.send(406);
    }
  }
}

/**
 * Generates a random String with the given length. Is needed to generate the Author Ids
 */
function randomString(len) 
{
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var randomstring = '';
  for (var i = 0; i < len; i++)
  {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }
  return randomstring;
}
