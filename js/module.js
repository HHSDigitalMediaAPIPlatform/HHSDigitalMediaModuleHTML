var CDCContentSynd = function() {
  "use strict";
  var sourceData = [
  {
    "label" : "Please Select Source", 
      "value" : "", 
      "topicsUrl" : "", 
      "mediaTypesUrl" : "", 
      "mediaByTopicsUrl" : "", 
      "mediaByTopicsUrlTopicsDelim" : "", 
      "mediaUrl" : "",
      "urlContainsUrl" : ""
  },
  {
    "label" : "CDC", 
    "value" : "CDC", 
    //"topicsUrl" : "https://nchm-tvss1-srv.cdc.gov/api/v1/resources/topics.jsonp?showchild=true&max=0", 
    //"mediaTypesUrl" : "https://nchm-tvss1-srv.cdc.gov/api/v1/resources/mediatypes?max=0", 
    //"mediaByTopicsUrl" : "https://nchm-tvss1-srv.cdc.gov/api/v1/resources/media?topicid={topicids}&mediatype={mediatype}&sort=-dateModified&max=0", 
    //"mediaByTopicsUrlAllTypes" : "https://nchm-tvss1-srv.cdc.gov/api/v1/resources/media?topicid={topicids}&&sort=-dateModified&max=0", 
    //"mediaUrl" : "https://nchm-tvss1-srv.cdc.gov/api/v1/resources/media/{mediaid}/syndicate"
    "topicsUrl" : "http://t.cdc.gov/api/v2/resources/topics.jsonp?showchild=true&max=0", 
    "mediaTypesUrl" : "http://t.cdc.gov/api/v2/resources/mediatypes?max=0", 
    "mediaByTopicsUrl" : "http://t.cdc.gov/api/v2/resources/media?topicid={topicids}&mediatype={mediatype}&sort=-dateModified&max=0", 
    "mediaByTopicsUrlAllTypes" : "http://t.cdc.gov/api/v2/resources/media?topicid={topicids}&&sort=-dateModified&max=0", 
    "mediaUrl" : "http://t.cdc.gov/api/v2/resources/media/{mediaid}/syndicate",
    "urlContainsUrl" : "http://t.cdc.gov/api/v2/resources/media?sourceUrlContains={urlcontains}&fields=id,sourceUrl&max=30"
  }
  ];
  var previewMediaId = '';
  var selectedSourceData = new Object();

  //Selector Definitions
  var cdccs_source = '#cdccs_source';
  var cdccs_fromdate = '#cdccs_fromdate';
  var cdccs_topictree = '#cdccs_topictree';
  var cdccs_mediatypes = '#cdccs_mediatypes';
  var cdccs_title = '#cdccs_title';
  var cdccs_preview = '#cdccs_preview';
  var cdccs_stripimages = '#cdccs_stripimages';
  var cdccs_stripanchors= '#cdccs_stripanchors';
  var cdccs_stripcomments = '#cdccs_stripcomments';
  var cdccs_stripinlinestyles = '#cdccs_stripinlinestyles';
  var cdccs_stripscripts = '#cdccs_stripscripts';
  var cdccs_encoding = '#cdccs_encoding';
  var cdccs_stripbreaks = '#cdccs_stripbreaks';
  var cdccs_imagefloat = '#cdccs_imagefloat';
  var cdccs_cssclasses = '#cdccs_cssclasses';
  var cdccs_ids = '#cdccs_ids';
  var cdccs_xpath = '#cdccs_xpath';
  var cdccs_namespace = '#cdccs_namespace';
  var cdccs_linkssamewindow = '#cdccs_linkssamewindow';
  var cdccs_width = '#cdccs_width';
  var cdccs_height = '#cdccs_height';

  var init = function() {
    $('#searchbymetadata').hide();
    $('#searchbyurl').hide();
    //Set source data here.
    for (var i = 0; i < sourceData.length; i++) {
      $('#cdccs_source')
        .append($("<option></option>")
            .attr("value", sourceData[i].value)
            .text(sourceData[i].label));
    }

    $('#cdccs_fromdate').mask("99/99/9999",{placeholder:" "});
    $('#cdccs_source').change(handleSourceChange);
    $('#cdccs_title').change(handleTitleChange);
    $('#cdccs_fromdate').change(handleFromDateChange);
    $('#cdccs_mediatypes').change(handleMediaTypeChange);
    $('#cdccs_stripimages').change(handleDisplayOptionChanged);
    $('#cdccs_stripanchors').change(handleDisplayOptionChanged);
    $('#cdccs_stripcomments').change(handleDisplayOptionChanged);
    $('#cdccs_stripinlinestyles').change(handleDisplayOptionChanged);
    $('#cdccs_stripscripts').change(handleDisplayOptionChanged);
    $('#cdccs_encoding').change(handleDisplayOptionChanged);
    $('#cdccs_stripbreaks').change(handleDisplayOptionChanged);
    $('#cdccs_imagefloat').change(handleDisplayOptionChanged);
    $('#cdccs_cssclasses').change(handleDisplayOptionChanged);
    $('#cdccs_ids').change(handleDisplayOptionChanged);
    $('#cdccs_xpath').change(handleDisplayOptionChanged);
    $('#cdccs_namespace').change(handleDisplayOptionChanged);
    $('#cdccs_linkssamewindow').change(handleDisplayOptionChanged);
    $('#cdccs_width').change(handleDisplayOptionChanged);
    $('#cdccs_height').change(handleDisplayOptionChanged);
    $('input[name="cdccs_searchtype"]').change(handleSearchTypeChange);

    initUrlSearchField(); 

    handleSourceChange(); //To kick off loading of all fields based on previous saved settings
  };


  var topicsCallback = function(response) {
    if (!response || !response.results || response.results.length < 1) {
      $('#cdccs_topictree').html("<p>There was a problem loading topics, please refresh and try again</p>");
      return;
    }

    var jstreeData = processResultLevel(response.results, new Array());
    loadingTopics(false);
    $('#cdccs_topictree').on('changed.jstree', handleTreeChanged);
    $('#cdccs_topictree').jstree(
        {
          "core" : {
            "data" : jstreeData
          },
      "checkbox" : {
        "three_state" : false
      },
      "plugins" : ["checkbox"]
        });
  };

  var mediaTypesCallback = function (response) {
    var mediaTypesSelect = $('#cdccs_mediatypes');
    mediaTypesSelect.prop('disabled', false);
    mediaTypesSelect.find('option').remove();

    if (!response || !response.results) {
      return;
    }

    var selectedMediaTypes = $('#cdccs_mediatypes').val(); //Array of media type names selected

    mediaTypesSelect.append($("<option></option>")
        .attr("value", "")
        .text("All Media Types"));

    for (var i = 0; i < response.results.length; i++) {
      if ($.inArray(response.results[i].name, selectedMediaTypes) > -1) {
        mediaTypesSelect.append($("<option></option>")
            .attr("value", response.results[i].name)
            .text(response.results[i].name)
            .attr("selected", true));
      }
      else { 
        mediaTypesSelect.append($("<option></option>")
            .attr("value", response.results[i].name)
            .text(response.results[i].name));
      }
    }
  }; 

  var mediaTitleCallback = function (response) {
    $('#cdccs_title').prop('disabled', false);
    if (!response || !response.results) {
      return;
    } 
    var titleSelect = $('#cdccs_title');
    var selectedTitle = $('#cdccs_title option:selected');

    titleSelect.find('option').remove();

    //Since CDC API doesn't (yet) support filtering by date, sort by date and then only show items with mod date >= from date
    if (selectedSourceData.value === 'CDC') {
      var fromDate = new Date($('#cdccs_fromdate').val());
    }

    var foundSelectedTitle = false;
    titleSelect.append($("<option></option>")
        .attr("value", "")
        .text("Select Title"));
    for (var i = 0; i < response.results.length; i++) {
      var titleSelect = $('#cdccs_title');

      if (selectedSourceData.value === 'CDC' && fromDate) {
        var thisLastModDate = parseFromDate(response.results[i].dateModified);
        if (thisLastModDate < fromDate) {
          continue;
        }
      }

      if (response.results[i].id == selectedTitle.val()) {
        titleSelect.append($("<option></option>")
            .attr("value", response.results[i].id)
            .text(response.results[i].name)
            .attr('selected', true));
        foundSelectedTitle = true;
      }
      else {
        titleSelect.append($("<option></option>")
            .attr("value", response.results[i].id)
            .text(response.results[i].name));
      }

    }

    if (foundSelectedTitle) {
      handleTitleChange();
    }
    else {
      clearPreview();
    }

    if (titleSelect.find('option').length < 1) {
      noTitlesFound();
    }
  };

  var mediaCallback = function (response) {
    if (!response || !response.results) {
      previewError();
    }
    loadingPreview(false);
    $('#cdccs_preview').html(response.results.content);
  };

  var handleSourceChange = function () {
    var selectedSource = $('#cdccs_source option:selected').val();
    if (selectedSource === "") {
      resetForm();
      return;
    }

    $('#cdccs_mediatypes').prop('disabled', true);
    loadingTopics(true);
    var topicsUrl = "";
    var mediaTypesUrl = "";
    if (sourceData) {
      for (var i = 0; i < sourceData.length; i++) {
        if (selectedSource === sourceData[i].value) {
          topicsUrl = sourceData[i].topicsUrl;
          mediaTypesUrl = sourceData[i].mediaTypesUrl;
          selectedSourceData = sourceData[i];
          break;
        }
      }
    }

    $.ajaxSetup({cache:false});
    $.ajax({
      url: topicsUrl,
      dataType: "jsonp",
      success: topicsCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        $('#cdccs_topictree').html("<p>There was a problem loading topics, please refresh and try again</p>");
      }
    });    

    $.ajax({
      url: mediaTypesUrl,
      dataType: "jsonp",
      success: mediaTypesCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        $('#cdccs_mediatypes').prop('disabled', false);
      }
    });
  };

  var handleFromDateChange = function () {
    loadTitles();
  };

  var handleMediaTypeChange = function () {
    loadTitles();
  };

  var handleTreeChanged = function (e, data) {
    loadTitles();
  };

  var handleTitleChange = function () {
    previewMediaId = $('#cdccs_title option:selected').val();
    if (previewMediaId === "") {
      clearPreview();
      return;
    }
    loadPreviewForMediaId(previewMediaId);
  };

  var getConfigureParamsAsQueryString = function () {
    var queryString = "";
    var delim = "";
    if ($('#cdccs_stripimages').prop('checked')) {
      queryString += delim + "stripImages=true";
      delim = "&";
    }
    if ($('#cdccs_stripscripts').prop('checked')) {
      queryString += delim + "stripScripts=true";
      delim = "&";
    }
    if ($('#cdccs_stripanchors').prop('checked')) {
      queryString += delim + "stripAnchors=true";
      delim = "&";
    }
    if ($('#cdccs_stripcomments').prop('checked')) {
      queryString += delim + "stripComments=true";
      delim = "&";
    }
    if ($('#cdccs_stripinlinestyles').prop('checked')) {
      queryString += delim + "stripStyles=true";
      delim = "&";
    }
    var encoding = $('#cdccs_encoding option:selected').val();
    if (encoding) {
      queryString += delim + "oe=" + encoding;
      delim = "&";
    }
    if ($('#cdccs_stripbreaks').prop('checked')) {
      queryString += delim + "stripBreaks=true";
      delim = "&";
    }
    var imageFloat = $('#cdccs_imagefloat option:selected').val();
    if (imageFloat) {
      queryString += delim + "imageFloat=" + imageFloat;
      delim = "&";
    }
    var cssClasses = $('#cdccs_cssclasses').val();
    if (cssClasses !== '') {
      queryString += delim + "cssClasses=" + cssClasses;
      delim = "&";
    }
    var elementIds = $('#cdccs_ids').val();
    if (elementIds !== '') {
      queryString += delim + "ids=" + elementIds;
      delim = "&";
    }
    var xpath = $('#cdccs_xpath').val();
    if (xpath !== '') {
      queryString += delim + "xpath=" + xpath;
      delim = "&";
    }
    var namespace = $('#cdccs_namespace').val();
    if (namespace !== '') {
      queryString += delim + "ns=" + namespace;
      delim = "&";
    }
    if ($('#cdccs_linkssamewindow').prop('checked')) {
      queryString += delim + "nw=false";
      delim = "&";
    }
    var width = $('#cdccs_width').val();
    if (width !== '') {
      queryString += delim + "w=" + width;
      delim = "&";
    }
    var height = $('#cdccs_height').val();
    if (height !== '') {
      queryString += delim + "h=" + height;
      delim = "&";
    }
    return queryString;
  };

  var noTitlesFound = function () {
    $('#cdccs_title').append($("<option></option>")
        .attr("value", "")
        .text("No Titles Found"));
  };

  var loadTitles = function () {
    var mediaUrl = selectedSourceData.mediaByTopicsUrl;
    var selectedNodes = $('#cdccs_topictree').jstree(true).get_selected();
    if (selectedNodes.length < 1) {
      $('#cdccs_title').find('option').remove();
      clearPreview();
      noTitlesFound();
      return;
    }

    var selectedTopicIds = getSelectedTopicIdsFromTreeNodes(selectedNodes);

    $('#cdccs_title').prop("disabled", true);
    var delim = ",";
    if (selectedSourceData.mediaByTopicsUrlTopicsDelim) {
      delim = selectedSourceData.mediaByTopicsUrlTopicsDelim;
    }

    //TODO: Replace {fromdate} in url with the selected from date.  Need API that supports this first (CDC does not yet).
    var fromDate = $('#cdccs_fromdate').val();

    var mediaTypes = "";
    var selectedMediaTypes = $('#cdccs_mediatypes').val(); //Array of media type names selected
    if (selectedMediaTypes) {
      mediaTypes = selectedMediaTypes.join();
    }
    if (mediaTypes === '') {
      mediaUrl = selectedSourceData.mediaByTopicsUrlAllTypes;
    } 
    else {
      mediaUrl = mediaUrl.replace("{mediatype}", mediaTypes);
    }

    mediaUrl = mediaUrl.replace("{topicids}", selectedTopicIds.join(delim));

    $.ajaxSetup({cache:false});
    $.ajax({
      url: mediaUrl,
      dataType: "jsonp",
      success: mediaTitleCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        $('#cdccs_title').prop('disabled', false);
      }
    });    
  };

  var resetForm = function () {
    $('#cdccs_fromdate').val("");
    var topictree = $('#cdccs_topictree');
    if (topictree && !!topictree.jstree(true).destroy) {
      topictree.jstree(true).destroy();
    }
    $('#cdccs_topictree').html("");
    $('#cdccs_title').find('option').remove();
    $('#cdccs_mediatypes').find('option').remove();
    clearPreview();
  };

  var parseFromDate = function (fromDate) {
    //TODO: Need to handle bad date fromat b/c this is coming from API
    var parts = fromDate.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)Z/);
    return new Date(+parts[1], parts[2]-1, +parts[3], +parts[4], +parts[5], +parts[6]);
  };

  var htmlDecode = function (value) {
    if (value) {
      return $('<div />').html(value).text();
    } else {
      return '';
    }
  };

  var getSelectedTopicIdsFromTreeNodes = function (selectedNodes) {
    var selectedTopicIds = new Array();
    for(var i = 0; i < selectedNodes.length; i++) {
      var nodeIdElements = selectedNodes[i].split("_");
      selectedTopicIds.push(nodeIdElements.pop());
    } 
    return selectedTopicIds;
  };

  var processResultLevel = function (items, nodeIdHierarchy) {
    var jstreeData = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.mediaUsageCount == 0) {
        continue;
      }
      var treeNode = new Object();
      nodeIdHierarchy.push(item.id);
      treeNode.id = nodeIdHierarchy.join("_");
      treeNode.text = item.name;
      if (item.items && item.items.length && item.items.length > 0) {
        treeNode.children = processResultLevel(item.items, nodeIdHierarchy);
      }
      nodeIdHierarchy.pop();
      jstreeData.push(treeNode);
    }
    return jstreeData;
  };

  var clearPreview = function () {
    $('#cdccs_preview').html("");
  };

  var previewError = function () {
    $('#cdccs_preview').html("<p>There was a problem loading the content for preview, please refresh and try again</p>");
  };

  var loadingTopics = function (showIcon) {
    if (showIcon) {
      $('#cdccs_topictree').html('<img src="css/tree/throbber.gif"/>');
    } 
    else {
      $('#cdccs_topictree').html('');
    }
  };

  var loadingPreview = function (showIcon) {
    if (showIcon) {
      $('#cdccs_preview').html('<img src="css/tree/throbber.gif"/>');
    } 
    else {
      $('#cdccs_preview').html('');
    }
  };

  //############## Start New For Version 1.1
  var initUrlSearchField = function() {
    $('#cdccs_url').autocomplete({
      source: function (req, add) {
        //TODO: Need better method for not making ajax calls based on a number of 'too generic' urls like http:// http://www.cdc.gov, http://www, etc. Maybe some regex?
        if ('http://'.indexOf(req['term']) == 0) {
          return;
        }
        var urlContainsUrl = selectedSourceData.urlContainsUrl.replace('{urlcontains}', req['term']);

        $.ajax({
          url: urlContainsUrl,
          dataType: 'jsonp',
          type: 'GET',
          success: function(response){
            var suggestions = [];
            
            if (!response || !response.results || response.results.length < 1) {
              return;
            }

            for (var i = 0; i < response.results.length; i++) {
              if (i == 25) {
                suggestions.push({label: 'Many More Results Found, Type More to Narrow Search.....', value: ''});
                break;
              }
              var result = response.results[i];
              suggestions.push({label: result.sourceUrl, value: result.id}); 
            }

            add(suggestions);

          },
          error:function(jqXHR, textStatus, errorThrown){
            if (window.console) {
              console.log('error making call to fetch media by url');
              console.log(errorThrown);
            }
          }

        });
      },
      minLength: 3,
      select: function(event, ui) {
        handleUrlSelect(event, ui);
      },
      focus: function(event, ui) {
        event.preventDefault();
      }
    }); 
  };

  var handleUrlSelect = function(event, ui) {
    event.preventDefault();
    var urlField = $('#cdccs_url');
    previewMediaId = ui.item.value;
    urlField.val(ui.item.label);

    if (previewMediaId !== '') {
      loadPreviewForMediaId(previewMediaId);
    }
    return false;
  };

  var handleDisplayOptionChanged = function() {
    loadPreviewForMediaId(previewMediaId);
  }

  var loadPreviewForMediaId = function(mediaId) {
    loadingPreview(true);
    var mediaUrl = selectedSourceData.mediaUrl;
    mediaUrl = mediaUrl.replace("{mediaid}", mediaId);
    var configParams = getConfigureParamsAsQueryString();
    if (configParams) {
      if (mediaUrl.indexOf("?") > 0) {
        mediaUrl = mediaUrl + "&" + configParams;
      } 
      else {
        mediaUrl = mediaUrl + "?" + configParams;
      }
    }

    $.ajaxSetup({cache:false});
    $.ajax({
      url: mediaUrl,
      dataType: "jsonp",
      success: mediaCallback,
      error: function(xhr, ajaxOptions, thrownError) {
        previewError();
      }
    }); 
  }

  var handleSearchTypeChange = function() {
    var searchTypeVal = $(this).val();
    if ($(this).is(':checked') && searchTypeVal === 'metadata') {
      $('#searchbymetadata').show();
      $('#searchbyurl').hide();
    } 
    else if ($(this).is(':checked') && searchTypeVal === 'url') {
      $('#searchbymetadata').hide();
      $('#searchbyurl').show();
    }
  }

  //############## End New For Version 1.1


  //Initialize
  init();
};

$(document).ready(function() {
  var cdcContentSynd = new CDCContentSynd();
});
