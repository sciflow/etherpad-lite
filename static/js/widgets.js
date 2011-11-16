//set the window resize handler
$(function() {
  $(window).resize(function() {
    $('#accordion').accordion('resize');
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
    alert('You clicked the "Add Button" on on the metaInformations command bar!');
  }
  else if(event.origin === 'graphicsCommandBar.InsertButton')
  {
    var selectedImage = $('#graphicsList li.ui-selected').find('img');

    //call the additional markup plugin
    plugins.callHook('handleCommand', {name: 'addGraphic', parameters: { url: $(selectedImage).attr('src') } });
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
    
    function cancelButtonHandler()
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

    function deleteButtonHandler()
    {
      var itemToRemove = $('#graphicsList li.ui-selected');
      
      $(itemToRemove).hide('highlight', 'slow', function() { $(itemToRemove).remove(); });
      
      $(this).dialog("close");
    }
    
    function cancelButtonHandler()
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
