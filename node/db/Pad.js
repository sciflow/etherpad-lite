/**
 * The pad object, defined with joose
 */

require('joose');

var Changeset = require("../utils/Changeset");
var AttributePoolFactory = require("../utils/AttributePoolFactory");
var db = require("./DB").db;
var async = require("async");
var settings = require('../utils/Settings');
var authorManager = require("./AuthorManager");
var padManager = require("./PadManager");
var padMessageHandler = require("../handler/PadMessageHandler");
var readOnlyManager = require("./ReadOnlyManager");
var crypto = require("crypto");

/**
 * Copied from the Etherpad source code. It converts Windows line breaks to Unix line breaks and convert Tabs to spaces
 * @param txt
 */
exports.cleanText = function (txt) {
  return txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\t/g, '        ').replace(/\xa0/g, ' ');
}

Class('Pad', {

  // these are the properties
  has : {
    
    atext : { 
      is : 'rw', // readwrite
      init : function() { return Changeset.makeAText("\n"); } // first value
    }, // atext
    
    pool : { 
      is: 'rw', 
      init : function() { return AttributePoolFactory.createAttributePool(); },
      getterName : 'apool' // legacy
    }, // pool
    
    head : { 
      is : 'rw', 
      init : -1, 
      getterName : 'getHeadRevisionNumber' 
    }, // head
    
    chatHead : {
      is: 'rw',
      init: -1
    }, // chatHead
    
    publicStatus : {
      is: 'rw',
      init: false,
      getterName : 'getPublicStatus'
    }, //publicStatus
    
    passwordHash : {
      is: 'rw',
      init: null
    }, // passwordHash
    
    id : { is : 'r' }
  },

  methods : {
  
    BUILD : function (id) 
    {
        return {
            'id' : id,
        }
    },

    //TODO: It would be even nicer if the datastore operations would be grouped like Pad.datastore.get() ...
    datastoreGet : function(datastoreId, recordId, callback)
    {
      var _this = this;

      // if a recordId is given, return only that single record      
      if(typeof(recordId) !== 'undefined' && recordId !== null)
      {
        db.get("pad:" + _this.id + ":datastore:" + datastoreId + ":" + recordId, callback);
      }
      // if no recordId is given, return an array containing all datastore entries
      else
      {
        // get all datastore entrys
        db.get("pad:" + _this.id + ":datastore:" + datastoreId + ":" + "HEAD", function(err, headCounter)
        {
          var recordCount = parseInt(headCounter);
          var records = [];

          // initialize and extend the array in order to use it with async.forEach
          for(var i = 0;i < recordCount+1; i++)
          {
            records[i] = i; 
          }

          async.forEach(records, function(recordId, forEachCallback)
          {
            db.get("pad:" + _this.id + ":datastore:" + datastoreId + ":" + recordId, function(err, recordObject)
            {
              records[recordId] = recordObject;
              forEachCallback(err);
            });
          }, function(err)
          {
            callback(err, records);
          }); 
        });    
      }
    },

    datastoreAdd : function(datastoreId, recordObject, callback)
    {
      var _this = this;

      // if no recordObject is given, return immediately with a -1 indicating an error to the calling function
      if(typeof(recordObject) === 'undefined' || recordObject === null)
      {
        var err = -1;
        callback(err);
      }
      // otherwise
      else
      {
        // check if the datastore exists (if there is a HEAD entry, we have a datastore)
        db.get("pad:" + _this.id + ":datastore:" + datastoreId + ":" + "HEAD", function(err, headCounter)
        {
          // if there is no HEAD counter, set it to -1 so that the following logic works just fine
          if(typeof(headCounter) === 'undefined')
          {
            headCounter = -1;
          }

          // increment the head counter (doing this inline using ++ does not work even when using as suffix)
          var newHeadCounter = headCounter + 1;
        
          // now push the object in the datastore
          db.set("pad:" + _this.id + ":datastore:" + datastoreId + ":" + newHeadCounter,
          {
            'recordData' : recordObject,
            'recordMetaData' :
            {
              'someMetaData' : 'something interesting'
            }
          });

          // after pushing the object to the datastore, update the increment the head counter in the db
          db.set("pad:" + _this.id + ":datastore:" + datastoreId + ":" + "HEAD", newHeadCounter);

          // return the new head counter after adding the record object
          callback(null, newHeadCounter);
        });
      }
    },

    datastoreDelete : function(datastoreId, recordId, callback)
    {
      var _this = this;

      // if a recordId is given, delete only that single record
      if(typeof(recordId) !== 'undefined' && recordId !== null)
      {
        db.remove("pad:" + _this.id + ":datastore:" + datastoreId + ":" + recordId, callback);
      }
      // if no recordId is given, delete all entries of the datastore and the head counter
      else
      {
        // we need to know the head counter in order to delete all entries with recordId <= headCounter
        db.get("pad:" + _this.id + ":datastore:" + datastoreId + ":" + "HEAD", function(err, headCounter)
        {
          var recordCount = parseInt(headCounter);
          var records = [];

          // initialize and extend the array in order to use it with async.forEach
          for(var i = 0;i < recordCount+1; i++)
          {
            records[i] = i;
          }

          async.forEach(records, function(recordId, forEachCallback)
          {
            db.remove("pad:" + _this.id + ":datastore:" + datastoreId + ":" + recordId);
            forEachCallback(err);
          }, function(err)
          {
            // last but not least (if there was no error) delete the head counter
            if(!err) db.remove("pad:" + _this.id + ":datastore:" + datastoreId + ":" + "HEAD");
            callback(null, null);
          });
        });
      } 
    },

    appendRevision : function(aChangeset, author) 
    {
      if(!author)
        author = '';

      var newAText = Changeset.applyToAText(aChangeset, this.atext, this.pool);
      Changeset.copyAText(newAText, this.atext);
      
      var newRev = ++this.head;
      
      var newRevData = {};
      newRevData.changeset = aChangeset;
      newRevData.meta = {};
      newRevData.meta.author = author;
      newRevData.meta.timestamp = new Date().getTime();
      
      //ex. getNumForAuthor
      if(author != '')
        this.pool.putAttrib(['author', author || '']);
      
      if(newRev % 100 == 0)
      {
        newRevData.meta.atext = this.atext;
      }
      
      db.set("pad:"+this.id+":revs:"+newRev, newRevData);
      db.set("pad:"+this.id, {atext: this.atext, 
                              pool: this.pool.toJsonable(), 
                              head: this.head, 
                              chatHead: this.chatHead, 
                              publicStatus: this.publicStatus, 
                              passwordHash: this.passwordHash});
    }, //appendRevision
    
    getRevisionChangeset : function(revNum, callback) 
    {
      db.getSub("pad:"+this.id+":revs:"+revNum, ["changeset"], callback);
    }, // getRevisionChangeset
    
    getRevisionAuthor : function(revNum, callback) 
    {      
      db.getSub("pad:"+this.id+":revs:"+revNum, ["meta", "author"], callback);
    }, // getRevisionAuthor
    
    getRevisionDate : function(revNum, callback) 
    {      
      db.getSub("pad:"+this.id+":revs:"+revNum, ["meta", "timestamp"], callback);
    }, // getRevisionAuthor
    
    getAllAuthors : function() 
    {
      var authors = [];
  
      for(key in this.pool.numToAttrib)
      {
        if(this.pool.numToAttrib[key][0] == "author" && this.pool.numToAttrib[key][1] != "")
        {
          authors.push(this.pool.numToAttrib[key][1]);
        }
      }
      
      return authors;
    },
    
    getInternalRevisionAText : function(targetRev, callback) 
    {
      var _this = this;
    
      var keyRev = this.getKeyRevisionNumber(targetRev);
      var atext; 
      var changesets = [];
      
      //find out which changesets are needed
      var neededChangesets = [];
      var curRev = keyRev;
      while (curRev < targetRev) 
      {
        curRev++;
        neededChangesets.push(curRev);
      }
      
      async.series([
        //get all needed data out of the database
        function(callback)
        {
          async.parallel([
            //get the atext of the key revision
            function (callback)
            {
              db.getSub("pad:"+_this.id+":revs:"+keyRev, ["meta", "atext"], function(err, _atext)
              {
                atext = Changeset.cloneAText(_atext);
                callback(err);
              });
            },
            //get all needed changesets
            function (callback)
            {
              async.forEach(neededChangesets, function(item, callback)
              {
                _this.getRevisionChangeset(item, function(err, changeset)
                {
                  changesets[item] = changeset;
                  callback(err);
                });
              }, callback);
            }
          ], callback);
        },
        //apply all changesets to the key changeset
        function(callback)
        {        
          var apool = _this.apool();
          var curRev = keyRev;
          
          while (curRev < targetRev) 
          {
            curRev++;
            var cs = changesets[curRev];
            atext = Changeset.applyToAText(cs, atext, apool);
          }
          
          callback(null);
        }  
      ], function(err)
      {
        callback(err, atext);
      });
    },
    
    getKeyRevisionNumber : function(revNum)
    {
      return Math.floor(revNum / 100) * 100;
    },
    
    text : function()
    {
      return this.atext.text;
    },
    
    setText : function(newText)
    {
      //clean the new text
      newText = exports.cleanText(newText);
      
      var oldText = this.text();
      
      //create the changeset 
      var changeset = Changeset.makeSplice(oldText, 0, oldText.length-1, newText);
      
      //append the changeset
      this.appendRevision(changeset);
    },
    
    appendChatMessage: function(text, userId, time)
    {
      this.chatHead++;
      //save the chat entry in the database
      db.set("pad:"+this.id+":chat:"+this.chatHead, {"text": text, "userId": userId, "time": time});
      //save the new chat head
      db.setSub("pad:"+this.id, ["chatHead"], this.chatHead);
    },
    
    getChatMessage: function(entryNum, callback)
    {      
      var _this = this;
      var entry;
      
      async.series([
        //get the chat entry 
        function(callback)
        {
          db.get("pad:"+_this.id+":chat:"+entryNum, function(err, _entry)
          {
            entry = _entry;
            callback(err);
          });
        },
        //add the authorName
        function(callback)
        {          
          //this chat message doesn't exist, return null
          if(entry == null)
          {
            callback();
            return;
          }
          
          //get the authorName
          authorManager.getAuthorName(entry.userId, function(err, authorName)
          {
            entry.userName = authorName;
            callback(err);
          });
        }
      ], function(err)
      {
        callback(err, entry);
      });
    },
    
    getLastChatMessages: function(count, callback)
    {
      //return an empty array if there are no chat messages 
      if(this.chatHead == -1)
      {
        callback(null, []);
        return;
      }
    
      var _this = this;
      
      //works only if we decrement the amount, for some reason
      count--;

      //set the startpoint
      var start = this.chatHead-count;
      if(start < 0)
        start = 0;
      
      //set the endpoint        
      var end = this.chatHead;
      
      //collect the numbers of chat entries and in which order we need them
      var neededEntries = [];
      var order = 0;
      for(var i=start;i<=end; i++)
      {
        neededEntries.push({entryNum:i, order: order});
        order++;
      }
      
      //get all entries out of the database
      var entries = [];
      async.forEach(neededEntries, function(entryObject, callback)
      {
        _this.getChatMessage(entryObject.entryNum, function(err, entry)
        {
          entries[entryObject.order] = entry;
          callback(err);
        });
      }, function(err)
      {
        //sort out broken chat entries
        //it looks like in happend in the past that the chat head was 
        //incremented, but the chat message wasn't added
        var cleanedEntries = [];
        for(var i=0;i<entries.length;i++)
        {
          if(entries[i]!=null)
            cleanedEntries.push(entries[i]);
          else
            console.warn("WARNING: Found broken chat entry in pad " + _this.id);
        }
      
        callback(err, cleanedEntries);
      });
    },
    
    init : function (text, callback) 
    {    
      var _this = this;
      
      //replace text with default text if text isn't set
      if(text == null)
      {
        text = settings.defaultPadText;
      }
    
      //try to load the pad  
      db.get("pad:"+this.id, function(err, value)
      {
        if(err)
        {
          callback(err, null);
          return;
        }  
        
        //if this pad exists, load it
        if(value != null)
        {
          _this.head = value.head;
          _this.atext = value.atext;
          _this.pool = _this.pool.fromJsonable(value.pool);
          
          //ensure we have a local chatHead variable
          if(value.chatHead != null)
            _this.chatHead = value.chatHead;
          else
            _this.chatHead = -1;
            
          //ensure we have a local publicStatus variable
          if(value.publicStatus != null)
            _this.publicStatus = value.publicStatus;
          else
            _this.publicStatus = false; 
           
          //ensure we have a local passwordHash variable
          if(value.passwordHash != null)
            _this.passwordHash = value.passwordHash;
          else
            _this.passwordHash = null;
        }
        //this pad doesn't exist, so create it
        else
        {
          var firstChangeset = Changeset.makeSplice("\n", 0, 0, exports.cleanText(text));                      
      
          _this.appendRevision(firstChangeset, '');
        }
        
        callback(null);
      });
    },
    remove: function(callback)
    {
      var padID = this.id;
      var _this = this;
      
      //kick everyone from this pad
      padMessageHandler.kickSessionsFromPad(padID);
      
      async.series([
        //delete all relations
        function(callback)
        {
          async.parallel([
            //is it a group pad? -> delete the entry of this pad in the group
            function(callback)
            {
              //is it a group pad?
              if(padID.indexOf("$")!=-1)
              {
                var groupID = padID.substring(0,padID.indexOf("$"));
                
                db.get("group:" + groupID, function (err, group)
                {
                  if(err) {callback(err); return}
                  
                  //remove the pad entry
                  delete group.pads[padID];
                  
                  //set the new value
                  db.set("group:" + groupID, group);
                  
                  callback();
                });
              }
              //its no group pad, nothing to do here
              else
              {
                callback();
              }
            },
            //remove the readonly entries
            function(callback)
            {
              readOnlyManager.getReadOnlyId(padID, function(err, readonlyID)
              {
                if(err) {callback(err); return}
                
                db.remove("pad2readonly:" + padID);
                db.remove("readonly2pad:" + readonlyID);
                
                callback();
              });
            },
            //delete all chat messages
            function(callback)
            {
              var chatHead = _this.chatHead;
              
              for(var i=0;i<=chatHead;i++)
              {
                db.remove("pad:"+padID+":chat:"+i);
              }
              
              callback();
            },
            //delete all revisions
            function(callback)
            {
              var revHead = _this.head;
              
              for(var i=0;i<=revHead;i++)
              {
                db.remove("pad:"+padID+":revs:"+i);
              }
              
              callback();
            }
          ], callback);
        },
        //delete the pad entry and delete pad from padManager
        function(callback)
        {
          db.remove("pad:"+padID);
          padManager.unloadPad(padID);
          callback();
        }
      ], function(err)
      {
        callback(err);
      })
    },
    //set in db
    setPublicStatus: function(publicStatus)
    {
      this.publicStatus = publicStatus;
      db.setSub("pad:"+this.id, ["publicStatus"], this.publicStatus);
    },
    setPassword: function(password)
    {
      this.passwordHash = password == null ? null : hash(password, generateSalt());
      db.setSub("pad:"+this.id, ["passwordHash"], this.passwordHash);
    }, 
    isCorrectPassword: function(password)
    {
      return compare(this.passwordHash, password)
    }, 
    isPasswordProtected: function()
    {
      return this.passwordHash != null;
    }
  }, // methods
});

/* Crypto helper methods */

function hash(password, salt)
{
  var shasum = crypto.createHash('sha512');
  shasum.update(password + salt);
  return shasum.digest("hex") + "$" + salt;
}

function generateSalt()
{
  var len = 86;
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./";
  var randomstring = '';
  for (var i = 0; i < len; i++)
  {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }
  return randomstring;
}

function compare(hashStr, password)
{
  return hash(password, hashStr.split("$")[1]) === hashStr;  
}
