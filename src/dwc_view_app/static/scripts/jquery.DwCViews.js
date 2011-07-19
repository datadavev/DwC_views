// ******** //
/*
TODO:
   recordsTable: cache field option - per field
   recordsTable: cache fields option - all fields
   recordsTable: special class for active (single record) row
   recordsTable: onFilter() hook option
   all: various hook options
*/
// ******** //
(function($) {

  /***************************************************************************
   * DwCViews
   *
   * Creates a self-contained suite of objects for browsing data from a
   * Darwin Core database.
   ***************************************************************************/

  $.DwCViews = function(element, options) {

    this.options = {};

    // store this object instance in the main element's .data() attribute
    element.data('DwCViews', this);

    this.init = function(element, option) {

      // merge default options and options passed into the function
      this.options = $.extend({}, $.DwCViews.defaultOptions, options);

      // create a handle on the DOM element
      this.element = element;

      this.gatewayAddress = this.options.gatewayAddress;
      this.baseDir = this.options.baseDir;
      this.showToolbar = this.options.showToolbar;
      this.fields = this.options.fields;
      this.recordTable = this.options.recordTable;
      this.recordTableOptions = this.options.recordTableOptions;
      this.recordsTable = this.options.recordsTable;
      this.recordsTableOptions = this.options.recordsTableOptions;

      setupViews(this);

    }

  
  /***************************************************************************
   * DwCViews - Begin Public Functions
   ***************************************************************************/

   // this.pubFunction = function() {}


  /***************************************************************************
   * DwCViews - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCViews - Namespace Declaration
   ***************************************************************************/

  $.fn.DwCViews = function(options) {
    return this.each(function() {
      (new $.DwCViews($(this), options));
    });
  };


  /***************************************************************************
   * DwCViews - Default Options
   ***************************************************************************/

  $.DwCViews.defaultOptions = {
    gatewayAddress: "",
    baseDir: "/gateway/",
    globalDefaultValue: '',
    showToolbar: true,
    recordTable: null,
    recordTableOptions: null,
    recordsTable: null,
    recordsTableOptions: null,
    mapView: null,
    mapViewOptions: null
  };


  /***************************************************************************
   * DwCViews - Begin Private Functions
   ***************************************************************************/

  function setupViews(obj) {
    var toolbar;
    var search_box;
    var search_button;
    var record_table;
    var records_table;
    var map_view;
    var options = {};

    toolbar = obj.element.find('.DwCViews_Toolbar:last');
    if (toolbar.length == 0) {
      toolbar = $('<div class="DwCViews_Toolbar"></div>');
      obj.element.append(toolbar);
    }
    obj.toolbar = toolbar;

    search_button = obj.element.find('input.DwCViews_SearchButton');
    if (search_button.length == 0) {
      search_button = $('<div class="DwCViews_SearchButton"></div>');
      obj.toolbar.append(search_button);
    }
    obj.searchButton = search_button;

    search_box = obj.element.find('input.DwCViews_SearchBox');
    if (search_box.length == 0) {
      search_box = $('<input type="text" class="DwCViews_SearchBox" />');
      obj.toolbar.append(search_box);
    }
    obj.searchBox = search_box;

    // hide the toolbar if specified in the options
    if (!obj.showToolbar) {
      obj.toolbar.hide();
    }

    /* add a single record table to the suite (if not already present) */
    if (obj.recordTable == null) {
      record_table = obj.element.find('div.DwCRecordTable_Container');
      if (record_table.length == 0) {
        record_table = $('<div class="DwCRecordTable_Container"></div>');
        obj.element.append(record_table);
      }

      // if special options were specified, make sure that the the parent
      // gateway server's options are used (unless overridden)
      if (record_table.data('DwCRecordTable') == null) {
        if (obj.recordTableOptions) {
          // if no baseDir was supplied in the options, use the DwCViews baseDir
          if (obj.recordTableOptions['gatewayAddress'] == null) {
            obj.recordTableOptions['gatewayAddress'] = obj.gatewayAddress;
          }
          // if no baseDir was supplied in the options, use the DwCViews baseDir
          if (obj.recordTableOptions['baseDir'] == null) {
            obj.recordTableOptions['baseDir'] = obj.baseDir;
          }
        }
        // if no options were passed in, set some defaults
        else {
          // pass along the baseDir and gatewayAddress
          obj.recordTableOptions = {};
          obj.recordTableOptions['gatewayAddress'] = obj.gatewayAddress;
          obj.recordTableOptions['baseDir'] = obj.baseDir;
          // do not initialize the table on default (wait for a proper event)
          obj.recordTableOptions['loadOnInit'] = false;
          obj.recordTableOptions['hideOnInit'] = true;
        }

        // initialize our record table
        record_table.DwCRecordTable(obj.recordTableOptions);
      }

      obj.recordTable = record_table.data('DwCRecordTable');
    }


    /* add a single record table to the suite (if not already present or set to false) */
    if (obj.recordsTable == null) {
      records_table = obj.element.find('div.DwCRecordsTable_Container');
      if (records_table.length == 0) {
        records_table = $('<div class="DwCRecordsTable_Container"></div>');
        obj.element.append(records_table);
      }

      // if special options were specified, make sure that the the parent
      // gateway server's options are used (unless overridden)
      if (records_table.data('DwCRecordsTable') == null) {
        if (obj.recordsTableOptions) {
          // if no baseDir was supplied in the options, use the DwCViews baseDir
          if (obj.recordsTableOptions['gatewayAddress'] == null) {
            obj.recordsTableOptions['gatewayAddress'] = obj.gatewayAddress;
          }
          // if no baseDir was supplied in the options, use the DwCViews baseDir
          if (obj.recordsTableOptions['baseDir'] == null) {
            obj.recordsTableOptions['baseDir'] = obj.baseDir;
          }
        }
        // if no options were passed in, set some defaults
        else {
          // pass along the baseDir and gatewayAddress
          obj.recordsTableOptions = {};
          obj.recordsTableOptions['gatewayAddress'] = obj.gatewayAddress;
          obj.recordsTableOptions['baseDir'] = obj.baseDir;
        }

        // make this records table aware of the single record table
        if (obj.recordTable && obj.recordsTableOptions['recordTable'] == null) {
          obj.recordsTableOptions['recordTable'] = obj.recordTable;
        }

        // initialize our record table
        records_table.DwCRecordsTable(obj.recordsTableOptions);
      }

      obj.recordsTable = records_table.data('DwCRecordsTable');
    }

    // bind a record search event when the user presses the 'enter' key
    // while the textbox is active
    obj.searchBox.keyup(function(event) {
      if (event.keyCode == 13) {
        obj.recordsTable.query = $(this).attr('value');
        obj.recordsTable.fetchRecords(false);
      }
    });

    // set the onClick event to search button
    if (obj.recordsTable) {
      obj.searchButton.click(function () {
        obj.recordsTable.query = obj.searchBox.attr('value');
        obj.recordsTable.fetchRecords(false);
      });
    }

  }




  /***************************************************************************
   * DwCRecordTable
   *
   * Part of the DwCViews (Darwin Core Views) Suite
   *
   * A table used to view a single record within a Darwin Core Database
   ***************************************************************************/

  $.DwCRecordTable = function(element, options) {

    this.options = {};

    element.data('DwCRecordTable', this);

    this.init = function(element, option) {

      this.options = $.extend({}, $.DwCRecordTable.defaultOptions, options);

      // create a handle for our html element
      this.element = element;

      // build the base Darwin Core Views URL
      this.baseURL = this.options.gatewayAddress + this.options.baseDir;

      this.tbody = null;
      this.globalDefaultValue = this.options.globalDefaultValue;
      this.recordID = this.options.recordID;
      this.idField = this.options.idField;
      this.recordTable = null;
      this.hideButton = null;
      this.searchBox = null;
      this.searchButton = null;

      // if we want this table to be hidden upon initialization
      if (this.options.hideOnInit) {
        this.element.hide();
      }

      prepareRecordTable(this);

      // go ahead and build the table's data unless otherwise specified
      if (this.recordID != '' && this.options.loadOnInit) {
        fetchRecord(this);
      }

    }

  
  /***************************************************************************
   * DwCRecordTable - Begin Public Functions
   ***************************************************************************/

  // change the record being displayed by the DwCRecordTable
  this.setRecordID = function(id, show_table) {
    // default value for show_table (false);
    var show_table = typeof(show_table) != 'undefined'? show_table : false;

    this.recordID = id.toString();
    this.searchBox.attr('value', this.recordID);
    fetchRecord(this, show_table);
  }


  // hide the table (if not already hidden)
  this.showTable = function() {
    var element = this.element;
    element.slideDown('slow', function() {
      element.show();
    });
  }


  // show the table (if it is hidden)
  this.hideTable = function() {
    var element = this.element;
    element.slideUp('slow', function() {
      element.hide();
    });
  }


  this.populateTable = function(record) {
    var obj = this; // object handle for callback functions
    var i = 1; // field counter
    var blank_row_html = '<tr class="DwCRecordTable_RecordRow"></tr>'; 
    var row;
    var field_label;
    var field_value;

    // clear out any existing rows
    this.tbody.find("tr.DwCRecordTable_RecordRow").remove();

    row = $(blank_row_html);
    // set a special class for the first row
    row.addClass('DwCRecordTable_FirstRecordRow');

    // the first field displayed should be the ID field (if it exists)
    if (this.idField in record) {
      // field name
      field_label = $('<td class="DwCRecordTable_FieldLabel"></td>');
      field_label.text(this.idField);
      field_label.addClass('DwCRecordTable_FirstRecordRowCell');
      field_label.addClass('DwCRecordTable_FieldLabel_LeftColumn');
      row.append(field_label);
      // field value
      field_value = $('<td class="DwCRecordTable_FieldValue"></td>');
      field_value.text(record[this.idField].toString());
      field_value.addClass('DwCRecordTable_FirstRecordRowCell');
      field_value.addClass('DwCRecordTable_FieldValue_LeftColumn');
      row.append(field_value);     
      var i = 2;
    }
    
    // loop through each field and add it to the table
    $.each(record, function(field, value) {
      // skip the id field, since we already displayed it
      if (field.toString() != obj.idField) {

        // field name
        field_label = $('<td class="DwCRecordTable_FieldLabel"></td>');
        field_label.text(field);
        row.append(field_label);
        // field value
        field_value = $('<td class="DwCRecordTable_FieldValue"></td>');
        field_value.text(value.toString());
        row.append(field_value);

        // if this is the first row, add as special class to each cell
        if (i < 3) { 
          field_label.addClass('DwCRecordTable_FirstRecordRowCell');
          field_value.addClass('DwCRecordTable_FirstRecordRowCell');
        }

        // add a special class for the right / left columns
        if (i % 2) {
          field_label.addClass('DwCRecordTable_FieldLabel_LeftColumn');
          field_value.addClass('DwCRecordTable_FieldValue_LeftColumn');
        }
          else {
          field_label.addClass('DwCRecordTable_FieldLabel_RightColumn');
          field_value.addClass('DwCRecordTable_FieldValue_RightColumn');
        }

        // new row every 2 fields
        if ((i % 2) == 0) {
          // alternating row classes
          if ((i % 4) == 0) {
            row.addClass("DwCRecordTable_RecordRow1");
          }
          else {
            row.addClass("DwCRecordTable_RecordRow2");
          }
          obj.tbody.append(row);
          row = $(blank_row_html);
        }
        i++;
      }
    });

    // if we left on an odd-numbered field, fill in the rest of the table
    // with blank cells
    if ((i % 2) == 0) {
      field_label = $('<td class="DwCRecordTable_FieldLabel"></td>');
      field_label.addClass('DwCRecordTable_FieldLabel_RightColumn');
      row.append(field_label);
      field_value = $('<td class="DwCRecordTable_FieldValue"></td>');
      field_value.addClass('DwCRecordTable_FieldValue_RightColumn');
      row.append(field_value);
      this.tbody.append(row);
    }

    // set a special class for the last row
    row = obj.tbody.find('tr.DwCRecordTable_RecordRow:last');
    row.addClass('DwCRecordTable_LastRecordRow');
    // set a special class for all cells in the last row
    row.find('td.DwCRecordTable_FieldLabel,td.DwCRecordTable_FieldValue').addClass('DwCRecordTable_LastRecordRowCell');

  }


  // returns true of the DwCRecordTable is hidden, false otherwise
  this.isHidden = function() {
    var display = this.element.css('display');
    return (!display || display == 'none');
  }


  /***************************************************************************
   * DwCRecordTable - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCRecordTable - Namespace Declaration
   ***************************************************************************/

  $.fn.DwCRecordTable = function(options) {
    return this.each(function() {
      (new $.DwCRecordTable($(this), options));
    });
  };


  /***************************************************************************
   * DwCRecordTable - Default Options
   ***************************************************************************/

  $.DwCRecordTable.defaultOptions = {
    loadOnInit: true,
    idField: "id",
    recordID: '',
    gatewayAddress: "",
    baseDir: "/gateway/",
    globalDefaultValue: '',
    showHideButton: true,
    hideOnInit: false
  };


  /***************************************************************************
   * DwCRecordTable - Begin Private Functions
   ***************************************************************************/

  function prepareRecordTable(obj) {
    var record_table;

    obj.element.addClass('DwCRecordTable_Container');

    // if the actual table doesn't exist, create it
    record_table = obj.element.find('table.DwCRecordTable');
    if (record_table.length == 0) {
      record_table = $('<table cellpadding="0" cellspacing="0" border="0"></table>');
      record_table.addClass('DwCRecordTable');
      obj.element.append(record_table);
      obj.recordTable = record_table;
    } else {
      obj.recordTable = record_table;
    }

    // see if a <thead> tag already exists
    var thead = obj.element.find("thead:last");
    if (thead.length == 0) {
      // create a <thead> tag
      thead = $('<thead></thead>');
      obj.recordTable.prepend(thead);
    }

    // create a header (control buttons) row
    var control_row = $('<tr class="DwCRecordTable_ControlRow"></tr>');
    var controls_container = $('<th class="DwCRecordTable_ControlsContainer"></th>');
    controls_container.attr('colspan', 4);
    var hide_button = $('<div class="DwCRecordTable_HideButton"></div>');
    hide_button.addClass('DwCRecordTable_ClickableObject');
    var search_button = $('<div class="DwCRecordTable_SearchButton"></div>');
    search_button.addClass('DwCRecordTable_ClickableObject');
    var search_box = $('<input class="DwCRecordTable_SearchBox" type="text"></text>');
    search_box.attr('value', obj.recordID.toString());
    controls_container.append(search_box);
    controls_container.append(search_button);
    controls_container.append(hide_button);
    control_row.append(controls_container);
    thead.append(control_row);

    obj.hideButton = hide_button;
    obj.searchBox = search_box;
    obj.searchButton = search_button;

    // set the hide button to "hide" this table when clicked
    hide_button.click(function() {
      obj.hideTable();
    });

    // bind a record fetch event when the user presses the 'enter' key
    // while the textbox is active
    search_box.keyup(function(event) {
      if (event.keyCode == 13) {
        obj.setRecordID($.trim(obj.searchBox.attr('value')));
      }
    });

    // bind the search button click to search for the record id
    // supplied in the search box
    search_button.click(function() {
      obj.setRecordID($.trim(obj.searchBox.attr('value')));
    });

    // see if a <tbody> tage already exists
    var tbody = obj.recordTable.find("tbody:last");
    if (tbody.length == 0) {
      // create a <tbody> tag
      tbody = $('<tbody></tbody>');
      tbody.insertAfter(thead);
    }
    else {
      tbody = tbody[0];
    }

    // set a tbody handle for future reference
    obj.tbody = tbody;
  }


  function fetchRecord(obj, show_table) {
    var url = obj.baseURL + 'record/' + encodeURI(obj.recordID);

    // default value for the show_table parameter (false)
    show_table = typeof(show_table) != 'undefined'? show_table : false;

    $.getJSON(url, function(record) {
      obj.populateTable(record);
      // show the table automatically, if requested
      if (show_table && obj.isHidden()) {
        obj.showTable();
      }
    });
  }




  /***************************************************************************
   * DwCRecordsTable
   *
   * Transforms a (potentially) blank div into a listing of records
   * from a Darwin Core Database
   ***************************************************************************/

  $.DwCRecordsTable = function(element, options) {

    this.options = {};

    element.data('DwCRecordsTable', this);

    // DwCRecordsTable Constructor
    this.init = function(element, options) {

      this.options = $.extend({}, $.DwCRecordsTable.defaultOptions, options);

      var obj = this; // extra handle for callback functions

      this.element = element;
      this.recordsTable = null;
      this.start = this.options.start;
      this.count = this.options.count;
      this.fields = this.options.fields;
      this.fields_string = prepareFieldsString(this.options.fields);
      this.sortBy = this.options.defaultSortBy;
      this.sortOrder = this.options.defaultSortOrder;
      this.displayRowNums = this.options.displayRowNums;
      this.globalDefaultValue = this.options.globalDefaultValue;
      this.recordTable = this.options.recordTable;
      this.idField = this.options.idField;
      this.rowClick = this.options.rowClick;
      this.total = 0;
      this.data = null;
      this.db_fields = null;
      this.field_menu = null;
      this.overlay = null;

      // build the base Darwin Core Views URL
      this.baseURL = this.options.gatewayAddress + this.options.baseDir;

      // auto fetch data and load it into the table
      if (this.options.loadOnInit) {
        this.fetchRecords(false);
      }

      // add extra elements and style-ize the DwCRecordsTable element
      prepareTable(this);
      prepareHeader(this);
      prepareBody(this);
      prepareFooter(this);

      // fetch and cache the available db fields
      fetchFieldInfo(this);

      // bind right-click on field headers to the fields context menu
      this.recordsTable.find(".DwCRecordsTable_HeaderRow").bind('contextmenu', function(e) {
        obj.fields_menu.showMenu(e);
        return false;
      });

    };


  /***************************************************************************
   * DwCRecordsTable - Begin Public Functions
   ***************************************************************************/

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
      this.element.find(".DwCRecordsTable_PagingInfo").text(label);
    }


    // display Darwin Core records
    this.populateRecordsData = function(data) {
      var tbody = this.recordsTable.find('tbody:last');
      var obj = this; // handle on our "this" object for the callbacks
      var row_type = 1;
      var row;
      var cell;

      // clear any previous data rows
      tbody.empty();

      $.each(data.docs, function(i, record) {
        var is_first_column = true;
        row = $('<tr class="DwCRecordsTable_ResultRow"></tr>');

        // tag the row with a special ID attribute
        if (obj.idField in record) {
          row.attr('dwcrecordstable_recordid', record[obj.idField].toString());
        }

        // if the row should be clickable
        if (obj.rowClick != null) {
          // set special classes
          row.addClass('DwCRecordsTable_ClickableObject');
          row.addClass('DwCRecordsTable_ClickableRow');
          // bind the click function
          row.click(function() {
            obj.rowClick(obj, $(this));
          });
        }

        // add alternating classes to even/odd rows
        row.addClass('DwCRecordsTable_ResultRow' + row_type);

        // if we wish to display row numbers
        if (obj.displayRowNums) {
          cell = $('<td class="DwCRecordsTable_Value"></td>');
          // add a special css class to identify it as a numbering cell
          cell.addClass('DwCRecordsTable_RowNumValue');
          // add a special css class to identify it as a first-column cell
          cell.addClass('DwCRecordsTable_FirstColumnValue');
          is_first_column = false;
          cell.text((i + obj.start + 1).toString());
          row.append(cell);
        }

        // loop through each of the defined fields
        $.each(obj.fields, function(key, field) {
          if (field['display']) {

            var value = record[key];
            // if the field is undefined for this document, display the default value
            if (value == null) {
               // look for field-specific default value.  Fallback to global default
               value = 'defaultValue' in field? field['defaultValue'] : obj.globalDefaultValue;
            }
            cell = $('<td class="DwCRecordsTable_Value"></td>');
            cell.text(value.toString());

            // if this is the first field/column, tag a speciall css class 
            if (!obj.displayRowNums && is_firs_column) {
              cell.addClass('DwCRecordsTable_FirstColumnValue');
            }

            // if the column has a special click function, make the value clickable
            if (obj.fields[key.toString()]['click'] != null) {
              cell.addClass('DwCRecordsTable_ClickableObject');
              cell.addClass('DwCRecordsTable_ClickableValue');
              cell.click(function() {
                return obj.fields[key.toString()]['click'](obj, $(this));
              });
            }

            row.append(cell);
          }
        });

        // tag the last column/cell with a special css class
        cell.addClass('DwCRecordsTable_LastColumnValue');

        // if this is the first row in the table, give it a special class
        if (i == 0) {
          row.addClass('DwCRecordsTable_FirstResultRow');
          // add a special class to each of the first row's cells too
          row.find('td.DwCRecordsTable_Value').addClass('DwCRecordsTable_FirstResultRow_Value');
        }
        tbody.append(row);
        // toggle alternating row classes
        row_type = (row_type % 2) + 1;
      });
      // add a special class to the very last result row
      row.addClass('DwCRecordsTable_LastResultRow');
      row.find('td.DwCRecordsTable_Value').addClass('DwCRecordsTable_LastResultRow_Value');
    }


    // clears the data in the table and updates and
    // repopulates it.  Also updates the paging information
    // in the footer
    this.refreshData = function(data) {
      this.total = parseInt(data.numFound);
      this.populateRecordsData(data);
      this.updateLabel(data);
    }


    // fetch data from the Darwin Core database (if not already cached)
    // cached=false will ignore any existing cache and overwrite it
    this.fetchRecords = function(cached) {
      var url = prepareRecordsUrl(this);
      var obj = this; // object handler for callback functions

      // default value for the 'cached' parameter
      cached = typeof(cached) != 'undefined'? cached : false;

      // clear existing data cache
      if (cached && this.data != null) {
        this.refreshData(this.data);
      }
      // fetch data
      else {
        $.getJSON(url, function(data) {
          // cache the data
          obj.data = data;
          obj.refreshData(data);
        });
      }
    }


    // add a field (column) to the table
    this.addField = function(field_name, field_info) {
      // if we already have field info, merely extend it rather than replace it
      if (field_name in this.fields) {
        this.fields[field_name] = $.extend({}, this.fields[field_name], field_info);
      }
      // if we don't have info for this field, use only what was passed
      else {
        this.fields[field_name] = field_info;
      }
      this.fields_string = prepareFieldsString(this.fields);
      prepareHeader(this);
      this.fetchRecords(false);
      prepareFooter(this);
      this.fields_menu.itemOn('fields', field_info['name']);
    }


    // remove a field (column) from the table
    this.removeField = function(field_name) {
      if (field_name in this.fields) {
        this.fields[field_name]['display'] = false;
        removeFieldHeader(this, field_name);
        this.fields_string = prepareFieldsString(this.fields);
        prepareHeader(this);
        this.fetchRecords(true);
        prepareFooter(this);
        this.fields_menu.itemOff('fields', field_name);
      }
    }


    this.toggleField = function(field_name, field_info) {
      if (field_name in this.fields && this.fields[field_name]['display']) {
        this.removeField(field_name);
      } else {
        this.addField(field_name, field_info);
      }
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
      this.fetchRecords(false);
    }


    // get the next record results page
    this.nextPage = function() {
      if ((this.start + this.count) < this.total) {
        this.start = this.start + this.count;
        this.fetchRecords(false);
      }
    }


    // get the next record results page
    this.prevPage = function() {
      if ((this.start - this.count) >= 0) {
        this.start = this.start - this.count;
        this.fetchRecords(false);
      }
    }


    // get the first record results page
    this.firstPage = function() {
      this.start = 0;
      this.fetchRecords(false);
    }


    // get the next record results page
    this.lastPage = function() {
      if (this.total > this.count) {
        // determine the last page's starting record
        this.start = (this.total - (this.total % this.count));
        this.fetchRecords(false);
      }
    }


  /***************************************************************************
   * DwCRecordsTable - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCRecordsTable - Namespace Declaration
   ***************************************************************************/

  $.fn.DwCRecordsTable = function(options) {
    return this.each(function() {
      (new $.DwCRecordsTable($(this), options));
    });
  };


  /***************************************************************************
   * DwCRecordsTable - Default Options
   ***************************************************************************/

  // default plugin options
  $.DwCRecordsTable.defaultOptions = {
    loadOnInit: true,
    gatewayAddress: "",
    baseDir: "/gateway/",
    query: null,
    start: 0,
    count: 25,
    defaultSortBy: null,
    defaultSortOrder: "asc",
    displayRowNums: true,
    globalDefaultValue: '',
    recordTable: null,
    idField: 'id',
    rowClick: function(records_table, row) {
      // this click will do nothing if there is no associated record table
      if (records_table.recordTable != null) {
        id = row.attr('dwcrecordstable_recordid');
        records_table.recordTable.setRecordID(id, true);
      }
    },
    fields: {
      "id" : {
        "display": true,
        "name": "id",
        "label": "ID"
      },
      "sciName_s": {
        "display": true,
        "name": "sciName_s",
        "label": "Species",
      },
      "lng": {
        "display": true,
        "name": "lng",
        "label":"Longitude",
      },
      "lat": {
        "display": true,
        "name": "lat",
        "label": "Latitude"
      }
    }
  };


  /***************************************************************************
   * DwCContextMenu - Begin Private Functions
   ***************************************************************************/

  // style-ize elements and add table
  function prepareTable(obj) {
    var records_table;

    obj.element.addClass("DwCRecordsTable_Container");
    
    // if the table does not already exist, create it
    records_table = obj.element.find('DwCRecordsTable');
    if (records_table.length ==0) {
      records_table = $('<table cellpadding="0" cellspacing="0" class="DwCRecordsTable"></table>');
      obj.element.append(records_table);
    }
    obj.recordsTable = records_table;
  }

  // ceate / style-ize column headers
  function prepareHeader(obj) {
    var cell;
    var sorter;
    var field;
    // create a column header row if one does not exist
    var row = obj.recordsTable.find(".DwCRecordsTable_HeaderRow");

    if (row.length == 0) {
      // is a <thead></thead> tag defined?
      var thead = obj.recordsTable.find("thead:last");
      if (thead.length == 0) {
        thead = $("<thead></thead>");
        obj.recordsTable.prepend(thead);
      }
      // create a column headers row at the end of the <thead> body
      row = $('<tr class="DwCRecordsTable_HeaderRow"></tr>');
      thead.append(row);
    }

    // clear out the header row (we are going to rebuild it)
    row.empty();

    // create result # column if requested in the options
    if (obj.displayRowNums) {
      cell = $('<th class="DwCRecordsTable_FieldHeader" dwcviews_field="__DwCRowNum">&nbsp;</th>)');
      row.append(cell);
    }

    // create labels for each of fields' column
    $.each(obj.fields, function(name, field) {
      if (field['display']) {
        cell = $('<th class="DwCRecordsTable_FieldHeader"></th>');
        cell.attr('dwcviews_field', name);
        // if no label was specified, just display the raw field name
        var label = 'label' in field? field['label'] : name;
        sorter = $('<div class="DwCRecordsTable_FieldSorter"></div>');
        sorter.attr('dwcviews_field', name);
        sorter.addClass('DwCRecordsTable_ClickableObject');
        sorter.text(label.toString());
        cell.append(sorter);
        row.append(cell);
      }
    });

    // turn on column sorting
    var sorters = row.find(".DwCRecordsTable_FieldSorter");
    // clear any previous click event functions so they don't stack
    sorters.unbind('click');
    // set the click event to sort the corresponding column
    sorters.click(function() {
      obj.sortByField($(this).attr('DwCViews_Field'));
    });
  }

  // remove a field header given the field's name
  function removeFieldHeader(obj, field_name) {
    obj.recordsTable.find('.DwCRecordsTable_FieldHeader[dwcviews_field="' + field_name + '"]').remove();
  }

  // set up the <tbody>, which will house the records data
  function prepareBody(obj) {
    // if no <tbody> was defined in the base HTML,
    // add it to the DwCRecordsTable
    if (obj.recordsTable.find("tbody").length == 0) {
      // if there is a <thead>, insert it after the <tbody> after it
      if (obj.recordsTable.find("thead:last").length == 0) {
        obj.recordsTable.prepend("<tbody></tbody>");
      }
      // otherwise, just stick it at the top of the table
      else {
        obj.recordsTable.find("thead:last").after("<tbody></tbody>");
      }
    }
  }

  // create / style-ize table footer and buttons
  function prepareFooter(obj) {
    // how many columns are in our table?
    var column_count = obj.recordsTable.find(".DwCRecordsTable_HeaderRow:last")[0].cells.length;

    // if a footer row has already been defined
    if (obj.recordsTable.find(".DwCRecordsTable_PagingRow").length == 0) {
      // if there is no table footer, create one
      if (obj.recordsTable.find("tfoot").length == 0) {
        obj.recordsTable.append('<tfoot></tfoot>');
      }
      var tfoot = obj.recordsTable.find("tfoot:last");

      var page_info_html = '<tr class="DwCRecordsTable_PagingRow">'
      page_info_html += '<th class="DwCRecordsTable_PagingButtonContainer"></th>';

      tfoot.append(page_info_html);
    }

    button_container = obj.element.find(".DwCRecordsTable_PagingButtonContainer");
    button_container.attr('colspan', column_count);

    // bind buttons to the paging functions
    if (obj.element.find(".DwCRecordsTable_FirstButton").length == 0) {
      button_container.append('<div class="DwCRecordsTable_FirstButton"></div>');
    }
    first_button = obj.element.find(".DwCRecordsTable_FirstButton");
    first_button.addClass('DwCRecordsTable_ClickableObject');
    first_button.addClass('DwCRecordsTable_FloatButton');
    first_button.click(function() {
      obj.element.data("DwCRecordsTable").firstPage();
    });

    if (obj.element.find(".DwCRecordsTable_PrevButton").length == 0) {
      button_container.append('<div class="DwCRecordsTable_PrevButton"></div>');
    }
    prev_button = obj.element.find(".DwCRecordsTable_PrevButton");
    prev_button.addClass('DwCRecordsTable_ClickableObject');
    prev_button.addClass('DwCRecordsTable_FloatButton');
    prev_button.click(function() {
      obj.element.data("DwCRecordsTable").prevPage();
    });

    if (obj.element.find(".DwCRecordsTable_LastButton").length == 0) {
      button_container.append('<div class="DwCRecordsTable_LastButton"></div>');
    }
    last_button = obj.element.find(".DwCRecordsTable_LastButton");
    last_button.addClass('DwCRecordsTable_ClickableObject');
    last_button.addClass('DwCRecordsTable_FloatButton');
    last_button.click(function() {
      obj.element.data("DwCRecordsTable").lastPage();
    });

    if (obj.element.find(".DwCRecordsTable_NextButton").length == 0) {
      button_container.append('<div class="DwCRecordsTable_NextButton"></div>');
    }
    next_button = obj.element.find(".DwCRecordsTable_NextButton");
    next_button.addClass('DwCRecordsTable_ClickableObject');
    next_button.addClass('DwCRecordsTable_FloatButton');
    next_button.click(function() {
      obj.element.data("DwCRecordsTable").nextPage();
    });

    // Paging Status Container
    if (obj.element.find(".DwCRecordsTable_PagingInfo").length == 0) {
      button_container.append('<div class="DwCRecordsTable_PagingInfo">&nbsp;</div>');
    }

  }

  // fetch a list of available fields from the database records
  function fetchFieldInfo(obj) {
    url = obj.baseURL + "fields";
    $.getJSON(url, function(db_fields) {
      obj.db_fields = db_fields;
      createFieldsMenu(obj, db_fields);
    });
  }


  // prepares the URL and its options
  function prepareRecordsUrl(obj) {
    var params = {};
    if (obj.query) { params["filter"] = obj.query; }
    if (obj.start) { params["start"] = obj.start; }
    if (obj.count) { params["count"] = obj.count; }
    if (obj.fields_string) { params["fields"] = obj.fields_string; }
    if (obj.sortBy) { params["orderby"] = obj.sortBy; }
    if (obj.sortOrder) { params["order"] = obj.sortOrder; }
    return obj.baseURL + "records?" + $.param(params);
  }


  // sort fields by their display order
  function sortFields(fields) {
    var sorted_fields = {};
    var weight_pairs = {};
    var weights = new Array();
    var weight = 0;

    // create an associative array of pairs {display_weight: field_name}
    // and a flat array of just the weights (so that we can sort them)
    $.each(fields, function(name, field) {
      var weight;

      // check to make sure that the field has a display order
      if (field.hasOwnProperty('displayWeight')) {
        weight = field['displayWeight'];
      }
      // if the field does not have a weight, set it arbitrarily high
      else {
        weight = 1000;
      }

      // take care of any conflicts (fields with the same weight)
      // if another field already has this weight, increment by 1 and try again
      while (weights.hasOwnPropert(weight)) {
        weight++;
      }

      weights.push(weight);
      weight_pairs[weight] = name;
    });

    // sort the weight values in order
    weights.sort();

    // now rebuild or array in sorted order
    $.each(weights, function(i, weight) {
      var name = weight_pairs[weight];
      // throw away original display weights and give them even
      // numbers (incrementing by 10)
      weight += 10;
      sorted_fields[name] = fields[name];
      sorted_fields[name]['displayWeight'] = weight;
    });

    // DEBUG //
    $.each(sorted_fields, function(name, field) {
      alert(name + ": " + field['displayWeight']);
    });
    return sorted_fields;

  }

  
  // turns all of the keys in an associative array into a
  // comma-dilineated string
  function prepareFieldsString(fields) {
    var fields_string = "";
    var is_first = true;
    $.each(fields, function(name, field) {
      if (!is_first) {
        fields_string += ",";
      }
      if (field['display']) {
        fields_string += name;
        is_first = false;
      }
    });
    return fields_string;
  }


  function createFieldsMenu(obj, db_fields) {

    // create a common overlay, if none exists
    if (obj.overlay == null) {
      obj.overlay = createMenuOverlay();
    }

    items = {};
    $.each(db_fields, function(name, field_info) {
      var item = {};
      // if the field information contains a label, use it
      if ('label' in field_info && field_info['label'] != '') {
        item['label'] = field_info['label'];
      } else {
      // fallback to the raw fieldname if no label is given
        item['label'] = name;
      }
      // set the click() event to toggle this field's presence in the table
      item['click'] = function() {
        obj.toggleField(name, {"name": name, "display": true}); 
        return false;
      }
      // if the field is in the table currently, set it as "On"
      item['on'] = (name in obj.fields && obj.fields[name]['display']);
      items[name] = item;
    });

    groups = {
      "fields": {
        "label": "Fields",
        "displayLabel": true,
        "items": items
      }
    };

    var menu = $('<div></div>');
    menu.appendTo(document.body);
    menu.DwCContextMenu({
      "groups": groups,
      "overlay": obj.overlay
    });

    obj.fields_menu = menu.data("DwCContextMenu");
  }




  /***************************************************************************
   * DwCMapView
   *
   * Creates a "spatial" (visual map) view of the given records in a
   * Darwin Core database based on the longitude and latitude values
   ***************************************************************************/

  $.DwCMapView = function(element, options) {

    this.options = {};

    // store this object instance in the main element's .data() attribute
    element.data('DwCMapView', this);

    this.init = function(element, option) {

      // merge default options and options passed into the function
      this.options = $.extend({}, $.DwCMapView.defaultOptions, options);

      // create a handle on the DOM element
      this.element = element;

      this.map = null;
      this.recordsTable = this.options.recordsTable;
      this.zoom = this.options.zoom;
      this.mapTypeId = this.options.mapTypeId;
      this.center = this.options.center;

      setupMapView(this);

    }

  
  /***************************************************************************
   * DwCMapView - Begin Public Functions
   ***************************************************************************/

   // this.pubFunction = function() {}


  /***************************************************************************
   * DwCMapView - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCMapView - Namespace Declaration
   ***************************************************************************/

  $.fn.DwCMapView = function(options) {
    return this.each(function() {
      (new $.DwCMapView($(this), options));
    });
  };


  /***************************************************************************
   * DwCMapView - Default Options
   ***************************************************************************/

  $.DwCMapView.defaultOptions = {
    recordsTable: null,
    zoom: 4,
    center: new google.maps.LatLng(0,0),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };


  /***************************************************************************
   * DwCMapView - Begin Private Functions
   ***************************************************************************/

  function setupMapView(obj) {
    var map;
    var map_options = {}

    // style-ize the map container
    obj.element.addClass('DwCMapView_Container');

    // options for the map
    map_options['zoom'] = obj.zoom;
    map_options['center'] = obj.center;
    map_options['mapTypeId'] = obj.mapTypeId;

    // initialize the map
    obj.map = new google.maps.Map(obj.element[0], map_options);

  }




  /***************************************************************************
   * DwCContextMenu
   *
   * The Right-Click menu used to control various DwC objects and functions
   ***************************************************************************/

  $.DwCContextMenu = function(element, options) {

    this.options = {};

    element.data('DwCContextMenu', this);

    this.init = function(element, options) {

      this.options = $.extend({}, $.DwCContextMenu.defaultOptions, options);
      this.element = element;

      this.groups = options.groups

      // we need an overlay to handle off-menu clicks while
      // the menu is active
      this.overlay = options.overlay;
      if (this.overlay == null)
      {
        this.overlay = createMenuOverlay();
      }

      prepareMenu(this);
      bindMenuEvents(this);
      buildMenu(this);
    }


  /***************************************************************************
   * DwCContextMenu - Begin Public Functions
   ***************************************************************************/

    this.showMenu = function(e) {
      var element = this.element;
      var overflow;
      this.element.css({position: 'absolute', left: e.pageX, top: e.pageY});
      this.overlay.css({width: $(document).width() + 'px', height: $(document).height() + 'px'});
      this.overlay.show();
      // use a fade-in animation
      this.element.fadeIn(function() {
        element.show();
      });
    }


    this.hideMenu = function() {
      element = this.element;
      // use a fade-out animation
      element.fadeOut(function() {
        element.hide();
      });
      this.overlay.hide();
    }


    this.itemOn = function(group, item) {
      var item = this.groups[group]['items'][item];
      item['element'].addClass('DwCContextMenu_ItemOn');
      item['on'] = true;
    }


    this.itemOff = function(group, item) {
      var item = this.groups[group]['items'][item];
      item['element'].removeClass('DwCContextMenu_ItemOn');
      item['on'] = false;
    }


    // loop through all items and make sure that they are properly tagged
    // (or not tagged) with the appropriate CSS class
    this.refreshItemsOnOff = function() {
      var obj = this; // handle on object intance for callback functions
      $.each(obj.groups, function(group_name, group) {
        $.each(group['items'], function(item_name, item) {
          if (item['on'] == true) {
            item['element'].addClass('DwCContextMenu_ItemOn');
          } else {
            item['element'].removeClass('DwCContextMenu_ItemOn');
          }
        });
      });
    }


  /***************************************************************************
   * DwCContextMenu - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCContextMenu - Namespace Declaration
   ***************************************************************************/

  $.fn.DwCContextMenu = function(options) {
    return this.each(function() {
      (new $.DwCContextMenu($(this), options));
    });
  };


  /***************************************************************************
   * DwCContextMenu - Default Options
   ***************************************************************************/

  $.DwCContextMenu.defaultOptions = {
    groups: {},
    overlay: null
  };


  /***************************************************************************
   * DwCContextMenu - Begin Private Functions
   ***************************************************************************/

  function prepareMenu(obj) {
    obj.element.addClass('DwCContextMenu');
    obj.element.css('display', 'none');
  }


  function bindMenuEvents(obj) {
    obj.element.bind('contextmenu', function(e) {
      obj.hideMenu();
      return false;
    });

    obj.overlay.bind('contextmenu', function(e) {
      obj.hideMenu();
      return false;
    });

    obj.overlay.click(function(e) {
      obj.hideMenu();
      return false;
    });
  }


  function buildMenu(obj) {
    $.each(obj.groups, function(group_id, group) {
      var group_element = $('<ul class="DwCContextMenu_Group"></ul>');
      group_element.attr('DwCContextMenu_Group', group_id);
      obj.element.append(group_element);

      // display the group header, if requested
      if (!('displayLabel' in group)
          || group['displayLabel'] == true) {
        header = $('<li class="DwCContextMenu_GroupHeader"></li>');
        header.attr('dwccontextmenu_group', group_id);
        header.text(group['label']);
        group_element.append(header);
      }

      // add each of the group's items to the menu
      var is_first = true;
      var last_item_element = null;
      $.each(group['items'], function(item_id, item) {
        var item_element = $('<li class="DwCContextMenu_Item"></li>');
        item_element.attr('dwccontextmenu_item', item_id);
        item_element.text(item['label']);

        // add a special class to the first item in the group
        if (is_first) {
          item_element.addClass('DwCContextMenu_FirstItem');
          is_first = false;
        }

        // if this item is flagged as "on", set a special class
        if ('on' in item && item['on']) {
          item_element.addClass('DwCContextMenu_ItemOn');
        }

        // bind custom click event (if specified)
        if (item['click'] != null) {
          item_element.click(function() {
            obj.hideMenu();
            return item['click']($(this));
          });
        // if no click event was specified, just close the menu
        } else {
          item_element.click(function() {
            obj.hideMenu();
            return false;
          });
        }

        last_item_element = item_element;
        group_element.append(item_element);

        // cache/index a handler to the index to avoid overhead of searching later
        item['element'] = item_element;
      });

      // add a special class to the last item in the group
      last_item_element.addClass('DwCContextMenu_LastItem');

      // cache/index a handler to the group to avoid the overhead of searching later
      group['element'] = group_element;

    });

  }

  function createMenuOverlay() {
    var overlay = $('<div class="DwCMenuOverlay"></div>');
    // set the dimensions of the overlay to cover the entire page
    overlay.css({
      width: $(document).width() + 'px',
      height: $(document).height() + 'px',
      position: 'absolute',
      left: '0px',
      top: '0px',
      backgroundColor: 'transparent',
      display: 'none'
    });

    // keep the overlay hidden until we need it
    overlay.hide();

    overlay.appendTo(document.body);
    return overlay;
  }

})(jQuery);
