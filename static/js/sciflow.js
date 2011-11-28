//create global sciflow object which holds references to sciflow functions
var sciflow = {};

$(document).ready(function()
{

////////////////////
// Default values  //
/////////////////////

sciflow.apiPath = '/api/2';

//////////////////////
// helper functions //
//////////////////////

sciflow.getPadId = function()
{
  //do regex match to extract to padId from the url
  var regExpResult = location.href.match(/p\/([0-9a-zA-Z_]+)$/);

  if(typeof(regExpResult) === 'object' && typeof(regExpResult[1]) !== 'undefined')
    return padId = regExpResult[1];
}

sciflow.isJQueryObject = function(value)
{
  if(typeof(value) !== 'undefined')
  {
    return (value instanceof(jQuery));
  }
  else
    return false;
}

sciflow.isEmptyJQueryResult = function(value)
{
  if(typeof(value) !== 'undefined')
  {
    if(sciflow.isJQueryObject(value))
      return (value.size() === 0);
  }
  else
    return false;
}

sciflow.getSelectedElementsFromWidget = function(widget)
{
  if(sciflow.isJQueryObject(widget) === false)
    return;

  return(widget.find(li.ui-selected));
}

//if passed a string larger then length, create something like "Here comes a long ..."
sciflow.getFixedSizeString = function(givenString, requestedLength)
{
  if(typeof(givenString) === 'string' && typeof(requestedLength) === 'number')
    return (givenString.length > requestedLength) ? givenString.substr(0, requestedLength - 4) + ' ...' : givenString;
}

//logging (when there is time, replace by log4js
sciflow.log = function(loglevel, message)
{
  console.log('[' + loglevel + '] ' + message);
}

//////////////////////////
// datastore operations //
//////////////////////////

//adds an element to a datastore (elementId and callback are optional), returns the elementId of the added element
sciflow.addElementToDatastore = function(datastoreId, elementData, elementId, callback)
{
  var ajaxResult;

  function successHandler(data, textStatus, jqXHR)
  {
    ajaxResult = data;
  }

  function completeHandler(jqXHR, textStatus)
  {
    if(typeof(ajaxResult) === 'undefined')
      ajaxResult = (textStatus === 'OK') ? elementId : textStatus; 

    if(typeof(callback) === 'function')
      callback(ajaxResult);
  }

  //normalize elementId handling for null/undefined
  if(elementId === null)
    elementId = undefined;

  //if the caller passes a callback but no elementId
  if(typeof(callback) === 'undefined' && typeof(elementId) === 'function')
    callback = elementId;

  var nonDefaultAjaxSettings = {};

  //if there is a callback, make the ajax call asynchronous
  if(typeof(callback) === 'function')
  {
    $.extend(nonDefaultAjaxSettings, {
      async: true
    });
  }

  //if there is an elementId make the call a PUT
  if(typeof(elementId) === 'string')
  {
    $.extend(nonDefaultAjaxSettings, {
      url: sciflow.apiPath + '/pads/' + sciflow.getPadId() + '/datastores/' + datastoreId + '/' + elementId,
      type: 'PUT',
      dataType: null //since the response is empty even on success (just HTTP 200) we need to disable dataType to avoid 'parsererror'
    });
  }
    
  $.ajax($.extend({
    url : sciflow.apiPath + '/pads/' + sciflow.getPadId() + '/datastores/' + datastoreId,
    type : 'POST',
    contentType : 'application/json',
    dataType: 'json',
    data : JSON.stringify(elementData),
    processData: false,
    async : false,
    success: successHandler,
    complete: completeHandler
  }, nonDefaultAjaxSettings));

  //if no callback was given, return the result
  if(typeof(callback) !== 'function')
    return ajaxResult;
}

//gets an element from a datastore (elementId and callback are optional)
sciflow.getElementFromDatastore = function(datastoreId, elementId, callback)
{
  var ajaxResult;

  function successHandler(data, textStatus, jqXHR)
  {
    ajaxResult = data;
  }

  function completeHandler(jqXHR, textStatus)
  {
    if(typeof(callback) === 'function')
      callback(ajaxResult);
  }

  //normalize elementId handling for null/undefined
  if(elementId === null)
    elementId = undefined;

  //if the caller passes a callback but no elementId
  if(typeof(callback) === 'undefined' && typeof(elementId) === 'function')
    callback = elementId;

  var nonDefaultAjaxSettings = {};

  //if no elementId was given, make a GET to the datastore to retrieve a list of elements in that datastore
  if(typeof(elementId) !== 'string')
  {
    $.extend(nonDefaultAjaxSettings, {
      url: sciflow.apiPath + '/pads/' + sciflow.getPadId() + '/datastores/' + datastoreId,
    });
  }

  //if there is a callback, make the ajax call asynchronous
  if(typeof(callback) === 'function')
  {
    $.extend(nonDefaultAjaxSettings, {
      async: true
    });
  }

  //issue the datastore request
  $.ajax($.extend({
    url : sciflow.apiPath + '/pads/' + sciflow.getPadId() + '/datastores/' + datastoreId + '/' + elementId,
    type : 'GET',
    dataType: 'json',
    async: false,
    success: successHandler,
    complete: completeHandler
  }, nonDefaultAjaxSettings));

  //if no callback was given, return the result
  if(typeof(callback) !== 'function')
    return ajaxResult;
}

sciflow.getListOfDatastoreElements = function(datastoreId, callback)
{
  return sciflow.getElementFromDatastore(datastoreId, callback);
}

//remove element from datastore (elementId and callback are optional)
sciflow.deleteElementFromDatastore = function(datastoreId, elementId, callback)
{
  var ajaxResult;

  function successHandler(data, textStatus, jqXHR)
  {
    ajaxResult = data;
  }

  function completeHandler(jqXHR, textStatus)
  {
    if(typeof(ajaxResult) === 'undefined')
      ajaxResult = textStatus;

    if(typeof(callback) === 'function')
      callback(ajaxResult);
  }

  //normalize elementId handling for null/undefined
  if(elementId === null)
    elementId = undefined;

  //if the caller passes a callback but no elementId
  if(typeof(callback) === 'undefined' && typeof(elementId) === 'function')
    callback = elementId;

  var nonDefaultAjaxSettings = {};

  //if no elementId was given, delete the whole datastore
  if(typeof(elementId) !== 'string')
  {
    $.extend(nonDefaultAjaxSettings, {
      url: sciflow.apiPath + '/pads/' + sciflow.getPadId() + '/datastores/' + datastoreId,
    });
  }

  //if there is a callback, make the ajax call asynchronous
  if(typeof(callback) === 'function')
  {
    $.extend(nonDefaultAjaxSettings, {
      async: true
    });
  }
  
  //try to delete the item using delete api calls
  $.ajax($.extend({
    url : sciflow.apiPath + '/pads/' + sciflow.getPadId() + '/datastores/' + datastoreId + '/' + elementId,
    type : 'DELETE',
    async: false,
    success: successHandler,
    complete: completeHandler
  }, nonDefaultAjaxSettings));

  //if no callback was given, return the result
  if(typeof(callback) !== 'function')
    return ajaxResult;
} 

//
// High level datastore access
//

//adds an element to the widget and the datastore 
sciflow.addElement = function(datastoreId, elementData, elementId, widget, listItemHtmlGenerator, callback)
{
  //if this is a replacing add (due to a change), we need to update the widget element (not add another one)
  var isReplacingAdd = (typeof(elementId) === 'string');

  //normalize elementId handling for null/undefined
  if(elementId === null)
    elementId = undefined;

  async.series([
    //add the given element to the datastore
    function(callback)
    {
      sciflow.addElementToDatastore(datastoreId, elementData, elementId, function(requestResult)
      {
        if(typeof(requestResult) === 'undefined')
          callback(['error', 'Non valid datastore request result in sciflow.addElement']);
        else
        {
          //per definition is the result of a successfull datastore add without a given elementId a new elementId
          if(typeof(elementId) === 'undefined')
            elementId = requestResult;

          callback(null);
        }
      });
    },
    //add element to the widget (only if element was successfully added to the datastore)
    function(callback)
    {
      //if we replace a existing element, delete that element prior to putting the new one in
      if(isReplacingAdd)
        sciflow.deleteElementFromWidget(widget, elementId);

      sciflow.addElementToWidget(widget, elementData, elementId, listItemHtmlGenerator);
      callback(null);
    }
  ],function(err, results)
  {
    if(err)
      sciflow.log(err[0], err[1]);

    if(typeof(callback) === 'function')
      callback();
  });
}

//wrapper to sciflow.deleteElement to allow multiple elements to be deleted at once
sciflow.deleteElements = function(datastoreId, listOfElements, widget, callback)
{
  async.forEach(listOfElements, function(elementId, callback)
  {
    sciflow.deleteElement(datastoreId, elementId, widget, function()
    {
      callback(null);
    });
  }, function(err)
  {
    callback();
  });
}

//delets an element identified by its elementId from the datastore and the widget
sciflow.deleteElement = function(datastoreId, elementId, widget, callback)
{
  async.series([
    //remove the element from the datastore
    function(callback)
    {
      sciflow.deleteElementFromDatastore(datastoreId, elementId, function()
      {
        callback(null);
      });
    },
    //remove the element from the widget
    function(callback)
    {
      sciflow.deleteElementFromWidget(widget, elementId);
      callback(null);
    }
  ], function(err)
  {
    callback();
  });
}

////////////////
// General UI //
////////////////

$.extend(sciflow, { ui : {} } );
$.extend(sciflow.ui, { dialogs : {} } );
$.extend(sciflow.ui.dialogs, { dialogDefaults : {} } );

$.extend(sciflow.ui.dialogs.dialogDefaults, {
  autoOpen: false,
  modal: true,
  width: 400,
  buttons: {
    Cancel: function()
    {
      $(this).dialog('close');
    }
  }
});

sciflow.ui.dialogs.deletionConfirmationDialogTemplate = $('\
  <div>\
    <p>\
      Do you realy want to remove this element ?\
    </p>\
  </div>\
');

//updates the widget and the datastore
sciflow.addElementToWidget = function(widget, elementData, elementId, listItemHtmlGenerator)
{
  widget.find('ol, ul').append(listItemHtmlGenerator(elementData, elementId, 20));
}

sciflow.deleteElementFromWidget = function(widget, elementId)
{
  widget.find('#' + elementId.replace(/\./, '\\.')).remove();  
}

//gets a list of elements for the given datastore and initializes the widget with that list
sciflow.initializeWidgetFromDatastore = function(datastoreId, widget, listItemHtmlGenerator)
{
  //retrieve the list of elements for that datastore
  sciflow.getListOfDatastoreElements(datastoreId, function(listOfElements)
  {
    if(typeof(listOfElements) === 'object')
    {
      async.forEach(listOfElements, function(elementId, callback)
      {
        sciflow.getElementFromDatastore(datastoreId, elementId, function(elementData)
        {
          listOfElements[listOfElements.indexOf(elementId)] = { elementId: elementId, elementData: elementData };
          callback(null);
        });
      },
      function(err)
      {
        listOfElements.forEach(function(item)
        {
          sciflow.addElementToWidget(sciflow.metaInformations.widget, item['elementData'], item['elementId'], sciflow.metaInformations.listItemHtmlGenerator);
        });
      });
    }
    else
    {
      sciflow.log('warn', 'There is no ' + datastoreId + ' datastore for that pad.');
    }
  });
}

sciflow.initializeAllWidgetsFromDatastore = function()
{
  sciflow.metaInformations.initializeWidgetFromDatastore();
}

sciflow.serializeDialogContent = function(dialog, clearFieldsAfterSerialization)
{
  if(typeof(clearFieldsAfterSerialization) !== 'boolean')
    clearFieldsAfterSerialization = true;
 
  var dialogContent = {};

  dialog.find('fieldset').find('input, textarea').parent().add(dialog.find('fieldset').find('select').parent()).each(function(index, element)
  {
    //we only want to serialize visiable elements
    if($(element).css('display') !== 'none')
    {
      //serialize all input, textarea and select fields
      $(element).find('input, textarea, select').each(function (index, element)
      {
        dialogContent[$(element).attr('name')] = $(element).val();

        //clear to dialog fields after serialization (except for selects)
        if(clearFieldsAfterSerialization)
          if(! $(element).is('select'))
             $(element).val('');
      });
    }
  });

  return dialogContent;
}

sciflow.loadDialogContent = function(dialog, dialogContent)
{
  var item;

  for(item in dialogContent)
  {
    var dialogElement = dialog.find('[name=' + item + ']').val(dialogContent[item]);
    
    if(dialogElement.is('select'))
      dialogElement.selectmenu('value', dialogContent[item]);
  }

}

////////////////////////////////
// metaInformations component //
////////////////////////////////

//add sciflow.metaInformations
$.extend(sciflow, { metaInformations: {}});

//
// ui
//

//get the main widget
sciflow.metaInformations.widget = $('#sciflow-metaInformations-widget');

//handle ui requests
sciflow.metaInformations.handleUserInterfaceEvent = {
  add: function()
  {
    sciflow.ui.dialogs.addMetaInformation.dialog('open')
  },
  change: function(elementId)
  {
    //if there is no elementId given, take the first selected element in the widget
    if(typeof(elementId) !== 'string')
      var elementId = sciflow.metaInformations.widget.find('.ui-selected').first().attr('id');

    //if elementId is still undefined (because there was no element selected) return
    if(typeof(elementId) !== 'string')
      return;

    sciflow.getElementFromDatastore('metaInformations', elementId, function(elementData)
    {
      //we need to put the elementId into the dialog content in order to know, which element to change later
      elementData.elementId = elementId;
      
      //in order to adapt the dialog to the type of meta info
      var typeOfMetaInformation = elementData.type.toLowerCase();
      typeOfMetaInformation = (typeOfMetaInformation === 'general terms') ? 'generalTerms' : typeOfMetaInformation;

      sciflow.loadDialogContent(sciflow.ui.dialogs.changeMetaInformation, elementData);

      sciflow.ui.dialogs.changeMetaInformation.find('#author, #categories, #generalTerms, #keywords, #subtitle, #title').not('#' + typeOfMetaInformation).hide();
      sciflow.ui.dialogs.changeMetaInformation.find('#' + typeOfMetaInformation).show();

      sciflow.ui.dialogs.changeMetaInformation.dialog('open');
    });
  },
  delete: function()
  {
    sciflow.ui.dialogs.deleteMetaInformation.dialog('open');
  }
}

//html template for the add/change meta information dialog
sciflow.ui.dialogs.metaInformationsDialogTemplate = '\
  <div>\
    <fieldset>\
      <div>\
        <input type="hidden" name="elementId" value="" />\
      </div>\
      <div>\
        <label for="type">Type of meta information</label>\
        <select name="type">\
          <option>Author</option>\
          <option>Categories</option>\
          <option>General Terms</option>\
          <option>Keywords</option>\
          <option>Subtitle</option>\
          <option>Title</option>\
        </select>\
      </div>\
      <div id="author">\
        <label for="name">Name</label>\
        <input type="text" name="name" class="text ui-widget-content ui-corner-all" />\
        <label for="position">Position</label>\
        <input type="text" name="position" class="text ui-widget-content ui-corner-all" />\
        <label for="organization">Organization</label>\
        <input type="text" name="organization" class="text ui-widget-content ui-corner-all" />\
        <label for="telephone">Telephone</label>\
        <input type="text" name="telephone" class="text ui-widget-content ui-corner-all" />\
        <label for="email">Email</label>\
        <input type="text" name="email" class="text ui-widget-content ui-corner-all" />\
        <label for="adress">Adress</label>\
        <textarea id="adress" name="adress" class="text ui-widget-content ui-corner-all" />\
      </div>\
      <div id="categories" style="display: none">\
        <label for="categories">Categories</label>\
        <input type="text" name="categories" class="text ui-widget-content ui-corner-all" />\
      </div>\
      <div id="generalTerms" style="display: none">\
        <label for="generalTerms">General Terms</label>\
        <input type="text" name="generalTerms" class="text ui-widget-content ui-corner-all" />\
      </div>\
      <div id="keywords" style="display: none">\
        <label for="keywords">Keywords</label>\
        <input type="text" name="keywords" class="text ui-widget-content ui-corner-all" />\
      </div>\
      <div id="subtitle" style="display: none">\
        <label for="subtitle">Subtitle</label>\
        <input type="text" name="subtitle" class="text ui-widget-content ui-corner-all" />\
      </div>\
      <div id="title" style="display: none">\
        <label for="title">Title</label>\
        <input type="text" name="title" class="text ui-widget-content ui-corner-all" />\
      </div>\
      </fieldset>\
  </div>\
';

//create the add meta information dialog
sciflow.ui.dialogs.addMetaInformation = $(sciflow.ui.dialogs.metaInformationsDialogTemplate).dialog(
  $.extend(true,
  {
    title: 'Add meta information',
    buttons:
    {
      Add: function()
      {
        var thisDialog = $(this);

        //dont clear the dialog as long as there is the posibility for a conflicting title, subtitle, etc.
        var dialogContent = sciflow.serializeDialogContent(thisDialog, false);

        //some elements are only allowed once, so we have to check if such an element is already in the list
        var typeOfMetaInformation;;

        for(restrictedTypeOfMetaInformation in { Title: 1, Subtitle: 1, Abstract: 1 })
        {
          if(dialogContent.type === restrictedTypeOfMetaInformation)
          {
            var searchResult = sciflow.metaInformations.widget.find('li:contains(' + typeOfMetaInformation + ')');
            if(! sciflow.isEmptyJQueryResult(searchResult))
            {
              alert('There is already a ' + typeOfMetaInformation.toLowerCase() + '. Please use the modify button or the delete button.');
              thisDialog.dialog('close');
              return;
            }
          }
        }

        var dialogContent = sciflow.serializeDialogContent(thisDialog);

        //remove the elementId entry
        dialogContent.elementId = undefined;

        sciflow.addElement('metaInformations', dialogContent, null, sciflow.metaInformations.widget, sciflow.metaInformations.listItemHtmlGenerator, function()
        {
          thisDialog.dialog('close');
        });
      },
    }
  }, sciflow.ui.dialogs.dialogDefaults)
);

//create the change meta information dialog
sciflow.ui.dialogs.changeMetaInformation = $(sciflow.ui.dialogs.metaInformationsDialogTemplate).dialog(
  $.extend(true,
  {
    title: 'Change meta information',
    buttons:
    {
      Change: function()
      {
        var thisDialog = $(this);

        //we need to extract the elementId for the "named" add
        var dialogContent = sciflow.serializeDialogContent(thisDialog);
        var elementId = dialogContent.elementId;

        //remove the elementId entry
        dialogContent.elementId = undefined;

        //know use a "named" add (elementId set) to replace the datastore element with that id with the new data
        sciflow.addElement('metaInformations', dialogContent, elementId, sciflow.metaInformations.widget, sciflow.metaInformations.listItemHtmlGenerator, function()
        {
          thisDialog.dialog('close');
        });
      },
    }
  }, sciflow.ui.dialogs.dialogDefaults)
);

$.each([sciflow.ui.dialogs.addMetaInformation, sciflow.ui.dialogs.changeMetaInformation], function(index, dialog)
{
  dialog.find('select').selectmenu(
  {
    width: '150px',
    select: function(e, obj)
    {
      //some converting to match the select values and the div names
      obj.value = obj.value.toLowerCase();
      obj.value = (obj.value === 'general terms') ? 'generalTerms' : obj.value;

      $(this).parent().parent().find('#author, #categories, #generalTerms, #keywords, #subtitle, #title').not('#' + obj.value).hide();
      $(this).parent().parent().find('#' + obj.value).show();
    }
  });

});

//create the deleteMetaInformation dialog
sciflow.ui.dialogs.deleteMetaInformation = $(sciflow.ui.dialogs.deletionConfirmationDialogTemplate).dialog(
  $.extend(true,
  {
    title: 'Delete meta information',
    buttons:
    {
      Delete: function()
      {
        var thisDialog = $(this);

        //get the selected items
        var listOfElements = [];
        
        sciflow.metaInformations.widget.find('.ui-selected').each(function(index, element)
        {
          listOfElements[index] = $(element).attr('id');
        });

        sciflow.deleteElements('metaInformations', listOfElements, sciflow.metaInformations.widget, function()
        {
          thisDialog.dialog('close');
        });
      },
    }
  }, sciflow.ui.dialogs.dialogDefaults)
);

//
// component logic
//

//shortcut to initialize the meta informations widget
sciflow.metaInformations.initializeWidgetFromDatastore = function()
{
  sciflow.initializeWidgetFromDatastore('metaInformations', sciflow.metaInformations.widget, sciflow.metaInformations.listItemHtmlGenerator);
}

//creates the html of an li element of the meta informations list (part of the meta informations widget)
sciflow.metaInformations.listItemHtmlGenerator = function(elementData, elementId, elementDescriptorMaxLength)
{
  var elementDescriptor;

  switch(elementData.type)
  {
    case "Author": elementDescriptor = 'Author (' + sciflow.getFixedSizeString(elementData.name, elementDescriptorMaxLength) + ')'; break;
    case "Title": elementDescriptor = 'Title (' + sciflow.getFixedSizeString(elementData.title, elementDescriptorMaxLength) + ')'; break;
    case "Subtitle": elementDescriptor = 'Subtitle (' + sciflow.getFixedSizeString(elementData.subtitle, elementDescriptorMaxLength) + ')'; break;
    case "Keywords": elementDescriptor = 'Keywords (' + sciflow.getFixedSizeString(elementData.keywords, elementDescriptorMaxLength) + ')'; break;
    case "Categories": elementDescriptor = 'Categories (' + sciflow.getFixedSizeString(elementData.categories, elementDescriptorMaxLength) + ')'; break;
    case "General Terms": elementDescriptor = 'General Terms (' + sciflow.getFixedSizeString(elementData.generalTerms, elementDescriptorMaxLength) + ')'; break;
    default: elementDescriptor = 'Unknown type of metaInformation'; break;
  }

  //if the element was successfully added, update the widget
  return('<li id="' + elementId + '" style="border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; " class="ui-widget-content ui-selectee">' + elementDescriptor + '</li>');
}

sciflow.initializeAllWidgetsFromDatastore();

//
// old code
//

//call updateUiWidgets the first time when the document is ready (will be call by setInterval later on)

//create the heading selector select menu
  $(function() {
    $('#headingSelector').selectmenu({
      width: '150px',
      select: function(e, selectmenuData)
      {
        var hookMethodeName = 'handleCommand';
        var hookMethodeParameters =
        {
          name: 'changeHeading',
          parameters:
          {
            headingType: selectmenuData.value
          }
        };

        plugins.callHook(hookMethodeName, hookMethodeParameters);
      }
    });

    $('#headingSelector-button').css({
      'position' : 'absolute',
      'left' : '370px',
      'z-index' : '1'
    });
  });

  //create to accordion on the right side
  $(function() {
    $( "#accordion" ).accordion({
      fillSpace: true
    });
  });

  //set the window resize handler to resize also the accordion
  $(function() {
    $(window).resize(function() {
      $('#accordion').accordion('resize');
    });
  });

  //create the latex template selctmenu
  $(function() {
    $('#templateSelector').selectmenu({
      width: '120px',
      change: function(e, selectmenuData)
      {
        var templateId;
        var padId = location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1];

        switch(selectmenuData.value)
        {
          case "IEEEtran" : templateId = 'ieeetran'; break;
          case "Springer (llncs)" : templateId = 'springer-llncs'; break;
          case "Springer (svmult)" : templateId = 'springer-svmult'; break;
        }

        if(typeof(templateId) !== 'undefined')
        {
          $.ajax({
            url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/metaInformations/latex-template',
            type : 'PUT',
            dataType: 'json',
            async : false,
            processData: false,
            contentType : 'application/json',
            data : JSON.stringify({
              metaInfoType: 'latex-template',
              templateId: templateId
            })
          });
        }
      }
      //change:  selectmenuChangeHandler
    });



    //somekind of a hack to get the menu where and how
    $('#templateSelector' + '-button').css({
      'font-size': '80%',
      'position' : 'absolute',
      'right' : '0px',
      'bottom' : '0px'
    });
    $('#templateSelector' + '-menu').css('font-size', '90%');
  });

  //create the selectable metaInformations list inside the accordion
  $(function() {
    $( "#metaInformationsList" ).selectable();
  });

  //create the selectable bibliography list inside the accordion
  $(function() {
    $( "#bibliographyList" ).selectable();
  });

  //create the selectable graphics list inside the accordion
  $(function() {
    $( "#graphicsList" ).selectable();
  });

  $(function() {
    $( "#graphicsList a.ui-icon-zoomin" ).click(function( event ) {
      var $target = $(event.target);

      $('<div><img src=' + $target.attr('href') + ' /></div>').dialog(
      {
        autoOpen: true,
        title: 'Preview',
        modal: true,
        width: 400
      });

      return false;
    });
  });

  updateUiWidgets();

  //poll for changes every 5 seconds
  //window.setInterval("updateUiWidgets()", 5000);
});

