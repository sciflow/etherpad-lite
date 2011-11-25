//call updateUiWidgets the first time when the document is ready (will be call by setInterval later on)
$(document).ready(function()
{
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
    }).selectmenu('value','');



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

  /*
  //check if we have to update the widget
  for(collection in receivedData)
  {
    //is there even anything in the datastore ?
    if(typeof(receivedData[collection]) !== 'undefined' && receivedData[collection] !== null)
    {
      var updateWidget = false;

      //we need to update the widget if the number of elements from the response and the widget does not match
      if($('#bibliographyList li').length !== receivedData[collection].length)
      {
        updateWidget = true;
      }
      //even if the number of elements matches, we might have to update
      else
      {
        for(element in receivedData[collection])
        {
          if(updateWidget === false &&  $('#bibliographyList li[id="' + receivedData[collection][element]['id'] +  '"]').length === 0)
          {
            updateWidget = true;
          }
        }
      }

      if(updateWidget === true)
      {
        //update the widget if its needed
        $('#' + collection + 'List li').remove();

        for(element in receivedData[collection])
        {
          if(typeof(receivedData[collection][element]['data']) !== 'undefined' && typeof(receivedData[collection][element]['data']['title']) !== 'undefined')
          {
          $('#' + collection + 'List').append('<li id="' + receivedData[collection][element]['id']  + '" style="border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width:     0px; border-style: initial; border-color: initial; " class="ui-widget-content ui-selectee">' + receivedData[collection][element]['data']['title'] + '</li>');
          }
        }
      }
    }
  }
  */
  for(collection in receivedData)
  {
    //is there even anything in the datastore ?
    if(typeof(receivedData[collection]) !== 'undefined' && receivedData[collection] !== null)
    {
      //save the selected element
      var selectedElementId = $('#' + collection + 'List .ui-selected').attr('id');

      //clear the widget
      $('#' + collection + 'List li').remove();

      for(element in receivedData[collection])
      {
        var listText;

        //we need to handle elements of the different collections differently
        if(collection === 'metaInformations')
        {
          if(typeof(receivedData[collection][element]['data']) === 'object' && typeof(receivedData[collection][element]['data']['metaInfoType']) === 'string')
            listText = receivedData[collection][element]['data']['metaInfoType'];
        }
        else if(collection === 'bibliography')
        {
          if(typeof(receivedData[collection][element]['data']) === 'object' && typeof(receivedData[collection][element]['data']['title']) === 'string')
            listText = receivedData[collection][element]['data']['title'];
        }
        else if(collection === 'graphics')
        {
          if(typeof(receivedData[collection][element]['data']) === 'object' && typeof(receivedData[collection][element]['data']['title']) === 'string')
            listText = receivedData[collection][element]['data']['title'];
        }
        else
        {
          listText = 'unknown element';
        }

        $('#' + collection + 'List').append('<li id="' + receivedData[collection][element]['id']  + '" style="border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-         width:     0px; border-style: initial; border-color: initial; " class="ui-widget-content ui-selectee">' + listText + '</li>');
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
  // Delete bibliography
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
    var item;

    //get the element which should be deleted
    var itemsToDelete = $('#bibliographyList li.ui-selected');

    if(itemsToDelete.length === 0)
    {
      //there are no items selected
      return;
    }

    for(item in itemsToDelete)
    {
      //try to delete the item using delete api calls
      $.ajax({
        url : '/api/2/pads/' + location.href.match(/p\/([0-9a-zA-Z_]+)$/)[1] + '/datastores/bibliography/' + $(itemsToDelete[item]).attr('id'),
        type : 'DELETE',
        async: false,
      });

      $(itemsToDelete[item]).remove();
    }
  }
  else if(event.origin === 'graphicsCommandBar.ZoominButton')
  {
    var selectedImage = $('#graphicsList li.ui-selected').find('img');
    
    //just handle the first one, if multiple images are selected
    var previewDialog = $('<div><img src=' + selectedImage.attr('src') + ' /></div>').dialog({autoOpen: true, title: 'Preview', modal: true, width: 400});
  }
  else if(event.origin === 'graphicsCommandBar.AddButton')
  { 
    var dialogHtml = '\
      <div>\
        <fieldset>\
          <label for="title">Title</label>\
          <input type="text" name="title" class="text ui-widget-content ui-corner-all" />\
          <label for="url">Url</label>\
          <input type="text" name="url" class="text ui-widget-content ui-corner-all" />\
        </fieldset>\
      </div>\
    ';
    
    function addButtonHandler()
    {
      var imageTitle = $(this).find('input[name="title"]').val();
      var imageUrl = $(this).find('input[name="url"]').val();

      
      var addedGraphic = $('#graphicsList').prepend('\
      <li class="ui-widget-content">\
        <div class="ui-widget-header" >' + imageTitle + '</div>\
        <img src="' + imageUrl + '" height="96" //>\
        </li>\
      ');
      
      //$(addedGraphic).find('li').show('highlight', 'slow', setTimeout($(this).dialog("close"),1));
      $(this).dialog("close");

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
      var itemToRemove = $('#graphicsList li.ui-selected');
      
      $(itemToRemove).hide('highlight', 'slow', function() { $(itemToRemove).remove(); });
      
      $(this).dialog("close");
    }
    
    var cancelButtonHandler = function()
    {
      $(this).dialog("close");
    }
    
    //just handle the first one, if multiple images are selected
    var DeleteDialog = $(dialogHtml).dialog({
      autoOpen: true,
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
  }
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
