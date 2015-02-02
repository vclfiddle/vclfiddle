/**
 * Created by csouza on 18/11/2014.
 */

$(function(){

  var vcl = CodeMirror.fromTextArea(document.getElementById("vcl"), { lineNumbers: true, mode: {name: "javascript", json: true} });
  var har = CodeMirror.fromTextArea(document.getElementById("har"), { lineNumbers: true, mode: {name: "javascript", json: true} });
  var varnishlog = CodeMirror.fromTextArea(document.getElementById("varnishlog"), { lineNumbers: true, mode: {name: "javascript", json: true}, readOnly: true });
  var hiddenFiddleIdInput = document.getElementById('fiddleid');

  function clearTransactions() {
    var table = $('table#transactions');
    var tbodyTemplate = table.find('tbody#results-tbody-template');
    var otherTbodies = table.find('>tbody:not(#results-tbody-template)');
    otherTbodies.remove();
  }

  function displayTransactions(results) {
    var table = $('table#transactions');
    var tbodyTemplate = table.find('tbody#results-tbody-template');
    var toInsertAfter = tbodyTemplate;
    results.forEach(function (result) {
      if (!result.ncsa) result.ncsa = { hitmiss: '(unknown)' };
      var reqSumm = result.request.summary;
      var requestText = [reqSumm.method, reqSumm.url].join(' ');
      var resp = result.response;
      if (!resp) resp = { headers: [] };
      var responseText = [resp.code, resp.comment].join(' ');
      var contentType = resp.headers.filter(function (h) { return h.name.toLowerCase() === 'content-type'; });
      contentType = contentType.length === 0 ? '' : contentType[0].value;
      var contentTypeSemicolonIndex = contentType.indexOf(';');
      if (contentTypeSemicolonIndex >= 0) contentType = contentType.substring(0, contentTypeSemicolonIndex);

      if (result.request.excludeReason) {
        responseText = ['(', result.request.excludeReason, ': ', result.request.message, ')'].join(' ');
      }

      var resulttbody = tbodyTemplate.clone();
      resulttbody.attr('id', '');
      resulttbody.attr('style', '');
      resulttbody.find('td.result-summary-entryIndex').text(result.request.entryIndex);
      resulttbody.find('td.result-summary-request').text(requestText);
      var responseCell = resulttbody.find('td.result-summary-response');
      var contentTypeCell = resulttbody.find('td.result-summary-contentType');
      var cacheCell = resulttbody.find('td.result-summary-cache');
      if (result.request.excludeReason) {
        responseText = ['(', result.request.excludeReason, ': ', result.request.message, ')'].join(' ');
        responseCell.attr('colspan', 3);
        contentTypeCell.hide();
        cacheCell.hide();
      } else {
        contentTypeCell.text(contentType);
        cacheCell.text(result.ncsa.hitmiss);
        cacheCell.addClass('cache-' + result.ncsa.hitmiss);
      }
      responseCell.text(responseText);

      var detailsRow = resulttbody.find('tr.result-details');
      detailsRow.hide();
      resulttbody.find('td.result-details-toggle').click(function (ev) {
        detailsRow.slideToggle();
      });
      // TODO handle keyboard expansion too
      // TODO handle click event on a parent to reduce event handlers

      var detailRowTemplate = resulttbody.find('tr#result-details-row-template');
      var detailToInsertAfter = detailRowTemplate;
      var detailRows = resp.headers.forEach(function (header) {
        var row = detailRowTemplate.clone();
        row.attr('id', '');
        row.attr('style', '');
        row.find('td.result-details-headerName').text(header.name);
        row.find('td.result-details-headerValue').text(header.value);
        row.insertAfter(detailToInsertAfter);
        detailToInsertAfter = row;
      });

      // TODO show ncsa.handling in details
      // TODO show vxid for correlation with varnishlog

      detailRowTemplate.remove();

      resulttbody.insertAfter(toInsertAfter);
      toInsertAfter = resulttbody;
    });
  };

  $("#run").click(function (e) {
    e.preventDefault();
    vcl.save();
    har.save();
    $('.spinner img').fadeIn();
    $.ajax({
      type: "POST",
      url: "/vcl/run",
      data: $( "#input" ).serialize(),
      headers: { Accept: "application/json; charset=utf-8"}
    }).done(function( data ) {
      hiddenFiddleIdInput.value = data.fiddleid;
      var newFiddleUrl = ['/', data.fiddleid, '/', data.runindex].join('');
      window.history.pushState({fiddleid: data.fiddleid, runindex: data.runindex}, '', newFiddleUrl);
      // TODO handle popState for history navigation
      varnishlog.setValue(data.log || '');
      clearTransactions();
      var poll = function () {
        var resultUrl = ['/vcl/result?fiddleid=', data.fiddleid, '&runindex=', data.runindex].join('');
        $.getJSON(resultUrl, function (data) {
          if (data.log) {
            $('.spinner img').fadeOut();
            varnishlog.setValue(data.log);
            if (data.results) {
              displayTransactions(data.results);
            }
          } else {
            window.setTimeout(poll, 1000);
          }
        });
      };
      window.setTimeout(poll, 1000);
    });
  });
  $("#save").click(function (e) {e.preventDefault();});
  $("#share").click(function (e) {e.preventDefault();});

  $( ".editor" )
    .mouseenter(function() {
      $( this ).find( ".window-label" ).fadeOut();
    })
    .mouseleave(function() {
      $( this ).find( ".window-label" ).fadeIn();
    });

  if (typeof vclfiddle_results === 'object') displayTransactions(vclfiddle_results);


  // SHARE functions

  $( "#sendFiddleForm" ).submit(function( event ) {

    $('#current_fiddle').val($(location).attr('href'));
    // Stop form from submitting normally
    event.preventDefault();

    // Get some values from elements on the page:
    var $form = $( this ),
      your_name = $form.find( "input[name='your_name']" ).val(),
      friend_name = $form.find( "input[name='friend_name']" ).val(),
      email = $form.find( "input[name='email']" ).val(),
      current_fiddle = $form.find( "input[name='current_fiddle']" ).val(),
      url = $form.attr( "action" );

    // Send the data using post
    var posting = $.post( url, { your_name: your_name, friend_name: friend_name, email: email, current_fiddle: current_fiddle } );

    // Put the results in a div
    posting.done(function( data ) {
      var content ='',
        class_status = 'bg-success';
      if (data.status == 'success')
      {
        content = data.message;
      } else {
        class_status = 'bg-danger';
        if (data.message instanceof Array) {
          var content =
            $.map(data.message, function(msg){
              var item = '';
              $.each( msg, function(name, value){item += "<li>" + value + "</li>"; });
              return item;
            }).join(' ');
        } else {
          content = data.message;
        }
      }

    $( "#result" )
      .empty()
      .append($("<p/>")
        .addClass(class_status)
        .append($("<ul/>").append( content )));
    });
  });

  $('.twitter-popup').click(function(event) {
    var width  = 575,
      height = 400,
      left   = ($(window).width()  - width)  / 2,
      top    = ($(window).height() - height) / 2,
      url    = $(this).attr('href'),
      opts   = 'status=1' +	',width='  + width  +	',height=' + height +	',top='    + top    +	',left='   + left;
    window.open(url, 'twitter', opts);
    return false;
  });
});
