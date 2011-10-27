/**
 * Controls the security of pad access
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
 
var db = require("./DB").db;
var async = require("async");
var authorManager = require("./AuthorManager");
var padManager = require("./PadManager");
var sessionManager = require("./SessionManager");

/**
  * Since we are using the Express framework we can check the access rights
  * during each ressource request using a route middleware function.
  */
exports.checkAccessRouteMiddleware = function (req, res, next) {

  /*
   * This function hast to check if the user is allready authenticated.
   * In some cases, it is not neccessary for the user to be allready authenticated, e.g. if the user tries to access a public pad. 
   * If the user is authenticated, the function has to check, if the user is allowed to access the specified ressource.
   * If the user is not authenticated, the use should be redirected to a page, which allows the user to authenticate.
   */

  // is there an accessControlList record for the requested URL (e.g. /p/9CXXrjihsa) ?
  // if we can consider, that an accessControlList is created everytime, a ressource is created, than an access can be denied of there is no ACL
  // BUT what if the user access a sub ressource of a ressource and there is no ACL for the subressource ?
  // - e.g. the user tries to access /p/9CXXrjihsa/datastore/images/5 ?
  // - this means that for every datastoreAdd operation, an appropriate ACL has to be created
  // - the created ACL should by default simply adopt the settings of its parent ressource, or if the is no entry for that, than for the next parent and so on.
}

/**
 * This function controlls the access to a pad, it checks if the user can access a pad.
 * @param padID the pad the user wants to access
 * @param sesssionID the session the user has (set via api)
 * @param token the token of the author (randomly generated at client side, used for public pads)
 * @param password the password the user has given to access this pad, can be null 
 * @param callback will be called with (err, {accessStatus: grant|deny|wrongPassword|needPassword, authorID: a.xxxxxx})
 */ 
exports.checkAccess = function (padID, sessionID, token, password, callback)
{ 
  // it's not a group pad, means we can grant access
  if(padID.indexOf("$") == -1)
  {
    //get author for this token
    authorManager.getAuthor4Token(token, function(err, author)
    {
      // grant access, with author of token
      callback(err, {accessStatus: "grant", authorID: author});
    })
    
    //don't continue
    return;
  }
   
  var groupID = padID.split("$")[0];
  var padExists = false;
  var validSession = false;
  var sessionAuthor;
  var tokenAuthor;
  var isPublic;
  var isPasswordProtected;
  var passwordStatus = password == null ? "notGiven" : "wrong"; // notGiven, correct, wrong

  var statusObject;

  async.series([
    //get basic informations from the database 
    function(callback)
    {
      async.parallel([
        //does pad exists
        function(callback)
        {
          padManager.doesPadExists(padID, function(err, exists)
          {
            padExists = exists;
            callback(err);
          });
        },
        //get informations about this session
        function(callback)
        {
          sessionManager.getSessionInfo(sessionID, function(err, sessionInfo)
          {
            //skip session validation if the session doesn't exists
            if(err && err.stop == "sessionID does not exist")
            {
              callback();
              return;
            }
            
            if(err) {callback(err); return}
            
            var now = Math.floor(new Date().getTime()/1000);
            
            //is it for this group? and is validUntil still ok? --> validSession
            if(sessionInfo.groupID == groupID && sessionInfo.validUntil > now)
            {
              validSession = true;
            }
            
            sessionAuthor = sessionInfo.authorID;
            
            callback();
          });
        },
        //get author for token
        function(callback)
        {
          //get author for this token
          authorManager.getAuthor4Token(token, function(err, author)
          {
            tokenAuthor = author;
            callback(err);
          });
        }
      ], callback);
    },
    //get more informations of this pad, if avaiable
    function(callback)
    {
      //skip this if the pad doesn't exists
      if(padExists == false) 
      {
        callback();
        return;
      }
      
      padManager.getPad(padID, function(err, pad)
      {
        if(err) {callback(err); return}
        
        //is it a public pad?
        isPublic = pad.getPublicStatus();
        
        //is it password protected?
        isPasswordProtected = pad.isPasswordProtected();
        
        //is password correct?
        if(isPasswordProtected && password && pad.isCorrectPassword(password))
        {
          passwordStatus = "correct";
        }
        
        callback();
      });
    },
    function(callback)
    {
      //- a valid session for this group is avaible AND pad exists
      if(validSession && padExists)
      {
        //- the pad is not password protected
        if(!isPasswordProtected)
        {
          //--> grant access
          statusObject = {accessStatus: "grant", authorID: sessionAuthor};
        }
        //- the pad is password protected and password is correct
        else if(isPasswordProtected && passwordStatus == "correct")
        {
          //--> grant access
          statusObject = {accessStatus: "grant", authorID: sessionAuthor};
        }
        //- the pad is password protected but wrong password given
        else if(isPasswordProtected && passwordStatus == "wrong")
        {
          //--> deny access, ask for new password and tell them that the password is wrong
          statusObject = {accessStatus: "wrongPassword"};
        }
        //- the pad is password protected but no password given
        else if(isPasswordProtected && passwordStatus == "notGiven")
        {
          //--> ask for password
          statusObject = {accessStatus: "needPassword"};
        }
        else
        {
          throw new Error("Ops, something wrong happend");
        }
      } 
      //- a valid session for this group avaible but pad doesn't exists
      else if(validSession && !padExists)
      {
        //--> grant access
        statusObject = {accessStatus: "grant", authorID: sessionAuthor};
      }
      // there is no valid session avaiable AND pad exists
      else if(!validSession && padExists)
      {
        //-- its public and not password protected
        if(isPublic && !isPasswordProtected)
        {
          //--> grant access, with author of token
          statusObject = {accessStatus: "grant", authorID: tokenAuthor};
        }
        //- its public and password protected and password is correct
        else if(isPublic && isPasswordProtected && passwordStatus == "correct")
        {
          //--> grant access, with author of token
          statusObject = {accessStatus: "grant", authorID: tokenAuthor};
        }
        //- its public and the pad is password protected but wrong password given 
        else if(isPublic && isPasswordProtected && passwordStatus == "wrong")
        {
          //--> deny access, ask for new password and tell them that the password is wrong
          statusObject = {accessStatus: "wrongPassword"};
        }
        //- its public and the pad is password protected but no password given
        else if(isPublic && isPasswordProtected && passwordStatus == "notGiven")
        {
          //--> ask for password
          statusObject = {accessStatus: "needPassword"};
        }
        //- its not public
        else if(!isPublic)
        {
          //--> deny access
          statusObject = {accessStatus: "deny"};
        }
        else
        {
          throw new Error("Ops, something wrong happend");
        }
      }    
      // there is no valid session avaiable AND pad doesn't exists
      else
      {
         //--> deny access
         statusObject = {accessStatus: "deny"};
      }
      
      callback();
    }
  ], function(err)
  {
    callback(err, statusObject);
  });
}
