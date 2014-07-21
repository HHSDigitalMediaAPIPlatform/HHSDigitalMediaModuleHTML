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
      "mediaUrl" : ""
  },
  {
    "label" : "CDC", 
    "value" : "CDC", 
    "topicsUrl" : "https://tools.cdc.gov/api/v1/resources/topics.jsonp?showchild=true&max=0", 
    "mediaTypesUrl" : "https://tools.cdc.gov/api/v1/resources/mediatypes?max=0", 
    "mediaByTopicsUrl" : "https://tools.cdc.gov/api/v1/resources/media?topicid={topicids}&mediatype={mediatype}&sort=-dateModified&max=0", 
    "mediaByTopicsUrlAllTypes" : "https://tools.cdc.gov/api/v1/resources/media?topicid={topicids}&&sort=-dateModified&max=0", 
    "mediaUrl" : "https://tools.cdc.gov/api/v1/resources/media/{mediaid}/syndicate"
  }
  ];
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

  var init = function() {
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
    $('#cdccs_stripimages').change(handleTitleChange);
    $('#cdccs_stripanchors').change(handleTitleChange);
    $('#cdccs_stripcomments').change(handleTitleChange);
    $('#cdccs_stripinlinestyles').change(handleTitleChange);
    $('#cdccs_stripscripts').change(handleTitleChange);
    $('input[name="cdccs_hidetitle"]').change(showHideContentTitleDesc);
    $('input[name="cdccs_hidedescription"]').change(showHideContentTitleDesc);
    $('#cdccs_encoding').change(handleTitleChange);

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
    for (var i = 0; i < response.results.length; i++) {
      var titleSelect = $('#cdccs_title');

      if (selectedSourceData.value === 'CDC' && fromDate) {
        var thisLastModDate = parseFromDate(response.results[i].dateModified);
        if (thisLastModDate < fromDate) {
          continue;
        }
      }

      if (response.results[i].mediaId === selectedTitle.val()) {
        titleSelect.append($("<option></option>")
            .attr("value", response.results[i].mediaId)
            .text(response.results[i].title)
            .attr('selected', true));
        foundSelectedTitle = true;
      }
      else {
        titleSelect.append($("<option></option>")
            .attr("value", response.results[i].mediaId)
            .text(response.results[i].title));
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
    $('#cdccs_preview').html(htmlDecode(response.results.content));
    showHideContentTitleDesc();
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
    var selectedTitle = $('#cdccs_title option:selected').val();
    if (selectedTitle === "") {
      clearPreview();
      return;
    }
    loadingPreview(true);
    var mediaUrl = selectedSourceData.mediaUrl;
    mediaUrl = mediaUrl.replace("{mediaid}", selectedTitle);
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
  };

  var getConfigureParamsAsQueryString = function () {
    var queryString = "";
    var delim = "";
    //TODO: Need to figure out how to support this w/ all sources, not just CDC.
    if ($('#cdccs_stripimages').prop('checked')) {
      queryString += delim + "stripImage=true";
      delim = "&";
    }
    if ($('#cdccs_stripscripts').prop('checked')) {
      queryString += delim + "stripScript=true"; //TODO: Need to figure if this is supported w/ API
      delim = "&";
    }
    if ($('#cdccs_stripanchors').prop('checked')) {
      queryString += delim + "stripAnchor=true";
      delim = "&";
    }
    if ($('#cdccs_stripcomments').prop('checked')) {
      queryString += delim + "stripComment=true"; //TODO: Need to figure if this is supported w/ API
      delim = "&";
    }
    if ($('#cdccs_stripinlinestyles').prop('checked')) {
      queryString += delim + "stripStyle=true";
      delim = "&";
    }
    var encoding = $('#cdccs_encoding option:selected').val();
    if (encoding) {
      queryString += delim + "oe=" + encoding;
      delim = "&"
    }
    return queryString;
  };

  var showHideContentTitleDesc = function () {
    var mediaId = $('#cdccs_title option:selected').val();
    if ($('input[name="cdccs_hidetitle"]').prop('checked')) {
      $('span[id="cdc_title_' + mediaId + '"]').hide();
    }
    else {
      $('span[id="cdc_title_' + mediaId + '"]').show();
    }
    if ($('input[name="cdccs_hidedescription"]').prop('checked')) {
      $('p[id="cdc_description_' + mediaId + '"]').hide();
    }
    else {
      $('p[id="cdc_description_' + mediaId + '"]').show();
    }
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
    if (mediaUrl.indexOf("?") > 0) {
      mediaUrl = mediaUrl + "&";
    } 
    else {
      mediaUrl = mediaUrl + "?";
    }

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
    var parts = fromDate.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
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

  //Initialize
  init();
};

$(document).ready(function() {
  var cdcContentSynd = new CDCContentSynd();
});
