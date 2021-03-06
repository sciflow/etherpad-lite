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
var http =require("http");
var path = require("path");
var url = require("url");
var child_process = require("child_process");

var async = require('async');

var api = require("../db/API");
var db = require("../db/DB").db;
var exportLatex = require("../utils/ExportLatex.js");
var exportPlainText = require("../utils/ExportPlainText.js");

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
    //this is a short link to export the most current revision
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/exports\/?$/,
      getHandler: getListOfAvailableExportFormats
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/exports\/[0-9a-zA-Z_]+\/?$/,
      getHandler: exportPad
    },
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
      putHandler: createNamedDatastore,
      deleteHandler: deleteDatastore
    },
    {
      regEx: /^pads\/(?:[0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/[0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*\/[0-9a-zA-Z_\-]+\.?[0-9a-zA-Z_\-]*\/?$/,
      getHandler: getDatastoreElement,
      putHandler: createNamedDatastoreElement,
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
  ];

  handleResult(null, req, res, result);
}

function exportPadRevision(req, res, handleResult)
{
  //we need to know, which pad, which revision and which output format
  var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/revisions\/([0-9]+)\/exports\/([0-9a-zA-Z_]+)\/?$/);

  var padId = regExpResult[1];
  var requestedRevision = parseInt(regExpResult[2]);
  var requestedExportFormat = regExpResult[3];

  async.waterfall([
    //get the revision head (exporting the head revision is less expensive than an arbitrary revision)
    function(callback)
    {
      db.getSub("pad:" + regExpResult[1], ["head"], function(err, revisionHead)
      {
        if(typeof(revisionHead) !== undefined)
          callback(null, revisionHead)
        else
          callback(['There is no revision head for that pad!', 403]);
      });
    },
    //create to directorys common to all exports
    function(revisionHead, callback)
    {
      //since there is nothing like mkdir -p we try to create the necessary directorys which will fail at worst
      var directory = path.normalize(__dirname + '/../../var/pads');

      fs.mkdir(directory, 0755, function(err)
      {
        directory += '/' + padId;
        fs.mkdir(directory, 0755, function(err)
        {
          directory += '/exports';
          fs.mkdir(directory, 0755, function(err)
          {
            directory += '/rev' + requestedRevision.toString();
            fs.mkdir(directory, 0755, function(err)
            {
              if(requestedExportFormat === 'latex' || requestedExportFormat === 'pdflatex')
              {
                //the directory will be called 'pdflatex' in both cases
                directory += '/pdflatex';
                fs.mkdir(directory, 0755, function(err)
                {
                  callback(null, revisionHead, directory);;
                });
              }
              else 
                callback(null, revisionHead, directory);
            });
          });
        });
      });
    },
    function(revisionHead, exportDirectory, callback)
    {
      if(requestedExportFormat === 'text')
      {
        res.header('Content-Type', 'text/plain; charset=utf-8');
        res.send(exportPlainText.getPadPlainText(padId, (requestedRevision === revisionHead) ? null : requestedRevision), 200);
        callback(null);
      }
      else if(requestedExportFormat === 'latex')
      {
        exportLatex.getPadLatexDocument(padId, (requestedRevision === revisionHead) ? null : requestedRevision, function(err, result)
        {
          if(typeof(err) !== 'undefined' && err !== null)
            callback(err);
          else
          {
            res.header('Content-Type', 'text/plain; charset=utf-8');
            res.send(result, 200);
            callback(null);
          }
        });
      }
      else if(requestedExportFormat === 'pdflatex')
      {
        //needs a better place (the files and this definition
        templatesBaseDirectory = path.normalize(__dirname + '/../../var/latex-templates');

        async.waterfall([
          //generate the latex source
          function(callback)
          {
            //if requested revision === head revision, leave second parameter null to speed up export
            exportLatex.getPadLatexDocument(padId, (requestedRevision === revisionHead) ? null : requestedRevision, callback);
          },
          //replace graphic urls with paths
          function(padLatex, callback)
          {
            var includegraphicsStatements = padLatex.match(/\\includegraphics\[.*\]\{.+\s*\}/g);
            var graphicsDirectory = path.normalize(exportDirectory + '/../../');

            if(includegraphicsStatements !== null)
            {
              async.forEach(includegraphicsStatements, function(statement, callback)
              {
                var graphicUrl = statement.replace(/\\includegraphics\[.*\]\{/, '').replace(/\s*\}.*$/, '');;
                
                //tha path is constructed by the graphics directory and the filename part of the url
                var graphicPath = graphicsDirectory + graphicUrl.match(/([^\/]+)$/)[1]; 
   
                //load images only if they are not present
                fs.stat(graphicPath, function(err, stats)
                {
                  //if there was somekind of an error, than we need to load the graphic
                  if(typeof(err) !== 'undefined' && err !== null)
                  {
                    child_process.spawn('curl', ['-s', '-O', graphicUrl ], { cwd : graphicsDirectory }).on('exit', function (returnCode)
                    {
                      //duplicated code !!!
                      padLatex = padLatex.replace(statement, statement.replace(/\{.*\}/, '{../../' + graphicUrl.match(/([^\/]+)$/)[1] + '}'));
                      callback(null);
                    });
                  }
                  else
                  {
                    //new replace the url with the local path in padLatex
                    padLatex = padLatex.replace(statement, statement.replace(/\{.*\}/, '{../../' + graphicUrl.match(/([^\/]+)$/)[1] + '}'));
                    callback(null);
                  }
                });
              },
              function(err)
              {
                callback(null, padLatex);
              });
            }
            else
              callback(null, padLatex);
          },
          //get pad datastores (graphics and bibliography)
          function(padLatex, callback)
          {
        
            var padMetaInformations = {};
            var padBibliography = {};

            async.parallel([
              function(callback)
              {
                //get pad metaInformations
                db.get("pad:" + padId + ":datastores:metaInformations", function(err, listOfElements)
                {
                  if(typeof(listOfElements) === 'object')
                  {
                    async.forEach(listOfElements, function(elementId, callback)
                    {
                      db.get("pad:" + padId + ":datastores:metaInformations:" + elementId, function(err, elementData)
                      {
                        padMetaInformations[elementId] = elementData;
                        callback(err);
                      });
                    },
                    function(err)
                    {
                      //if there is no template, take ieeetran
                      padMetaInformations['latex-template'] = (typeof(padMetaInformations['latex-template']) === 'undefined') ? { templateId : 'ieeetran' } : padMetaInformations['latex-template'];

                      callback(null);
                    });
                  }
                  else
                    callback(null);
                });
              },
              function(callback)
              {
                //get pad bibliography
                db.get("pad:" + padId + ":datastores:bibliography", function(err, listOfElements)
                {
                  if(typeof(listOfElements) === 'object')
                  {
                    async.forEach(listOfElements, function(elementId, callback)
                    {
                      db.get("pad:" + padId + ":datastores:bibliography:" + elementId, function(err, elementData)
                      {
                        padBibliography[elementId] = elementData;
                        callback(err);
                      });
                    },
                    function(err)
                    {
                      //if there is no template, take ieeetran
                      callback(null);
                    });
                  }
                  else
                    callback(null);
                });
              }
            ], function(err)
            {
              callback(null, padLatex, padMetaInformations, padBibliography);
            });
           
            /*
            padMetaInformations = { 'latex-template': { templateId: 'ieeetran' } };
            padBibliography = {};

            callback(null, padLatex, padMetaInformations, padBibliography);
            */
          },
          //create the bibliography file
          function(padLatex, padMetaInformations, padBibliography, callback)
          { 
            function escapeLatex(str)
            {
              var result = str;

              result = result.replace(/\n/g, '\\\\');
              result = result.replace(/_/g, '\\_');

              return result;
            }
            
            var padBibtex = '';

            //serialize bibliography to bibtex
            var biliographyEntry;

            for(bibliographyEntry in padBibliography)
            {
              var bib = padBibliography[bibliographyEntry];

              padBibtex += '@' + bib.type + '{' + bibliographyEntry + ',\n';

              padBibtex += (bib.authors !== '') ? ' author = {' + escapeLatex(bib.authors) + '},\n' : '';
              padBibtex += (bib.journal !== '') ? ' journal = {' +  escapeLatex(bib.journal) + '},\n' : '';
              padBibtex += (bib.month !== '') ? ' month = {' +  escapeLatex(bib.month) + '},\n' : '';
              padBibtex += (bib.publisher !== '') ? ' publisher = {' +  escapeLatex(bib.publisher) + '},\n' : '';
              padBibtex += (bib.title !== '') ? ' title = {' +  escapeLatex(bib.title) + '},\n' : '';
              padBibtex += (bib.url !== '') ? ' url = {' + bib.url + '},\n' : '';
              padBibtex += (bib.year !== '') ? ' year = {' +  escapeLatex(bib.year) + '},\n' : '';
              padBibtex += (bib.month !== '') ? ' month = {' + escapeLatex(bib.month) + '},\n' : '';
              padBibtex += (bib.url !== '') ? ' note = "\\url{' + bib.url + '",\n' : '';

              padBibtex += '}\n\n';
            }

            fs.writeFile(exportDirectory + '/pad.bib', padBibtex, encoding='utf8', function(err)
            {
              callback(null, padLatex, padMetaInformations);
            });
          },
          //create pad meta informations file
          function(padLatex, padMetaInformations, callback)
          {
            function escapeLatex(str)
            {
              var result = str;

              result = result.replace(/\n/g, '\\\\');
              result = result.replace(/_/g, '\\_');

              return result;
            }

            var padMeta = '';
            var padTitle = '';
            var padAbstract = '';
            var padAuthors = [];

            if(typeof(padMetaInformations === 'object'))
            {
              var metaInformationsEntry;

              for(metaInformationsEntry in padMetaInformations)
              {
                var metaInfo = padMetaInformations[metaInformationsEntry];
                
                if(typeof(metaInfo.type) === 'string')
                {
                  switch(metaInfo.type)
                  {
                    case 'Title': padTitle = metaInfo.title; break;
                    case 'Author': padAuthors.push(metaInfo); break;
                    case 'Abstract': padAbstract = metaInfo.abstract; break;
                    default: break;
                  }
                }
              }
            }
           
            //create LaTeX tags out
            padMeta += '\\usepackage{ifthen}\n';
            padMeta += '\\newcommand{\\sciflowAbstract}{' + padAbstract + '}\n';
            padMeta += '\\newcommand{\\sciflowTitle}{' + padTitle + '}\n';
            padMeta += '\\newcounter{sciflowNumberOfAuthors}\n';
            padMeta += '\\setcounter{sciflowNumberOfAuthors}{' + padAuthors.length  + '}\n';
            padMeta += '\n';

            padMeta += '\\newcommand{\\sciflowAuthor}[2]{%\n';

            for(var authorIndex = 0; authorIndex < padAuthors.length; authorIndex++)
            {
              padMeta += '\\ifnum#1=' + authorIndex  + '%\n';
              padMeta += '  \\ifthenelse{\\equal{#2}{name}}{' + ((typeof(padAuthors[authorIndex].name) === 'string') ? escapeLatex(padAuthors[authorIndex].name) : '') + '}{}%\n';
              padMeta += '  \\ifthenelse{\\equal{#2}{organization}}{' + ((typeof(padAuthors[authorIndex].organization) === 'string') ? escapeLatex(padAuthors[authorIndex].organization) : '') + '}{}%\n';
              padMeta += '  \\ifthenelse{\\equal{#2}{address}}{' + ((typeof(padAuthors[authorIndex].address) === 'string') ? escapeLatex(padAuthors[authorIndex].address) : '') + '}{}%\n';
              padMeta += '  \\ifthenelse{\\equal{#2}{email}}{' + ((typeof(padAuthors[authorIndex].email) === 'string') ? escapeLatex(padAuthors[authorIndex].email) : '') + '}{}%\n';
              padMeta += '  \\ifthenelse{\\equal{#2}{telefon}}{' + ((typeof(padAuthors[authorIndex].telefon) === 'string') ? escapeLatex(padAuthors[authorIndex].telefon) : '') + '}{}%\n';
              padMeta += '  \\ifthenelse{\\equal{#2}{position}}{' + ((typeof(padAuthors[authorIndex].position) === 'string') ? escapeLatex(padAuthors[authorIndex].position) : '') + '}{}%\n';
              padMeta += '\\fi%\n';
            }

            padMeta += '}\n';

            //write
            fs.writeFile(exportDirectory + '/pad.metaInformations.tex', padMeta, encoding='utf8', function(err)
            {
              callback(null, padLatex, padMetaInformations);
            });

/*
          //create the authors file
          function(padLatex, padMetaInformations, padBibliography, callback)
          {
            var padAuthors = '';

            //serialize bibliography to bibtex
            var authorsEntry;

            for(authorsEntry in padBibliography)
            {
              var bib = padBibliography[bibliographyEntry];

              padBibtex += '@' + bib.type + '{' + bibliographyEntry + ',\n';

              padBibtex += (bib.authors !== '') ? '  author  = {' + bib.authors + '},\n' : '';
              padBibtex += (bib.title !== '') ? '  title  = {' + bib.title + '},\n' : '';
              padBibtex += (bib.year !== '') ? '  year  = {' + bib.year + '},\n' : '';

              padBibtex += '}\n\n';
            }

            fs.writeFile(exportDirectory + '/pad.bib', padBibtex, encoding='utf8', function(err)
            {
              callback(null, padLatex, padMetaInformations);
            });

            //callback(null, padLatex, padMetaInformations);
*/
          },
          //write the latex source to a file
          function(padLatex, padMetaInformations, callback)
          {
            fs.writeFile(exportDirectory + '/pad.tex', padLatex, encoding='utf8', function(err)
            {
              callback(null, padMetaInformations);
            });
          },
          //symlink the template files into the export directory
          function(padMetaInformations, callback)
          {
            //handle the case where there is no templateId set yet
            if(typeof(padMetaInformations['latex-template']) === 'undefined' || padMetaInformations['latex-template'] === null)
              padMetaInformations['latex-template'] = {};

            if(typeof(padMetaInformations['latex-template'].templateId) === 'undefined' || padMetaInformations['latex-template'].templateId === null)
              padMetaInformations['latex-template'].templateId = 'ieeetran';

            fs.readdir(templatesBaseDirectory + '/' + padMetaInformations['latex-template'].templateId, function(err, files)
            {
              async.forEach(files, function(filename, callback)
              {
                var linkTarget = templatesBaseDirectory + '/' + padMetaInformations['latex-template'].templateId + '/' + filename;
                var linkPath = exportDirectory + '/' + filename;

                fs.symlink(linkTarget, linkPath,  function(err)
                {
                  callback(null);
                });
              },
              function(err)
              {
                callback(err, padMetaInformations);
              });
            });
          },
          //check if pdfile already exists
          function(padMetaInformations, callback)
          {
            var pdfFilePath = exportDirectory + '/' + padMetaInformations['latex-template'].templateId + '.pdf';

            //check if this pdf was already created
            fs.stat(pdfFilePath, function(err, stats)
            {
              var compilationNeeded = false;

              //if there was somekind of an error, than we need to compile
              if(typeof(err) !== 'undefined' && err !== null)
               compilationNeeded = true;
             
              //always compile pdf
              compilationNeeded = true;

              callback(null, padMetaInformations, compilationNeeded)
            });
          },
          //compile the latex source to pdf (if there is no pdf already to deliver)
          function(padMetaInformations, compilationNeeded, callback)
          {
            var latexFileName = padMetaInformations['latex-template'].templateId + '.tex';
            var pdflatexParameters = ['-no-file-line-error', '-interaction=batchmode', latexFileName];
            var bibtexParameters = [ padMetaInformations['latex-template'].templateId ];

            if(compilationNeeded)
            {
              async.series([
                //first run
                function(callback)
                {
                  child_process.spawn('pdflatex', ['-draftmode'].concat(pdflatexParameters), { cwd : exportDirectory }).on('exit', function(returnCode)
                  {
                    callback(null)
                  });
                },
                //bibtex run
                function(callback)
                {
                  child_process.spawn('bibtex', bibtexParameters, { cwd : exportDirectory }).on('exit', function(returnCode)
                  {
                    callback(null)
                  });
                },
                //second run
                function(callback)
                {
                  child_process.spawn('pdflatex', ['-draftmode'].concat(pdflatexParameters), { cwd : exportDirectory }).on('exit', function(returnCode)
                  {
                    callback(null)
                  });
                },
                //third run (not in draftmode)
                function(callback)
                {
                  child_process.spawn('pdflatex', pdflatexParameters, { cwd : exportDirectory }).on('exit', function(returnCode)
                  {
                    callback(null);
                  });
                },
              ],
              function(err)
              {
                callback(null, padMetaInformations);
              });
            }
            else
              callback(null, padMetaInformations)
          },
          //deliver the pdf file
          function(padMetaInformations, callback)
          {
            var pdfFilePath = exportDirectory + '/' + padMetaInformations['latex-template'].templateId + '.pdf';

            res.header('Pragma', 'no-cache');
            res.header('Cache-Control', 'no-cache');
            
            res.contentType('application/pdf');
            res.sendfile(pdfFilePath);
            callback(null);
          }
        ],
        function(err)
        {
          callback(err);
        });
      }
      else
      {
        callback('error');
      }
    }
  ],
  function(err)
  {
    if(typeof(err) !== 'undefined' && err !== null)
      res.send('An errror has occured while trying to do the export.\n', 500);
  });
}

function exportPad(req, res, handleResult)
{
  //we need to know, which pad, which revision and which output format
  var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/exports\/([0-9a-zA-Z_]+)\/?$/);

  var padId = regExpResult[1];
  var exportFormat = regExpResult[2];

  //redirect to the export of the latex revision
  db.getSub("pad:" + regExpResult[1], ["head"], function(err, headRevision)
  {
    res.redirect('/api/2/pads/' + padId + '/revisions/' + headRevision.toString() + '/exports/' + exportFormat);
  });
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

//does the real work, can be called by other api handler functions to
function _createDatastore(padId, datastoreId, callback)
{
  //check if a datastore with the given (or computed) datastoreId already exists
  db.get("pad:" + padId + ":datastores:" + datastoreId, function(err, result)
  {
    //if the result is not undefined, than there is already such a datastore
    if(typeof(result) !== 'undefined')
    {
      callback('Datastore already exists!');
    }
    else
    {
      //update the datastores list of that pad (no need for async here, this and the next db.set can be executed parallel)
      db.get("pad:" + padId + ":datastores", function(err, listOfDatastores)
      {
        //if there are no datastores for that pad yet, initialize the according array
        if(typeof(listOfDatastores) !== 'object')
        {
          db.set("pad:" + padId + ":datastores", [ datastoreId ]);
        }
        //if there are already datastores for that pad, add the given datastoreId to the existing ones
        else
        {
          //This should never happen, but for the sake of safety
          if(listOfDatastores.indexOf(datastoreId) !== -1)
          {
            callback('This datastore identifier is already already used.');
          }
          else
          {
            listOfDatastores.push(datastoreId);
          }

          //store the updated list of datastores in the db
          db.set("pad:" + padId + ":datastores", listOfDatastores);
        }
      });

      //initialize the new datastores element list
      db.set("pad:" + padId + ":datastores:" + datastoreId, []);
    }

    //everything went fine, so let's call the callback
    callback(null);
  });
}

function createDatastore(req, res, handleResult)
{
  //we save the result of the regEx match so we dont't have to do this more than once
  var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/?$/);

  //the padId should be the first match result
  var padId = regExpResult[1];

  //this is a POST to datastores, so we create a datastoreId on our own and return that id in the end
  var datastoreId = 'd.' + randomString(16);

  //create the datastore
  _createDatastore(padId, datastoreId, function(err)
  {
    //the results of that api call should not be cached by the client
    res.header('Pragma', 'no-cache');
    res.header('Cache-Control', 'no-cache');

    if(err === null)
      handleResult(null, req, res, datastoreId);
    else
      res.send(500);
  });
}