function updateUiWidgets()
{
  var padId;

  //try to get the padId out of location.href
  if(!(padId = location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1]))
  {
    //return if this fails
    return;
  }
  
  var receivedData = {
    metaInformations : [],
    bibliography : [],
    graphics : []
  };

  //get metaInformations 
  $.ajax({
    url : '/api/2/pads/' + padId  + '/datastores/metaInformations',
    dataType : 'json',
    async : false,
    success : function(result) { receivedData.metaInformations = result; }
  });

  //get the bibliography
  $.ajax({
    url : '/api/2/pads/' + padId  + '/datastores/bibliography',
    dataType : 'json',
    async : false,
    success : function(result) { receivedData.bibliography = result; }
  });

  //get graphics list
  $.ajax({
    url : '/api/2/pads/' + padId  + '/datastores/graphics',
    dataType : 'json',
    async : false,
    success : function(result) { receivedData.graphics = result; }
  });

  var collection, element;

  for(collection in receivedData)
  { 
    for(element in receivedData[collection])
    {
      $.ajax({
        url : '/api/2/pads/' + padId + '/datastores/' + collection + '/' + receivedData[collection][element],
        dataType : 'json',
        async : false,
        success : function(result) { receivedData[collection][element] = { id: receivedData[collection][element], data : result }; }
      });
    }
  }

  for(collection in receivedData)
  {
    //is there even anything in the datastore ?
    if(typeof(receivedData[collection]) !== 'undefined' && receivedData[collection] !== null)
    {
      //save the selected element
      var selectedElementId = $('#' + collection + 'List .ui-selected').attr('id');

      //clear the widget
      $('#' + collection + 'List li').remove();

      for(elementIndex in receivedData[collection])
      {
        var element = receivedData[collection][elementIndex];
        var listText = undefined;

        //we need to handle elements of the different collections differently
        if(collection === 'metaInformations')
        {
          if(typeof(element['data']) === 'object' && typeof(element['data']['metaInfoType']) === 'string')
          {
            if(typeof(element['data']['templateId']) === 'undefined')
              listText = element['data']['metaInfoType'];
            else
            { 
              switch(element['data']['templateId'])
              {
                //the val thing is needed for the first page load, where the selectmenu would maybe not exist
                case 'ieeetran': $('#templateSelector').val('IEEEtran').selectmenu('value','IEEEtran'); break;
                case 'springer-llncs': $('#templateSelector').val('Springer (llncs)').selectmenu('value','Springer (llncs)'); break;
                case 'springer-svmult': $('#templateSelector').val('Springer (svmult)').selectmenu('value', 'Springer (svmult)'); break;
              }
            }
          }
        }
        else if(collection === 'bibliography')
        {
          if(typeof(element['data']) === 'object' && typeof(element['data']['title']) === 'string')
            listText = element['data']['title'];
        }
        else if(collection === 'graphics')
        {
          if(typeof(element['data']) === 'object' && typeof(element['data']['title']) === 'string')
            listText = element['data']['title'];
        }
        else
        {
          listText = 'unknown element';
        }

        if(typeof(listText) !== 'undefined')
        {
          if(collection === 'graphics')
             $('#' + collection + 'List').append('<li id="' + element['id']  + '"class="ui-widget-content ui-selectee"><div class="ui-widget-header">' + listText + '</div><img src="' + element['data']['url'] + '" height="96" //></li>');
          else
            $('#' + collection + 'List').append('<li id="' + element['id']  + '" style="border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-         width:     0px; border-style: initial; border-color: initial; " class="ui-widget-content ui-selectee">' + listText + '</li>');
        }
      }

      //restore selected element
      if(typeof(selectedElementId) !== 'undefined')
      {
        $('#' + collection + 'List li[id="' + selectedElementId + '"]').addClass('ui-selected');
      }
    }
  }
}
  
