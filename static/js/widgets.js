//set the window resize handler
$(function() {
  $(window).resize(function() {
    $('#accordion').accordion('resize');
  });
});

$(function() {
  $('#headingSelector').selectmenu({
    width: '150px'
  });

  $('#headingSelector-button').css({
    'position' : 'absolute',
    'left' : '370px',
    'z-index' : '1'
  });
});

$(function() {
        $( "#accordion" ).accordion({
                fillSpace: true
        });
});



/*
$(function() {
        $( "#accordionResizer" ).resizable({
                minHeight: 140,
                resize: function() {
                        $( "#accordion" ).accordion( "resize" );
                }
        });
});
*/

$(function() {
        $( "#metaInformationsList" ).selectable();
});

$(function() {
        $( "#bibliographyList" ).selectable();
});

$(function() {
  $( "#graphicsList a.ui-icon-zoomin" ).click(function( event ) {
    var $item = $( this ), $target = $( event.target );

    //viewLargerImage( $target );
    
    var imageView = $('<div><img src=' + $target.attr('href') + ' /></div>').dialog({autoOpen: true, title: 'Preview', modal: true, width: 400});
    

    return false;
  });
});

$(function() {
        $( "#graphicsList" ).selectable({
    selected: function(event, ui)
    {
      var bla = event;
    }
  });
});
  
$(function () {
  // image preview function, demonstrating the ui.dialog used as a modal window
  function viewLargerImage( $link ) {

    $("#chatDiv").dialog("open");
  
    /*
    var src = $link.attr( "href" ),
      title = $link.siblings( "img" ).attr( "alt" ),
      $modal = $( "img[src$='" + src + "']" );

    if ( $modal.length ) {
      $modal.dialog( "open" );
    } else {
      var img = $( "<img alt='" + title + "' width='384' height='288' style='display: none; padding: 8px;' />" )
        .attr( "src", src ).appendTo( "body" );
      setTimeout(function() {
        img.dialog({
          title: title,
          width: 400,
          modal: true
        });
      }, 1 );
    }
    */
  }
});

function viewLargerImage(listElement)
{
  //make this globar
  var imageView = $('<div></div>').html('This is a dialog!').dialog({autoOpen: false, title: 'Preview'});
  
  imageView.dialog('open');
}

function handleUserInterfaceEvent(event)
{
  if(event.origin === 'metaInformationsCommandBar.AddButton')
  {
    var dialogHtml = $('\
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
    
    var addButtonHandler = function()
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
    
    //just handle the first one, if multiple images are selected
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
  else if(event.origin === 'bibliographyCommandBar.AddButton')
  {
    var dialogHtml = $('\
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
    
    var addButtonHandler = function()
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
}