function createNamedDatastore(req, res, handleResult)
{
  //we save the result of the regEx match so we dont't have to do this more than once
  var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/?$/);

  //the padId should be the first match result
  var padId = regExpResult[1];

  //this is a PUT to a named datastore, so the datastoreId is given by the url
  var datastoreId = regExpResult[2];

  //create the datastore
  _createDatastore(padId, datastoreId, function(err)
  {
    //the results of that api call should not be cached by the client
    res.header('Pragma', 'no-cache');
    res.header('Cache-Control', 'no-cache');

    if(err === null)
      handleResult(null, req, res, datastoreId);
    else
      res.send(500);
  });
}

function deleteDatastores(req, res, handleResult)
{
  res.send(501);
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

/* REMOVEME
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
*/

function deleteDatastore(req, res, handleResult)
{
  res.send(501);
}

function getDatastoreElement(req, res, handleResult)
{
  var regExpResult;

  //which pad, which datastore and which element we need to grab ?
  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/([0-9a-zA-Z_\-]+\.?[0-9a-zA-Z_\-]*)\/?$/))
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

/**
 * Creates a datastore element. Replaces the element, if it already exists.
 */
function _createDatastoreElement(padId, datastoreId, elementId, elementData, callback)
{
  async.parallel([
    //put the object in the datastore
    function(callback)
    {
      db.set("pad:" + padId + ":datastores:" + datastoreId + ":" + elementId, elementData, callback);
    },
    //update the list of elements for the given datastore
    function(callback)
    {
      db.get('pad:' + padId + ':datastores:' + datastoreId, function(err, listOfElements)
      {
        //if something went wrong, call the async.parallel callback immediately
        if(typeof(err) !== 'undefined' && err !== null)
          callback(err);

        //if we got a result, check if there is an element with that id already in the datastore 
        if(typeof(listOfElements) === 'object')
        {
          //this should be an array, so we can use indexOf to search for an element
          if(listOfElements.indexOf(elementId) > -1)
          {
            //there is an element with the same id, so we don't need to update anything (e.g. replace)
            callback(null);
          }
          else
          {
            //there is no element with that id present, so we need to update the list of elements
            listOfElements.push(elementId);

            db.set('pad:' + padId + ':datastores:' + datastoreId, listOfElements, callback);
          }
        }
        //if the result is undefined, there is no datastore at all, so we need to create it 
        else
        {
          _createDatastore(padId, datastoreId, function(err)
          {
            //if there was an error, call the callback
            if(typeof(err) !== 'undefined' && err !== null)
              callback(err);
            //else store the initial list of elements
            else
              db.set('pad:' + padId + ':datastores:' + datastoreId, [ elementId ], callback);
          });
        }
      });
    }
  ],
  function(err)
  {
    //finally call the main callback
    callback(err);
  });
}