function viewLargerImage(listElement)
{
  //make this globar
  var imageView = $('<div></div>').html('This is a dialog!').dialog({autoOpen: false, title: 'Preview'});
  
  imageView.dialog('open');
}

function getDialogHtml(dialogType)
{
  var dialogHtml;

  if(dialogType === 'metaInformations')
  {
    dialogHtml = $('\
      <div>\
        <fieldset>\
          <label for="metaInfoType">Type of meta information</label>\
          <select name="metaInfoType" id="metaInfoType">\
            <option>Author</option>\
            <option>Categories</option>\
            <option>General Terms</option>\
            <option>Keywords</option>\
            <option>Subtitle</option>\
            <option>Title</option>\
          </select>\
          <div id="author">\
            <label for="name">Name</label>\
            <input type="text" name="name" class="text ui-widget-content ui-corner-all" />\
            <label for="position">Position</label>\
            <input type="text" name="position" class="text ui-widget-content ui-corner-all" />\
            <label for="organization">Organization</label>\
            <input type="text" name="organization" class="text ui-widget-content ui-corner-all" />\
            <label for="telephone">Telephone</label>\
            <input type="text" name="telephone" class="text ui-widget-content ui-corner-all" />\
            <label for="email">Email</label>\
            <input type="text" name="email" class="text ui-widget-content ui-corner-all" />\
            <label for="adress">Adress</label>\
            <textarea id="adress" name="adress" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="categories" style="display: none">\
            <label for="categories">Categories</label>\
            <input type="text" name="categories" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="generalTerms" style="display: none">\
            <label for="generalTerms">General Terms</label>\
            <input type="text" name="generalTerms" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="keywords" style="display: none">\
            <label for="keywords">Keywords</label>\
            <input type="text" name="keywords" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="subtitle" style="display: none">\
            <label for="subtitle">Subtitle</label>\
            <input type="text" name="subtitle" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="title" style="display: none">\
            <label for="title">Title</label>\
            <input type="text" name="title" class="text ui-widget-content ui-corner-all" />\
          </div>\
          </fieldset>\
      </div>\
    ');
  }
  else if(dialogType === 'bibliography')
  {
    dialogHtml = $('\
      <div>\
        <fieldset>\
          <label for="entryType">Entry type</label>\
          <select name="entryType" id="entryType">\
            <option>Article</option>\
            <option>Book</option>\
            <option>Booklet</option>\
            <option>Conference</option>\
            <option>Inbook</option>\
            <option>Incollection</option>\
            <option>Manual</option>\
            <option>Master thesis</option>\
            <option>Misc</option>\
            <option>Phd thesis</option>\
            <option>Proceedings</option>\
            <option>Techreport</option>\
            <option>Unpublished</option>\
          </select>\
          <label for="title">Title</label>\
          <input type="text" name="title" class="text ui-widget-content ui-corner-all" />\
          <label for="authors">Authors</label>\
          <input type="text" name="authors" class="text ui-widget-content ui-corner-all" />\
          <div id="url">\
            <label for="url">Url</label>\
            <input type="text" name="url" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="year">\
            <label for="year">Year</label>\
            <input type="text" name="year" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="month">\
            <label for="month">Month</label>\
            <input type="text" name="month" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <div id="publisher">\
            <label for="publisher">Publisher</label>\
            <input type="text" name="publisher" class="text ui-widget-content ui-corner-all" />\
          </div>\
          <label for="journal">Journal</label>\
          <input type="text" name="journal" class="text ui-widget-content ui-corner-all" />\
        </fieldset>\
      </div>\
    ');
  }

  return dialogHtml;
}


