(function($) {

  $.DwCViewsTable = function(element, options) {

    this.options = {};

    element.data('DwCViewsTable', this);

    // DwCViewsTable Constructor
    this.init = function(element, options) {

      this.options = $.extend({}, $.DwCViewsTable.defaultOptions, options);

      this.element = element;
      this.start = this.options.start;
      this.count = this.options.count;
      this.fields = this.options.fields;
      this.sortBy = this.options.defaultSortBy;
      this.sortOrder = this.options.defaultSortOrder;
      this.fields_string = prepareFieldsString(this.options.fields);
      this.displayRowNums = this.options.displayRowNums;
      this.total = 0;

      // build the base Darwin Core Views URL
      this.base_url = this.options.gatewayAddress + this.options.baseDir;

      // auto fetch data and load it into the table
      if (this.options.loadOnInit) {
        this.fetchRecords();
      }

      // add extra elements and style-ize the DwCViewsTable element
      prepareTable(this);
      prepareHeader(this);
      prepareBody(this);
      prepareFooter(this);

    };


    // display record count/page information
    this.updateLabel = function(data) {
      var label = "Showing Results: ";
      label += (data.start + 1) + " - ";
      if ((data.start + this.count) > this.total) {
        label += (this.total) + " ";
      } else {
        label += (data.start + this.count) + " ";
      }
      label += " (" + data.numFound + " total)";
      this.element.find(".DwCViewsTable_PagingInfo").text(label);
    }


    // display Darwin Core records
    this.populateRecordsData = function(data) {
      // clear any previous data rows
      this.element.find("tbody:last").empty();
      var obj = this; // handle on or "this" object for the callback
      var tbody_html = "";
      var row_type = 1;
      $.each(data.docs, function(row_num, record) {
        tbody_html += '<tr class="DwCViewsTable_ResultRow' + row_type + '">\n';
        // if we wish to display row numbers
        if (obj.displayRowNums) {
          tbody_html += ' <td class="DwCViewsTable_Value">' + (row_num + obj.start + 1) + '.</td>\n';
        }
        // loop through each of the defined fields
        for (var key in obj.fields) {
          tbody_html += ' <td class="DwCViewsTable_Value">' + record[key] + '</td>\n';
        }
        tbody_html += "</tr>\n";
        // toggle alternating row classes
        row_type = (row_type % 2) + 1;
      });
      this.element.find("tbody:last").append(tbody_html);
    }


    // fetch data from the Darwin Core database
    this.fetchRecords = function() {
      var url = prepareUrl(this);
      var d_table = this;
      // fetch data
      $.getJSON(url, function(data) {
        d_table.total = parseInt(data.numFound);
        d_table.populateRecordsData(data);
        d_table.updateLabel(data);
      });
    }

    // Sort by a specific field.  Current sort order
    // (i.e. "asc" / "desc") will be used.  If the table is
    // is already sorted by the given field, this function
    // will simply toggle the sort order.
    this.sortByField = function(field_name) {
      // are we reordering?
      if (this.sortBy == field_name) {
        this.sortOrder = (this.sortOrder == "asc"? "desc" : "asc");
      }
      else {
        this.sortBy = field_name;
      }
      this.fetchRecords();
    }

    // get the next record results page
    this.nextPage = function() {
      if ((this.start + this.count) < this.total) {
        this.start = this.start + this.count;
        this.fetchRecords();
      }
    }


    // get the next record results page
    this.prevPage = function() {
      if ((this.start - this.count) >= 0) {
        this.start = this.start - this.count;
        this.fetchRecords();
      }
    }


    // get the first record results page
    this.firstPage = function() {
      this.start = 0;
      this.fetchRecords();
    }


    // get the next record results page
    this.lastPage = function() {
      if (this.total > this.count) {
        // determine the last page's starting record
        this.start = (this.total - (this.total % this.count));
        this.fetchRecords();
      }
    }


    this.init(element, options);


  };


  $.fn.DwCViewsTable = function(options) {
    return this.each(function() {
      (new $.DwCViewsTable($(this), options));
    });
  };


  // default plugin options
  $.DwCViewsTable.defaultOptions = {
    loadOnInit: true,
    gatewayAddress: "",
    baseDir: "/gateway/",
    start: 0,
    count: 25,
    defaultSortBy: null,
    defaultSortOrder: "asc",
    displayRowNums: true,
    dataType: "records",
    fields: {"id": "ID",
             "sciName_s": "Species",
             "lng":"Longitude",
             "lat": "Latitude"}
  }


  /*
   * begin private functions
   */

  // style-ize table
  function prepareTable(obj) {
    obj.element.addClass("DwCViewsTable");
  }

  // ceate / style-ize column headers
  function prepareHeader(obj) {
    // create a column header row if one does not exist
    if (obj.element.find(".DwCViewsTable_HeaderRow").length == 0) {
      // is a <thead></thead> tag defined?
      if (obj.element.find("thead:last").length == 0) {
        obj.element.prepend("<thead></thead>");
      }
      var thead = obj.element.find("thead:last");
      // create a column headers row at the end of the <thead> body
      thead.append('<tr class="DwCViewsTable_HeaderRow"></tr>');
    }

    // find our column headers row
    var row = obj.element.find(".DwCViewsTable_HeaderRow:last");

    // create the field header cells
    var row_html = "";
    // create result # column if requested in the options
    if (obj.displayRowNums) {
      row_html += '<th field="__DwCRowNum">&nbsp;</th>\n';
    }

    // create labels for each of fields' column
    for (var key in obj.fields) {
      row_html += '<th field="' + key + '">';
      row_html += '<div class="DwCViewsTable_FieldSorter" field="' + key + '">';
      row_html += obj.fields[key];
      row_html += '</div>\n';
      row_html += '</th>\n';
    }
    row.empty();
    row.append(row_html);

    // turn on column sorting
    row.find(".DwCViewsTable_FieldSorter").click(function() {
      obj.sortByField($(this).attr('field'));
    });
  }

  // set up the <tbody>, which will house the records data
  function prepareBody(obj) {
    // if no <tbody> was defined in the base HTML,
    // add it to the DwCViewsTable
    if (obj.element.find("tbody").length == 0) {
      // if there is a <thead>, insert it after the <thead>
      if (obj.element.find("thead").length == 0) {
        obj.element.find("thead")[0].after("<tbody></tbody>");
      }
      else {
        obj.element.prepend("<tbody></tbody>");
      }
    }
  }

  // create / style-ize table footer and buttons
  function prepareFooter(obj) {
    // if a footer row has already been defined
    if (obj.element.find(".DwCViewsTable_PagingRow").length == 0) {
      // if there is no table footer, create one
      if (obj.element.find("tfoot").length == 0) {
        obj.element.append('<tfoot></tfoot>');
      }
      var tfoot = obj.element.find("tfoot:last");

      var page_info_html = '<tr class=".DwCViewsTable_PagingRow">'
      page_info_html += '<th colspan="';
      page_info_html += obj.element.find(".DwCViewsTable_HeaderRow:last")[0].cells.length;
      page_info_html += '" class="DwCViewsTable_PagingButtonContainer">';
      page_info_html += '</th>';
      page_info_html += '</tfoot>';

      tfoot.append(page_info_html);
    }

    button_container = obj.element.find(".DwCViewsTable_PagingButtonContainer");

    // bind buttons to the paging functions
    if (obj.element.find(".DwCViewsTable_FirstButton").length == 0) {
      button_container.append('<div class="DwCViewsTable_FirstButton"></div>');
    }
    first_button = obj.element.find(".DwCViewsTable_FirstButton");
    first_button.addClass('DwCViewsTable_FloatButton');
    first_button.click(function() {
      obj.element.data("DwCViewsTable").firstPage();
    });

    if (obj.element.find(".DwCViewsTable_PrevButton").length == 0) {
      button_container.append('<div class="DwCViewsTable_PrevButton"></div>');
    }
    prev_button = obj.element.find(".DwCViewsTable_PrevButton");
    prev_button.addClass('DwCViewsTable_FloatButton');
    prev_button.click(function() {
      obj.element.data("DwCViewsTable").prevPage();
    });

    if (obj.element.find(".DwCViewsTable_LastButton").length == 0) {
      button_container.append('<div class="DwCViewsTable_LastButton"></div>');
    }
    last_button = obj.element.find(".DwCViewsTable_LastButton");
    last_button.addClass('DwCViewsTable_FloatButton');
    last_button.click(function() {
      obj.element.data("DwCViewsTable").lastPage();
    });

    if (obj.element.find(".DwCViewsTable_NextButton").length == 0) {
      button_container.append('<div class="DwCViewsTable_NextButton"></div>');
    }
    next_button = obj.element.find(".DwCViewsTable_NextButton");
    next_button.addClass('DwCViewsTable_FloatButton');
    next_button.click(function() {
      obj.element.data("DwCViewsTable").nextPage();
    });


    // Paging Status Container
    if (obj.element.find(".DwCViewsTable_PagingInfo").length == 0) {
      button_container.append('<div class="DwCViewsTable_PagingInfo">&nbsp;</div>');
    }

  }


  // prepares the URL and its options
  function prepareUrl(obj) {
    var params = {};
    if (obj.start) { params["start"] = obj.start; }
    if (obj.count) { params["count"] = obj.count; }
    if (obj.fields_string) { params["fields"] = obj.fields_string; }
    if (obj.sortBy) { params["orderby"] = obj.sortBy; }
    if (obj.sortOrder) { params["order"] = obj.sortOrder; }
    return obj.base_url + "records?" + $.param(params);
  }

  
  // turns all of the keys in an associative array into a
  // comma-dilineated string
  function prepareFieldsString(fields) {
    var fields_string = "";
    var is_first = true;
    for (var key in fields) {
      if (!is_first) {
        fields_string += ",";
      }
      fields_string += key;
      is_first = false;
    }
    return fields_string;
  }

})(jQuery);
