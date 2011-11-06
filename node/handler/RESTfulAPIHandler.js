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
var api = require("../db/API");

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
    }];
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
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/[0-9]+\/?$/,
      getHandler: getPadRevision,
      deleteHandler: deletePadRevision
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/[0-9]+\/exports\/?$/,
      getHandler: getListOfAvailableExportFormats
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/[0-9]+\/exports\/[0-9a-zA-Z_]+\/?$/,
      getHandler: exportPadRevision
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/?$/,
      getHandler: getListOfPadDatastores,
      postHandler: createDatastore,
      deleteHandler: deleteDatastores
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/[0-9a-zA-Z]+\/?$/,
      getHandler: getListOfDatastoreElements,
      postHandler: createDatastoreElement,
      deleteHandler: deleteDatastore
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/[0-9a-zA-Z]+\/[0-9a-zA-Z]+\/?$/,
      getHandler: getDatastoreElement,
      putHandler: putDatastoreElement,
      deleteHandler: deleteDatastoreElement
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/[0-9a-zA-Z]+\/[0-9a-zA-Z]+\/?$/,
      getHandler: getDatastoreElement,
      putHandler: putDatastoreElement,
      deleteHandler: deleteDatastoreElement
    },
  ];
  */

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
      res.send(result);
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