function handleUserInterfaceEvent(event)
{ 
  //
  // Add meta information
  //
  if(event.origin === 'metaInformationsCommandBar.AddButton')
  {
    var dialogHtml = getDialogHtml('metaInformations');
    
    var addButtonHandler = function()
    {
      var dialog = $(this);
      var metaInfoType = dialog.find('select[name="metaInfoType"]').selectmenu("value");

      //check if somebody trys to add something which can only exist one time
      if(metaInfoType === 'Categories' && $('#metaInformationsList li:contains("Categories")').length > 0)
      {
        alert("There can only be one categories entry. Please use the modify option.");
        dialog.dialog("close");
        return;
      }
      else if(metaInfoType === 'General Terms' && $('#metaInformationsList li:contains("General Terms")').length > 0)
      {
        alert("There can only be one general terms entry. Please use the modify option.");
        dialog.dialog("close");
        return;
      }
      else if(metaInfoType === 'Keywords' && $('#metaInformationsList li:contains("Keywords")').length > 0)
      {
        alert("There can only be one keywords entry. Please use the modify option.");
        dialog.dialog("close");
        return;
      }
      else if(metaInfoType === 'Subtitle' && $('#metaInformationsList li:contains("Subtitle")').length > 0)
      {
        alert("There can only be one subtitle entry. Please use the modify option.");
        dialog.dialog("close");
        return;
      }
      else if(metaInfoType === 'Title' && $('#metaInformationsList li:contains("Title")').length > 0)
      {
        alert("There can only be one title entry. Please use the modify option.");
        dialog.dialog("close");
        return;
      }

      //build the parameter object used when calling the api
      var requestParameter = {
        metaInfoType : metaInfoType,
        name : (metaInfoType === 'Author') ? dialog.find('*[name="name"]').val() : undefined,
        position : (metaInfoType === 'Author') ? dialog.find('*[name="position"]').val() : undefined,
        organization : (metaInfoType === 'Author') ? dialog.find('*[name="organization"]').val() : undefined,
        telephone : (metaInfoType === 'Author') ? dialog.find('*[name="telephone"]').val() : undefined,
        email : (metaInfoType === 'Author') ? dialog.find('*[name="email"]').val() : undefined,
        position : (metaInfoType === 'Author') ? dialog.find('*[name="position"]').val() : undefined,
        adress : (metaInfoType === 'Author') ? dialog.find('*[name="adress"]').val() : undefined,
        categories : (metaInfoType === 'Categories') ? dialog.find('*[name="categories"]').val() : undefined,
        generalTerms : (metaInfoType === 'General Terms') ? dialog.find('*[name="generalTerms"]').val() : undefined,
        keywords : (metaInfoType === 'Keywords') ? dialog.find('*[name="keywords"]').val() : undefined,
        subtitle : (metaInfoType === 'Subtitle') ? dialog.find('*[name="subtitle"]').val() : undefined,
        title : (metaInfoType === 'Title') ? dialog.find('*[name="title"]').val() : undefined
      };

      $.ajax({
        url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/metaInformations',
        type : 'POST',
        dataType: 'json',
        async : false,
        processData: false,
        contentType : 'application/json',
        data : JSON.stringify(requestParameter)
      });

      //TODO: replace with updating the bibliography list
      updateUiWidgets();

      dialog.dialog("close");
    }
    
    var cancelButtonHandler = function()
    {
      var dialog = $(this);
    
      //dialog.parent().hide('highlight','fast', function() { dialog.dialog("close"); });
      dialog.dialog("close");
    }
    
    var selectmenuChangeHandler = function(event, object)
    {

      var elementsToShow;
      var elementsToHide;
    
      var authorDiv = $(this).parent().find('#author');
      var categoriesDiv = $(this).parent().find('#categories');
      var generalTermsDiv = $(this).parent().find('#generalTerms');
      var keywordsDiv = $(this).parent().find('#keywords');
      var subtitleDiv = $(this).parent().find('#subtitle');
      var titleDiv = $(this).parent().find('#title');
      
      if(object.value === 'Author')
      {
        elementsToShow = authorDiv ;
        elementsToHide = categoriesDiv.add(generalTermsDiv).add(keywordsDiv).add(subtitleDiv).add(titleDiv);        
      }
      else if(object.value === 'Categories')
      {
        elementsToShow = categoriesDiv;
        elementsToHide = authorDiv.add(generalTermsDiv).add(keywordsDiv).add(subtitleDiv).add(titleDiv);        
      }
      else if(object.value === 'General Terms')
      {
        elementsToShow = generalTermsDiv;
        elementsToHide = authorDiv.add(categoriesDiv).add(keywordsDiv).add(subtitleDiv).add(titleDiv);        
      }
      else if(object.value === 'Keywords')
      {
        elementsToShow = keywordsDiv;
        elementsToHide = authorDiv.add(categoriesDiv).add(generalTermsDiv).add(subtitleDiv).add(titleDiv);        
      }
      else if(object.value === 'Subtitle')
      {
        elementsToShow = subtitleDiv;
        elementsToHide = authorDiv.add(categoriesDiv).add(generalTermsDiv).add(keywordsDiv).add(titleDiv);
      }
      else if(object.value === 'Title')
      {
        elementsToShow = titleDiv;
        elementsToHide = authorDiv.add(categoriesDiv).add(generalTermsDiv).add(keywordsDiv).add(subtitleDiv);
      }
      
      elementsToHide.hide();
      elementsToShow.show();
    }
    
    dialogHtml.find('select').selectmenu({
      width: '150px',
      change:  selectmenuChangeHandler
    });

    dialogHtml.find('#metaInfoType-button').css({
      'margin-top' : '5px',
      'margin-bottom' : '5px'
    });

    dialogHtml.find('#adress').css({
      'width' : '95%',
      'height' : '55px',
      'padding' : '.4em'
    });    

    var dialog = $(dialogHtml).dialog({
      autoOpen: false,
      title: 'Add meta information',
      modal: true,
      width: 400, 
      buttons: [
        {
          text: 'Add',
          click: addButtonHandler
        },
        {
          text: 'Cancel',
          click: cancelButtonHandler
        }
      ]
    });
    
    //i dont know why it does not find $(dialog).find('.ui-dialog-content')
    $(dialog).find('fieldset').parent().css({
      'font-size' : '100%'
    });
    
    $(dialog).dialog('open');
  }
  //
  // Delete metaInformations 
  //
  else if(event.origin === 'metaInformationsCommandBar.DeleteButton')
  {
    var item;

    //get the element which should be deleted
    var itemsToDelete = $('#metaInformationsList li.ui-selected');

    if(itemsToDelete.length === 0)
    {
      //there are no items selected
      return;
    }

    for(item in itemsToDelete)
    {
      //try to delete the item using delete api calls
      $.ajax({
        url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/metaInformations/' + $(itemsToDelete[item]).attr('id'),
        type : 'DELETE',
        async: false,
      });

      $(itemsToDelete[item]).remove();
    }
  }
  //
  // Add bibliography
  //
  else if(event.origin === 'bibliographyCommandBar.AddButton')
  {
    var dialogHtml = getDialogHtml('bibliography');

    var addButtonHandler = function()
    {
      var dialog = $(this);

      //build the parameter object used when calling the api
      var requestParameter = {
        entryType : dialog.find('select[name="entryType"]').val(),
        title : dialog.find('input[name="title"]').val(),
        authors : dialog.find('input[name="authors"]').val(),
        url : dialog.find('input[name="url"]').val(),
        year : dialog.find('input[name="year"]').val(),
        month : dialog.find('input[name="month"]').val(),
        publisher : dialog.find('input[name="publisher"]').val(),
        journal : dialog.find('input[name="journal"]').val()
      };
      
      $.ajax({
        url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/bibliography',
        type : 'POST',
        dataType: 'json',
        async : false,
        processData: false,
        contentType : 'application/json',
        data : JSON.stringify(requestParameter)
      });
      
      //update the bibliography list
      //$('#bibliographyList').append('<li id="' + receivedData[collection][element]['id']  + '" style="border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width:     0px; border-style: initial; border-color: initial; " class="ui-widget-content ui-selectee">' + receivedData[collection][element]['data']['title'] + '</li>');
      
      //TODO: replace with updating the bibliography list
      updateUiWidgets();

      $(this).dialog("close");
    }
    
    var cancelButtonHandler = function()
    {
      var dialog = $(this);
    
      //dialog.parent().hide('highlight','fast', function() { dialog.dialog("close"); });
      dialog.dialog("close");
    }
    
    //just handle the first one, if multiple images are selected
    dialogHtml.find('select').selectmenu({ width: '150px' });
    dialogHtml.find('#entryType-button').css({
      'margin-top' : '5px',
      'margin-bottom' : '5px'
    });

    var dialog = $(dialogHtml).dialog({
      autoOpen: false,
      title: 'Add bibliography',
      modal: true,
      width: 400, 
      buttons: [
        {
          text: 'Add',
          click: addButtonHandler
        },
        {
          text: 'Cancel',
          click: cancelButtonHandler
        }
      ]
    });
    
    //i dont know why it does not find $(dialog).find('.ui-dialog-content')
    $(dialog).find('fieldset').parent().css({
      'font-size' : '100%'
    });
    
    $(dialog).dialog('open');
  }

  //
  // Change bibliography
  //
  else if(event.origin === 'bibliographyCommandBar.ChangeButton')
  {
    //get selected list element
    var selectedElementId = $('#bibliographyList .ui-selected').attr('id');

    if(typeof(selectedElementId) !== 'undefined')
    {
      var datastoreObject;

      //get the object from the datastore
      $.ajax(
      {
        url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/bibliography/' + selectedElementId,
        dataType : 'json',
        async : false,
        success : function(result)
        {
          datastoreObject = result;
        }
      });

      //if the result is something we can work with
      if(typeof(datastoreObject) === 'object')
      {
        //define the changeButton handler
        var changeButtonHandler = function()
        {
          var dialog = $(this);

          //build the parameter object used when calling the api
          var requestParameter = {
            entryType : dialog.find('select[name="entryType"]').val(),
            title : dialog.find('input[name="title"]').val(),
            authors : dialog.find('input[name="authors"]').val(),
            url : dialog.find('input[name="url"]').val(),
            year : dialog.find('input[name="year"]').val(),
            month : dialog.find('input[name="month"]').val(),
            publisher : dialog.find('input[name="publisher"]').val(),
            journal : dialog.find('input[name="journal"]').val()
          };

          $.ajax({
            url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/bibliography/' + selectedElementId,
            type : 'PUT',
            dataType: 'json',
            async : false,
            processData: false,
            contentType : 'application/json',
            data : JSON.stringify(requestParameter)
          });

          //TODO: replace with updating the bibliography list
          updateUiWidgets();

          $(this).dialog("close");
        }

        //define the cancelButton handler
        var cancelButtonHandler = function()
        {
          var dialog = $(this);
          dialog.dialog("close");
        }

        //get the dialog
        var dialogHtml = getDialogHtml('bibliography');

        //create the selectMenu widget
        dialogHtml.find('select').selectmenu(
        {
          width: '150px'
        });

        //style the selectMenu (dropdown button)
        dialogHtml.find('#entryType-button').css({
          'margin-top' : '5px',
          'margin-bottom' : '5px'
        });

        //prefill the dialog with the data received by the api call to the datastore
        var element;

        for(element in datastoreObject)
        {
          if(element === 'entryType')
          {
            dialogHtml.find('select').selectmenu("value", (typeof(datastoreObject[element]) === 'string') ? datastoreObject[element] : '');
          }
          else
          {
            dialogHtml.find('input[name="' + element  +'"]').val((typeof(datastoreObject[element]) === 'string') ? datastoreObject[element] : '');
          }
        }
        
        var foo = 'bla';

        //create the dialog
        var dialog = $(dialogHtml).dialog({
          autoOpen: false,
          title: 'Change bibliography',
          modal: true,
          width: 400,
          buttons: [
            {
              text: 'Change',
              click: changeButtonHandler
            },
            {
              text: 'Cancel',
              click: cancelButtonHandler
            }
          ]
        });

        //show the dialog
        $(dialog).dialog('open');
      }
    }
    else
    {
      alert('No element selected!');
    }
  }

  //
  // Delete bibliography
  //
  else if(event.origin === 'bibliographyCommandBar.DeleteButton')
  {
    //get the element which should be deleted
    $('#bibliographyList li.ui-selected').each(function(index, element)
    {
      //try to delete the item using delete api calls
      $.ajax({
        url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/bibliography/' + $(this).attr('id'),
        type : 'DELETE',
        async: false,
      });
    }).remove();
  }
  //
  // Graphic preview/zoomin
  //
  else if(event.origin === 'graphicsCommandBar.ZoominButton')
  {
    var selectedImage = $('#graphicsList li.ui-selected').find('img');
    
    //just handle the first one, if multiple images are selected
    var previewDialog = $('<div><img src=' + selectedImage.attr('src') + ' /></div>').dialog({autoOpen: true, title: 'Preview', modal: true, width: 400});
  }
  //
  // Add graphic
  //
  else if(event.origin === 'graphicsCommandBar.AddButton')
  { 
    var dialogHtml = '\
      <div>\
        <fieldset>\
          <label for="title">Title</label>\
          <input type="text" name="title" class="text ui-widget-content ui-corner-all" />\
          <label for="caption">Caption</label>\
          <input type="text" name="caption" class="text ui-widget-content ui-corner-all" />\
          <label for="url">Url</label>\
          <input type="text" name="url" class="text ui-widget-content ui-corner-all" />\
        </fieldset>\
      </div>\
    ';
    
    function addButtonHandler()
    {
      var dialog = $(this);

      //build the parameter object used when calling the api
      var requestParameter = {
        title : dialog.find('input[name="title"]').val(),
        caption : dialog.find('input[name="caption"]').val(),
        url : dialog.find('input[name="url"]').val(),
      };

      $.ajax({
        url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/graphics',
        type : 'POST',
        dataType: 'json',
        async : false,
        processData: false,
        contentType : 'application/json',
        data : JSON.stringify(requestParameter)
      });

      updateUiWidgets();

      dialog.dialog("close");
    }
    
    var cancelButtonHandler = function()
    {
      $(this).dialog("close");
    }
    
    //just handle the first one, if multiple images are selected
    var AddDialog = $(dialogHtml).dialog({
      autoOpen: true,
      title: 'Add grahpic',
      modal: true,
      width: 400, 
      buttons: [
        {
          text: 'Add',
          click: addButtonHandler
        },
        {
          text: 'Cancel',
          click: cancelButtonHandler
        }
      ]
    });
  }
  //
  // Delete graphic
  //
  else if(event.origin === 'graphicsCommandBar.DeleteButton')
  { 
    var dialogHtml = '\
      <div>\
        <p>\
          Do you realy want to remove that image from the list ?\
        </p>\
      </div>\
    ';

    var deleteButtonHandler = function()
    {
      var dialog = $(this);
    
      //get the element which should be deleted
      $('#graphicsList li.ui-selected').each(function(index, element)
      {
        //try to delete the item using delete api calls
        $.ajax({
          url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/graphics/' + $(this).attr('id'),
          type : 'DELETE',
          async: false,
          error: function() { }
        });
      }).remove();

      dialog.dialog("close");
    }
      
    var cancelButtonHandler = function()
    {
      $(this).dialog("close");
    }
    
    //just handle the first one, if multiple images are selected
    var DeleteDialog = $(dialogHtml).dialog({
      autoOpen: false,
      title: 'Remove grahpic',
      modal: true,
      width: 400, 
      buttons: [
        {
          text: 'Remove',
          click: deleteButtonHandler
        },
        {
          text: 'Cancel',
          click: cancelButtonHandler
        }
      ]
    });

    DeleteDialog.dialog('open');

  }
  //
  // Insert graphic
  //
  else if(event.origin === 'graphicsCommandBar.InsertButton')
  {
    var selectedImage = $('#graphicsList li.ui-selected').find('img');

    if(selectedImage.length > 0)
    {
      //call the additional markup plugin
      plugins.callHook('handleCommand', {name: 'addGraphic', parameters: { url: $(selectedImage).attr('src') } });
    }
    else
    {
      alert('Please select a graphic to insert.');
    }
  }
}