function createDatastoreElement(req, res, handleResult)
{
  //we save the result of the regEx match so we dont't have to do this more than once
  var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/?$/);

  //the padId should be the first match result, the datastoreId the second
  var padId = regExpResult[1];
  var datastoreId = regExpResult[2];

  //the elementId has to be generated, since it is not given
  var elementId = 'e.' + randomString(16);

  //the element data is the request body
  var elementData = req.body;

  //create or replace the given element
  _createDatastoreElement(padId, datastoreId, elementId, elementData, function(err)
  {
    //the results of that api call should not be cached by the client
    res.header('Pragma', 'no-cache');
    res.header('Cache-Control', 'no-cache');

    if(typeof(err) !== 'undefined' && err  !== null)
      res.send(500);
    else
    {
      res.contentType('application/json');
      res.send(JSON.stringify(elementId));
    }
  });
}

function createNamedDatastoreElement(req, res, handleResult)
{
  //TODO: Merge this with createDatastoreElement (just needs a switch based on the regExResult

  //we save the result of the regEx match so we dont't have to do this more than once
  var regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/([0-9a-zA-Z_\-]+\.?[0-9a-zA-Z_\-]*)\/?$/);

  //the padId should be the first match result, the datastoreId the second aso.
  var padId = regExpResult[1];
  var datastoreId = regExpResult[2];
  var elementId = regExpResult[3];

  //the element data is the request body
  var elementData = req.body;

  //create or replace the given element
  _createDatastoreElement(padId, datastoreId, elementId, elementData, function(err)
  {
    //the results of that api call should not be cached by the client
    res.header('Pragma', 'no-cache');
    res.header('Cache-Control', 'no-cache');

    if(typeof(err) !== 'undefined' && err  !== null)
      res.send(500);
    else
      res.send(200);
  });
}

function deleteDatastoreElement(req, res, handleResult)
{
  var regExpResult;

  if(regExpResult = req.params[0].match(/^pads\/([0-9a-zA-Z]{10}|g.[0-9a-zA-Z]{16}\$[0-9a-zA-Z]+)\/datastores\/([0-9a-zA-Z_]+\.?[0-9a-zA-Z_]*)\/([0-9a-zA-Z_\-]+\.?[0-9a-zA-Z_\-]*)\/?$/))
  {
    //get the element list for that datastore
    db.get("pad:" + regExpResult[1] + ":datastores:" + regExpResult[2], function(err, result)
    {
      //if there exists such an element in that datastore, 
      if(typeof(result) === 'object' && result.indexOf(regExpResult[3]) !== -1)
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
