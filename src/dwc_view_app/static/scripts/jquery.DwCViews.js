/**
 * @fileoverview jQuery Plugins for browsing the Darwin Core Database
 * @author Corey O. Bowers
 * @version 1.0
 */

/**
 * jsdoc hack for jQuery
 * @class
 * @name $
 */

/*************************************
 *TODO:
 *  recordTable: hover over value shows whole value as popup (like image popup)
 *  recordTable: formatting
 *  recordsTable: cache field option - per field
 *  recordsTable: cache fields option - all fields
 *  recordsTable: special css class for active (single record) row
 *  recordsTable: row number field to be handled in fields array
 *  recordsTable: nPage(n) function - jump to page number "n"
 *  recordsTable: sort by column not working
 *  mapView: search not drawing rectangles
 *  mapView: when tiling, original fitBounds calls an extaneous query
 */

(function($) {

  /**
  * @class A suite of objects for browsing data from a Darwin Core database.
  * @name DwCViews
  * @constructor
  * @param {DwCViewsOptions} options an associative array of various options for the DwCViews object
  * @returns A new DwCViews Plugin Suite object
  */
  $.DwCViews = function(element, options) {

    this.options = {};

    // store this object instance in the main element's .data() attribute
    element.data('DwCViews', this);

    /** @ignore */
    this.init = function(element, option) {

      // merge default options and options passed into the function
      this.options = $.extend({}, $.DwCViews.defaultOptions, options);

      // create a handle on the DOM element
      this.element = element;

      this.fields = this.options.fields;
      /**
       * the associated (internal) DwCSearch object
'      * (most associated plugins will use this as a shared DwCSearch along with its options)
       * @field
       * @name search
       * @memberOf DwCViews
       */
      this.search = this.options.search;
      this.showToolbar = this.options.showToolbar;
      this.fields = this.options.fields;
      /**
       * the associated (internal) DwCRecordTable object
       * @field
       * @name recordTable
       * @memberOf DwCViews
       */
      this.recordTable = this.options.recordTable;
      this.recordTableOptions = this.options.recordTableOptions;
      /**
       * the associated (internal) DwCViewPicker object
       * @field
       * @name viewPicker
       * @memberOf DwCViews
       */
      this.viewPicker = this.options.viewPicker;
      this.viewPickerOptions = this.options.viewPickerOptions;
      /**
       * the associated (internal) DwCRecordsTable object
       * @field
       * @name recordsTable
       * @memberOf DwCViews
       */
      this.recordsTable = this.options.recordsTable;
      this.recordsTableOptions = this.options.recordsTableOptions;
      /**
       * the associated (internal) DwCMapView object
       * @field
       * @name mapView
       * @memberOf DwCViews
       */
      this.mapView = this.options.mapView;
      this.mapViewOptions = this.options.mapViewOptions;
      /**
       * the associated (internal) DwCFieldView object
       * @field
       * @name fieldView
       * @memberOf DwCViews
       */
      this.fieldView = this.options.fieldView;
      this.fieldViewOptions = this.options.fieldViewOptions;
      /**
       * the associated (internal) DwCFieldsView object
       * @field
       * @name fieldsView
       * @memberOf DwCViews
       */
      this.fieldsView = this.options.fieldsView;
      this.fieldsViewOptions = this.options.fieldsViewOptions;
      this.onInit = this.options.onInit;
      /**
       * a user-defined hook, this method is called when DwCViews.search() is called
       * @function
       * @name onSearch
       * @memberOf DwCViews
       */
      this.onSearch = this.options.onSearch;

      views_Initialize(this);

      // set up an onInit/onLoad hook if an onInit function was defined
      if (typeof(this.onInit) == 'function') {
        this.onInit(this);
      }

    }

  
  /***************************************************************************
   * DwCViews - Begin Public Functions
   ***************************************************************************/

 
    /**
    * Issue a query among all DwC plugins contained within this instance
    * @function
    * @name doSearch
    * @memberOf DwCViews
    * @param {string} filter a lucene-compatible query
    */
    this.doSearch = function(filter) {
      // the search term will become the filter for the shared search object
      this.search.filter = filter;

      // make sure that the search bar displays the proper filter
      if (this.searchBox) { this.searchBox.attr('value', filter); }

      // if the dwc_views object has a records table
      if (this.recordsTable && this.recordsTable.search == this.search) {
        // reset the paging state back to the first page
        this.recordsTable.resetPagingState();
        // fetch a new set of records with the new filter
        this.recordsTable.fetchRecords(false);
      }

      // likewise if the dwc_views object has a map view
      if (this.mapView && this.mapView.search == this.search) {
        // load a new set of markers with the new filter
        this.mapView.Search();
      }

      // if the dwc_views object has a resident field view
      if (this.fieldView && this.fieldView.search == this.search) {
        // refresh the field data imposing the new filter
        this.fieldView.refresh(false, false);
      }

      // if a search event hook was specified, call it
      if (typeof(this.onSearch) == 'function') {
        this.onSearch(this, filter);
      }
    }



  /***************************************************************************
   * DwCViews - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCViews - Namespace Declaration
   ***************************************************************************/
  
  /** @ignore */
  $.fn.DwCViews = function(options) {
    return this.each(function() {
      (new $.DwCViews($(this), options));
    });
  };


  /***************************************************************************
   * DwCViews - Begin Private Functions
   ***************************************************************************/

  /** @private */
  function views_Initialize(obj) {
    var toolbar;
    var search_box;
    var search_button;
    var record_table;
    var field_view;
    var view_picker;
    var records_table;
    var map_view;
    var fields_view;
    var search_options;

    // style-ize the parent element
    obj.element.addClass('DwCViews');

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
    // make a quick handler for the search box
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
            obj.recordTableOptions['gatewayAddress'] = obj.search.gatewayAddress;
          }
          // if no baseDir was supplied in the options, use the DwCViews baseDir
          if (obj.recordTableOptions['baseDir'] == null) {
            obj.recordTableOptions['baseDir'] = obj.search.baseDir;
          }
        }
        // if no options were passed in, set some defaults
        else {
          // pass along the baseDir and gatewayAddress
          obj.recordTableOptions = {};
          obj.recordTableOptions['gatewayAddress'] = obj.search.gatewayAddress;
          obj.recordTableOptions['baseDir'] = obj.search.baseDir;
          // do not initialize the table on default (wait for a proper event)
          obj.recordTableOptions['loadOnInit'] = false;
          obj.recordTableOptions['hideOnInit'] = true;
        }

        // initialize our record table
        record_table.DwCRecordTable(obj.recordTableOptions);
      }

      obj.recordTable = record_table.data('DwCRecordTable');
    }

    /* add a single field view to the suite (if not already present) */
    if (obj.fieldView == null) {
      field_view = obj.element.find('div.DwCFieldView_Container');
      if (field_view.length == 0) {
        field_view = $('<div class="DwCFieldView_Container"></div>');
        obj.element.append(field_view);
      }

      // if special options were specified, make sure that the the parent
      // gateway server's options are used (unless overridden)
      if (field_view.data('DwCFieldView') == null) {
        if (obj.fieldViewOptions) {
          // if no search or gateway options were supplied, supply them
          if (obj.fieldViewOptions['gatewayAddress'] == null
              && obj.fieldViewOptions['baseDir'] == null
              && obj.fieldViewOptions['search'] == null) {
            obj.fieldViewOptions['search'] = obj.search;
          }
        }
        // if no options were passed in, set some defaults
        else {
          // pass along the baseDir and gatewayAddress
          obj.fieldViewOptions = {};
          obj.fieldViewOptions['search'] = obj.search;
          // do not initialize the table on default (wait for a proper event)
          obj.fieldViewOptions['loadOnInit'] = false;
          obj.fieldViewOptions['hideOnInit'] = true;
        }

        // make sure that the single field view is aware of its parent DwCViews object
        if (obj.fieldViewOptions['dwcviews'] == null) {
          obj.fieldViewOptions['dwcviews'] = obj;
        }

        // initialize our record table
        field_view.DwCFieldView(obj.fieldViewOptions);
      }

      obj.fieldView = field_view.data('DwCFieldView');
    }

    /* add a view picker container before we add the views*/
    if (obj.viewPicker == null) {
      view_picker = obj.element.find('div.DwCViewPicker_Container');
      // if a container does not already exist, add one
      if (view_picker.length == 0) {
        view_picker = $('<div class="DwCViewPicker_Container"></div>');
        obj.element.append(view_picker);
      }
    }


    /* add a records listing table to the suite (if not already present or set to false) */
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
          // if no DwCSearch was specified, pass the global one
          if (obj.recordsTableOptions['search'] == null) {
            obj.recordsTableOptions['search'] = obj.search;
          }
          //if (obj.recordsTableOptions['fields'] == null) {
          //  obj.recordsTableOptions['fields'] = obj.fields;
          //}
        }
        // if no options were passed in, set some defaults
        else {
          // add the shared DwCSearch object
          obj.recordsTableOptions = {'search': obj.search};
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


    /* add a maps view to the suite (if not already present or set to false) */
    if (obj.mapView == null) {
      map_view = obj.element.find('div.DwCMapView_Container');
      if (map_view.length == 0) {
        map_view = $('<div class="DwCMapView_Container"></div>');
        obj.element.append(map_view);
      }

      // if special options were specified, make sure that the the parent
      // gateway server's options are used (unless overridden)
      if (map_view.data('DwCMapView') == null) {
        if (obj.mapViewOptions) {
          // if no DwCSearch was supplied in the options, use the shared object
          if (obj.mapViewOptions['search'] == null) {
            obj.mapViewOptions['search'] = obj.search;
          }
        }
        // if no options were passed in, set some defaults
        else {
          obj.mapViewOptions = {};

          // if we have a single record table, set a default onMarkerClick callback
          // to display a record when you click on its marker
          obj.mapViewOptions['onMarkerClick'] = function(map_view, marker) {
            var record_id = marker.get('recordID');
            if (record_id) {
              obj.recordTable.setRecordID(marker.get('recordID'), true);
            }
          }

          obj.mapViewOptions['search'] = obj.search;
        }

        // initialize our record table
        map_view.DwCMapView(obj.mapViewOptions);
      }

      obj.mapView = map_view.data('DwCMapView');
    }

    /* add a fields view to the suite (if not already present or set to false) */
    if (obj.fieldsView == null) {
      fields_view = obj.element.find('div.DwCFieldsView_Container');
      if (fields_view.length == 0) {
        fields_view = $('<div class="DwCFieldsView_Container"></div>');
        obj.element.append(fields_view);
      }

      // if special options were specified, make sure that the the parent
      // gateway server's options are used (unless overridden)
      if (fields_view.data('DwCFieldsView') == null) {
        if (obj.fieldsViewOptions) {
          // if no DwCFields object was passed, use the default DwCViews object
          if (obj.fieldsViewOptions['fields'] == null) {
            obj.fieldsViewOptions['fields'] = obj.fields;
          }
        }
        // if no options were passed in, give it the global fields
        else {
          obj.fieldsViewOptions = {'fields': obj.fields};
        }

        // make this fields view aware of the records table
        if (obj.recordsTable && obj.fieldViewOptions['recordsTable'] == null) {
          obj.fieldsViewOptions['recordsTable'] = obj.recordsTable;
        }

        // make this fields view aware of the single field view
        if (obj.fieldView && obj.fieldViewOptions['fieldView'] == null) {
          obj.fieldsViewOptions['fieldView'] = obj.fieldView;
        }

        // initialize our record table
        fields_view.DwCFieldsView(obj.fieldsViewOptions);
      }

      obj.fieldsView = fields_view.data('DwCFieldsView');
    }

    // initialize the view picker (if not already initialized)
    // now that we have a handle on all of the views
    if (view_picker.data('DwCViewPicker') == null) {
      // if no options were passed in, set some defaults
      if (!obj.viewPicker) {
        // if no options were passed, create a blank object
        if (!obj.viewPickerOptions) {
          obj.viewPickerOptions = {};
        }

        // if no buttons were specified in the options, add all of our views
        if (!obj.viewPickerOptions.hasOwnProperty('buttons')) {
          obj.viewPickerOptions['buttons'] = {};
        
          // if not already present, give the view picker a handle on each
          // of the various views
          if (obj.recordsTable) {
            obj.viewPickerOptions['buttons']['RecordsTableButton'] = {
              "view": obj.recordsTable
            };
          }
          if (obj.mapView) {
            obj.viewPickerOptions['buttons']['MapViewButton'] = {
              "view": obj.mapView
            };
          }
          if (obj.fieldsView) {
            obj.viewPickerOptions['buttons']['FieldsViewButton'] = {
              "view": obj.fieldsView
            };
          }
        }
      }

      // initialize our view picker
      view_picker.DwCViewPicker(obj.viewPickerOptions);

      // create an object handle on the view picker
      obj.viewPicker = view_picker.data('DwCViewPicker');
    }

    // bind a record search event when the user presses the 'enter' key
    // while the textbox is active
    obj.searchBox.keyup(function(event) {
      if (event.keyCode == 13) {
        obj.doSearch(obj.searchBox.attr('value').trim());
      }
    });

    // set the onClick event to search button
    obj.searchButton.click(function () {
      obj.doSearch(obj.searchBox.attr('value').trim());
    });
  }





  /***************************************************************************
   * DwCSearch - represents a search/query in the Darwin Core Database
   ***************************************************************************/

  /**
   * @class an object that represents a DwC search/filter
   * @name DwCSearch
   * @memberOf DwCViews
   * @constructor
   * @return A new DwCSearch object
   * @param {DwCSearchOptions} options an associative array of parameters
   */
  $.DwCViews.DwCSearch = function(options) {

    this.options = $.extend({}, $.DwCViews.DwCSearch.defaultOptions, options);

    /**
     * the address of the darwin core gateway
     * @field
     * @name gatewayAddress
     * @memberOf DwCViews.DwCSearch
     * @type String
     */
    this.gatewayAddress = this.options.gatewayAddress;
    /**
     * the absolute base path of the darwin core gateway service
     * @field
     * @name baseDir
     * @memberOf DwCViews.DwCSearch
     * @type String
     */
    this.baseDir = this.options.baseDir;
    /**
     * a lucene-compatible query
     * @field
     * @name filter
     * @memberOf DwCViews.DwCSearch
     * @type String
     */
    this.filter = this.options.filter;
    /**
     * a lucene-compatible query that will be appended (with an 'AND')
     * to the filter
     * @field
     * @name filterAddendum
     * @memberOf DwCViews.DwCSearch
     * @type String
     */
    this.filterAddendum = this.options.filterAddendum;
    /**
     * a list of field names to be included in each record
     * (may be either a comma separated list, or an array of strings)
     * @field
     * @name fields
     * @memberOf DwCViews.DwCSearch
     * @type String or Array
     */
    this.fields = this.options.fields;
    /**
     * the starting record index (if count is set)
     * @field
     * @name start
     * @memberOf DwCViews.DwCSearch
     * @type Integer
     */
    this.start = this.options.start;
    /**
     * total number or records to be retrieved by the search
     * @field
     * @name count
     * @memberOf DwCViews.DwCSearch
     * @type Integer
     */
    this.count = this.options.count;
    /**
     * the name of the field by which the record set will be ordered
     * @field
     * @name sortBy
     * @memberOf DwCViews.DwCSearch
     * @type String
     */
    this.sortBy = this.options.sortBy;
    /**
     * sort order (one of either 'asc' or 'desc')
     * @field
     * @name sortOrder
     * @memberOf DwCViews.DwCSearch
     * @type String
     */
    this.sortOrder = this.options.sortOrder;
    /**
     * A function that is called when the DwCSearch retrieves records from the databse
     * @function
     * @name callback
     * @memberOf DwCViews.DwCSearch
     * @param {Object} data the JSON object containing records from the Darwin Core Databse
     */
    this.callback = this.options.callback;
    this.data = null;

    this.baseURL = this.gatewayAddress + this.baseDir;

    /**
     * performs the actual query represented by the DwCSearch object and stores the results in the "data" field
     * @function
     * @name doSearch
     * @memberOf DwCViews.DwCSearch
     * @param {DwCSearchOptions} [options] a DwCSearchOptions associative array that overrides any of the DwCSearch object's internal options
     * @returns {Object} a handle to the asynchronous ajax call used to do the search
     */
    this.doSearch = function(options) {
      var obj = this;
      var callback;
      var ajax_handler;

      var callback_args = typeof(options['callbackArgs']) != 'undefined'? options['callbackArgs'] : {};

      if (typeof(options.callback) == 'function') {
        callback = options.callback;
      } else {
        callback = this.callback;
      }

      // if we are able to use the cache, do so
      if (options.cache && this.data != null) {
        callback(data, callback_args);
        // no actual ajax call, return null
        return null;
      }
      // if not, do an actual query
      else {
        var url = this.prepareRecordsUrl(options);

        /// DEBUG ///
        console.log("Search URL: " + url);

        ajax_handler = $.getJSON(url, function(data) {
          obj.data = data;
          callback(data, callback_args);
        });

        // return a handle to the ajax request
        return ajax_handler;
      }
    }

    /**
     * generates a URL search string represented by the DwCSearch object
     * @function
     * @name prepareRecordsUrl
     * @memberOf DwCViews.DwCSearch
     * @param {DwCSearchOptions} [options] a DwCSearchOptions associative array that overrides any of the DwCSearch object's internal options
     * @returns {String} the actual search URL that will go to the Darwin Core Gateway
     */
    // prepares the URL and its options
    this.prepareRecordsUrl = function(options) {
      var params = {};
      var filter = null;
      var filter_addendum = null;

      // build our URL paramaters, looking first at options, then
      // at the object's internal instance settings
      if (options.filter) { filter = options.filter; }
      else if (this.filter) { filter = this.filter; }
      // if no filter was specified, use the default
      else { filter = "*:*"; }

      if (options.filterAddendum) { filter_addendum = options.filterAddendum; }
      else if (this.filterAddendum) { filter_addendum = this.filterAddendum; }

      // combine our filter and filter addendum (if they exist)
      if (filter_addendum) {
        // combine both the filter and the filter addendum
        params['filter'] = "(" + filter + ") AND (" + filter_addendum + ")";
      }
      // no addendum specified, use only the raw filter
      else {
        params['filter'] = filter;
      }

      // start at which record/page
      if (isNumeric(options.start)) { params["start"] = options.start; }
      else if (isNumeric(this.start)) { params["start"] = this.start; }

      // maximum number of records to return
      if (isNumeric(options.count)) { params["count"] = options.count; }
      else if (isNumeric(this.count)) { params["count"] = this.count; }

      // which fields do we want returned?
      // field_string will take precedence over a field array
      if (options.fieldString) { params["fields"] = options.fieldString; }
      else if (this.fieldString) { params["fields"] = this.fields_string; }
      else if (options.fields) { params["fields"] = this.prepareFieldString(options.fields); }
      else if (this.fields) { params["fields"] = this.prepareFieldString(this.fields); }

      // sort the results by this field
      if (options.sortBy) { params["orderby"] = options.sortBy; }
      else if (this.sortBy) { params["orderby"] = this.sortBy; }

      // sort ascending or descending
      if (options.sortOrder) { params["order"] = options.sortOrder; }
      else if (this.sortOrder) { params["order"] = this.sortOrder; }

      // $.param automagically does url encoding
      return this.baseURL + "records?" + $.param(params);
    }


    /**
     * transforms an array of field names into a comma-deliniated string
     * @function
     * @name prepareFieldString
     * @memberOf DwCViews.DwCSearch
     * @param {Object} fields an array of field names
     */
    this.prepareFieldString = function(fields) {
      var fields_string = ""
      $.each(fields, function(i, field) {
        if (fields_string != "") {
          fields_string += ",";
        }
        fields_string += field;
      });
    }


    /**
     * fetches the number of records associated with the current DwCSearch object (according to its current options)
     * @function
     * @name getRecordsCount
     * @memberOf DwCViews.DwCSearch
     * @param {DwCSearchOptions} search_options an associative array of DwCSearchOptions to be used when determining the record count
     * @param {Function} callback_function a function to be called upon successful retrieval of the record count query.
     *   This function must take 2 arguments:  1. record number {Integer} and 2. callback_options
     * @param {Object} callback_options an object that will be passed as an argument to the supplied callback function
     * @returns {AjaxHandler} a handle to the asynchronous ajax call used to do the search
     */
    this.getRecordsCount = function(search_options, callback_function, callback_options) {
      // default search_options value
      search_options = typeof(search_options) != 'undefined'? search_options : {};

      // default search_options value
      callback_options = typeof(callback_options) != 'undefined'? callback_options : {};

      // preserve the search, but don't actually retreive any records
      search_options['count'] = 0;

      // use the callback to set up an intermediate function
      // that passes the record count to the supplied callback_function
      search_options['callback'] = function (data) {
        callback_function(parseInt(data.numFound), callback_options);
      }

      // run the actual search and return the ajax handler
      return this.doSearch(search_options)
    }

  }


  /**
   * An associative array of options for the DwCSearch object
   * @class
   * @name DwCSearchOptions
   * @memberOf DwCViews
   */
  $.DwCViews.DwCSearch.defaultOptions = {
    /**
     * URL to the server housing DwC Gateway web services
     * @field
     * @type String
     * @memberOf DwCViews.DwCSearchOptions
     * @name gatewayAddress
     * @default ""
     */
    gatewayAddress: "",
    /**
     * base path to the DwC web services on the server specified by gatewayAddress
     * @field
     * @type String
     * @memberOf DwCViews.DwCSearchOptions
     * @name baseDir
     * @default "/gateway/"
     */
    baseDir: "/gateway/",
    /**
     * a lucene-compatible query that will be appended to each of the internally-generated queries
     * @field
     * @type String
     * @memberOf DwCViews.DwCSearchOptions
     * @name filter
     * @default null
     */
    filter: null,
    filterAddendum: null,
    /**
     * comma-separated list of field names to be included in the searche's results
     * @field
     * @type String
     * @memberOf DwCViews.DwCSearchOptions
     * @name fields
     * @default null
     */
    fields: null,
    /**
     * zero-based index representing the starting record in the search
     * @field
     * @type Integer
     * @memberOf DwCViews.DwCSearchOptions
     * @name start
     * @default 0
     */
    start: 0,
    /**
     * number of records to be returned from the search/query
     * @field
     * @type Integer
     * @memberOf DwCViews.DwCSearchOptions
     * @name count
     * @default 25
     */
    count: 25,
    /**
     * name of a single field by which the results will ordered
     * @field
     * @type String
     * @memberOf DwCViews.DwCSearchOptions
     * @name sortBy
     * @default null
     */
    sortBy: null,
    /**
     * sort order that is one of two options: "asc" (ascending) and "desc" (descending)
     * @field
     * @type String
     * @memberOf DwCViews.DwCSearchOptions
     * @name sortOrder
     * @default "asc"
     */
    sortOrder: null,
    callback: function(data) { return data; }
  }





  /***************************************************************************
   * DwCField - represents a single field from the Darwin Core Database
   ***************************************************************************/

  /**
  * @class represents a single field from the Darwin Core Database
  * @name DwCField
  * @memberOf DwCViews
  * @constructor
  * @return A new DwCField object
  * @param {DwCFieldOptions} options an associative array of parameters
  */
  $.DwCViews.DwCField = function(options) {

    this.options = $.extend({}, $.DwCViews.DwCField.defaultOptions, options);

    /**
     * the address of the darwin core gateway
     * @field
     * @name gatewayAddress
     * @memberOf DwCViews.DwCField
     * @type String
     */
    this.gatewayAddress = this.options.gatewayAddress;
    /**
     * the absolute base path of the darwin core gateway service
     * @field
     * @name baseDir
     * @memberOf DwCViews.DwCField
     * @type String
     */
    this.baseDir = this.options.baseDir;
    this.callback = this.options.callback;
    /**
     * the name of the field that the DwCField object currently represents
     * (to changes this, users should call the setField() function instead
     *  of changing it directly)
     * @field
     * @name fieldName
     * @memberOf DwCViews.DwCField
     * @type String
     */
    this.fieldName = this.options.fieldName;
    /**
     * a lucene-compatible query that can be used to limit values and histogram results
     * @field
     * @name filter
     * @memberOf DwCViews.DwCField
     * @type String
     */
    this.filter = this.options.filter;
    /**
     * the actual JSON 'field' response from the Darwin Core Gateway
     * @field
     * @name fieldData
     * @memberOf DwCViews.DwCField
     * @type Object
     */
    this.fieldData = this.options.fieldData;
    this.fieldDataCallback = this.options.fieldDataCallback;
    this.maxFieldValues = this.options.maxFieldValues;
    /**
     * the actual JSON field 'values' response from the Darwin Core Gateway
     * @field
     * @name fieldValues
     * @memberOf DwCViews.DwCField
     * @type Object
     */
    this.fieldValues = this.options.fieldValues;
    this.fieldValuesCallback = this.options.fieldValuesCallback;
    /**
     * the actual JSON field 'histogram' response from the Darwin Core Gateway
     * @field
     * @name fieldHistogram
     * @memberOf DwCViews.DwCField
     * @type Object
     */
    this.fieldHistogram = this.options.fieldHistogram;
    /**
     * The number or value ranges (groupings) to be displayed in the histogram
     * @field
     * @type Integer
     * @memberOf DwCViews.DwCField
     * @name fieldHistogramNBins
     * @default null
     */
    this.fieldHistogramNBins = this.options.fieldHistogramnBins;
    this.fieldHistogramCallback = this.options.fieldHistogramCallback;

    this.baseURL = this.gatewayAddress + this.baseDir;


    /**
     * Fetches various data pertaining to the Darwin Coare field represented by this object
     * @function
     * @name fetchAttributes
     * @memberOf DwCViews.DwCField
     * @param {Function} [callback] a function to be performed once the attributes have been retrieved.  This function should first take this DwCField object, then the actual attributes data as parameters.
     */
    this.fetchAttributes = function(callback) {
      var obj = this;
      var url = this.baseURL + "fields/" + this.fieldName;

      callback = typeof(callback) == 'function'? callback : obj.fieldDataCallback;

      /// DEBUGGING ///
      console.log('Field URL: ' + url);

      $.getJSON(url, function(data) {
        obj.fieldData = data;
        if (typeof(callback) == 'function') {
          callback(this, data);
        }
      });
    }


    /**
     * fetch a list of all unique values for the Darwin Core field represented by this object
     * @function
     * @name fetchValues
     * @memberOf DwCViews.DwCField
     * @param {Function} [callback] a function to be performed once the values have been retrieved.
     *   This function must take 2 arguments: 1. this DwCField object, 2. actual values data.
     */
    this.fetchValues = function(callback) {
      var obj = this;
      var url_attrs = {};
      var url = this.baseURL + "fields/" + this.fieldName + "/values";

      // handle any options passed to the field value
      if (this.maxFieldValues || this.filter) {

        // if a limit on field values has been specified
        if (this.maxFieldValues) {
          url_attrs['count'] = this.maxFieldValues.toString();
        }

        // if a filter has been specified
        if (this.filter) {
          url_attrs['filter'] = this.filter;
        }

        url = url + '?' + $.param(url_attrs);
      }

      callback = typeof(callback) == 'function'? callback : obj.fieldValuesCallback;

      /// DEBUGGING ///
      console.log('Field Values URL: ' + url);

      $.getJSON(url, function(data) {
        obj.fieldValues = data['values'];
        if (typeof(callback) == 'function') {
          callback(this, data);
        }
      });
    }

    /**
     * fetch a histogram representation of all unique values for the Darwin Core field represented by this object
     * @function
     * @name fetchHistogram
     * @memberOf DwCViews.DwCField
     * @param {Function} [callback] a function to be performed once the values have been retrieved.
     *  This must take 2 arguments: 1. this DwCField object, 2. the actual histogram data.
     */
    this.fetchHistogram = function(callback) {
      var obj = this;
      var url_attrs = {};
      var url = this.baseURL + "fields/" + this.fieldName + "/histogram";

      callback = typeof(callback) == 'function'? callback : obj.fieldHistogramCallback;

      // handle any options passed to the field value
      if (this.fieldHistogramNBins || this.filter) {

        // if a limit on field values has been specified
        if (this.fieldHistogramNBins) {
          url_attrs['nbins'] = this.fieldHistogramNBins.toString();
        }

        // if a filter has been specified
        if (this.filter) {
          url_attrs['filter'] = this.filter;
        }

        url = url + '?' + $.param(url_attrs);
      }

      /// DEBUGGING ///
      console.log('Field Histogram URL: ' + url);

      $.getJSON(url, function(data) {
        obj.fieldHistogram = data;
        if (typeof(callback) == 'function') {
          callback(this, data);
        }
      });
    }
  }

  /**
   * An associative array of options for the DwCField object
   * @class
   * @name DwCFieldOptions
   * @memberOf DwCViews
   */
  $.DwCViews.DwCField.defaultOptions = {
    /**
     * The actual name of the field in the Darwin Core Database.  This option is required
     * @field
     * @type String
     * @memberOf DwCViews.DwCFieldOptions
     * @name fieldName
     */
    fieldName: null,
    /**
     * The actual JSON 'field' response from the Darwin Core Gateway
     * @field
     * @type Object
     * @memberOf DwCViews.DwCFieldOptions
     * @name fieldData
     * @default null
     */
    fieldData: null,
    fieldDataCallback: null,
    /**
     * The maximum number of distinct values that will be retrieved when DwCField.fetchValues() is invoked
     * @field
     * @type Integer
     * @memberOf DwCViews.DwCFieldOptions
     * @name maxFieldValues
     * @default null
     */
    maxFieldValues: null,
    /**
     * The actual JSON field 'values' response from the Darwin Core Gateway
     * @field
     * @type Object
     * @memberOf DwCViews.DwCFieldOptions
     * @name fieldValues
     * @default null
     */
    fieldValues: null,
    fieldValuesCallback: null,
    /**
     * The actual JSON field 'histogram' response from the Darwin Core Gateway
     * @field
     * @type Object
     * @memberOf DwCViews.DwCFieldOptions
     * @name fieldHistogram
     * @default null
     */
    fieldHistogram: null,
    /**
     * The number or value ranges (groupings) to be displayed in the histogram
     * @field
     * @type Integer
     * @memberOf DwCViews.DwCFieldOptions
     * @name fieldHistogramNBins
     * @default null
     */
    fieldHistogramNBins: null,
    fieldHistogramCallback: null,
    /**
     * URL to the server housing DwC Gateway web services
     * @field
     * @type String
     * @memberOf DwCViews.DwCFieldOptions
     * @name gatewayAddress
     * @default ""
     */
    gatewayAddress: '',
    /**
     * base path to the DwC web services on the server specified by gatewayAddress
     * @field
     * @type String
     * @memberOf DwCViews.DwCFieldOptions
     * @name baseDir
     * @default "/gateway/"
     */
    baseDir: "/gateway/",
    /**
     * a lucene-compatible query that will be used to limit the value and histogram results
     * @field
     * @type String
     * @memberOf DwCViews.DwCFieldOptions
     * @name filter
     * @default null
     */
    filter: null
  }





  /***************************************************************************
   * DwCFields - represents a listing of fields found within the records
   * of the Darwin Core Database
   ***************************************************************************/

  /**
  * @class represents a listing of fields from the Darwin Core Database
  * @name DwCFields
  * @memberOf DwCViews
  * @constructor
  * @return A new DwCFields object
  * @param {DwCFieldsOptions} options an associative array of parameters
  */
  $.DwCViews.DwCFields = function(options) {

    this.options = $.extend({}, $.DwCViews.DwCFields.defaultOptions, options);

    /**
     * the address of the darwin core gateway
     * @field
     * @name gatewayAddress
     * @memberOf DwCViews.DwCFields
     * @type String
     */
    this.gatewayAddress = this.options.gatewayAddress;
    /**
     * the absolute base path of the darwin core gateway service
     * @field
     * @name baseDir
     * @memberOf DwCViews.DwCFields
     * @type String
     */
    this.baseDir = this.options.baseDir;
    this.callback = this.options.callback;
    this.data = null;

    this.baseURL = this.gatewayAddress + this.baseDir;

    this.fetchFields = function(callback) {
      var obj = this;
      var url = this.baseURL + "fields";

      callback = typeof(callback) == 'function'? callback : obj.callback;

      /// DEBUGGING ///
      console.log('Fields URL: ' + url);

      $.getJSON(url, function(data) {
        obj.data = data;
        if (typeof(callback) == 'function') {
          callback(data);
        }
      });
    }

  }

  /**
   * An associative array of options for the DwCFields object
   * @class
   * @name DwCFieldsOptions
   * @memberOf DwCViews
   */
  $.DwCViews.DwCFields.defaultOptions = {
    /**
     * URL to the server housing DwC Gateway web services
     * @field
     * @type String
     * @memberOf DwCViews.DwCFieldsOptions
     * @name gatewayAddress
     * @default ""
     */
    gatewayAddress: '',
    /**
     * base path to the DwC web services on the server specified by gatewayAddress
     * @field
     * @type String
     * @memberOf DwCViews.DwCFieldsOptions
     * @name baseDir
     * @default "/gateway/"
     */
    baseDir: "/gateway/",
    /**
     * this function will be called every time that this DwCFields
     * fetchFields() function is called
     * @field
     * @type Function
     * @memberOf DwCViews.DwCFieldsOptions
     * @name callback
     * @default null
     * @param [Object] data the actual JSON object returned from the Darwin Core Gateway fields request
     */
    callback: null
  }





  /***************************************************************************
   * DwCViews - Default Options
   ***************************************************************************/

  /**
   * @class various options for the DwCViews object
   * @name DwCViewsOptions
   * @memberOf DwCViews
   */
  $.DwCViews.defaultOptions = {
    /**
     * the DwCViews suite's internal DwCViews.DwCFields object.
     * this object will be used to show which fields are available from the Darwin Core Database
     * @field
     * @name fields
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCViews.DwCFields
     * @default new $.DwCViews.DwCFields()
     */
    fields: new $.DwCViews.DwCFields(),
    /**
     * the DwCViews suite's internal DwCViews.DwCSearch object.
     * this object will be used when any of the internal plugins
     * query records from the Darwin Core database
     * @field
     * @name search
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCViews.DwCSearch
     * @default new $.DwCViews.DwCSearch()
     */
    search: new $.DwCViews.DwCSearch(),
    /**
     * this value will be displayed in the place of a null value
     * for all internal DwC plugins
     * @field
     * @name globalDefautlValue
     * @memberOf DwCViews.DwCViewsOptions
     * @type String
     * @default ''
     */
    globalDefaultValue: '',
    /**
     * show a small toolbar (which includes a search box)
     * @field
     * @name showToolbar
     * @memberOf DwCViews.DwCViewsOptions
     * @type Boolean
     * @default true
     */
    showToolbar: true,
    /**
     * the DwCViews suite's internal DwCRecordTable object.
     * @field
     * @name recordTable
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCRecordTable
     * @default null
     */
    recordTable: null,
    /**
     * options passed to the embedded DwCRecordTable
     * @field
     * @name recordTableOptions
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCRecordTable.DwCRecordTableOptions
     * @default null
     */
    recordTableOptions: null,
    /**
     * the DwCViews suite's internal DwCViewPicker object.
     * this is the icon bar that allows the user to switch between DwC widget views
     * @field
     * @name viewPicker
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCViewPicker
     * @default new $.DwCViewPicker()
     */
    viewPicker: null,
    /**
     * options passed to the embedded DwCViewPicker
     * @field
     * @name viwePickerOptions
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCViewPicker.DwCViewPickerOptions
     * @default null
     */
    viewPickerOptions: null,
    /**
     * the DwCViews suite's internal DwCRecordsTable object.
     * this will display a tabuler list of records from the Darwin Core database
     * @field
     * @name recordsTable
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCRecordsTable
     * @default null
     */
    recordsTable: null,
    /**
     * options passed to the embedded DwCRecordsTable
     * @field
     * @name recordsTableOptions
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCRecordsTable.DwCRecordsTableOptions
     * @default null
     */
    recordsTableOptions: null,
    /**
     * the DwCViews suite's internal DwCMapView object.
     * this will display a spacial (map) view of entries found in the Darwin Core database
     * @field
     * @name mapView
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCMapView
     * @default null
     */
    mapView: null,
    /**
     * options passed to the embedded DwCMapView
     * @field
     * @name mapViewOptions
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCMapView.DwCMapViewOptions
     * @default null
     */
    mapViewOptions: null,
    /**
     * the DwCViews suite's internal DwCFieldView object.
     * this will display information about a single field available the Darwin Core database
     * @field
     * @name fieldView
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCFieldView
     * @default null
     */
    fieldView: null,
    /**
     * options passed to the embedded DwCFieldView
     * @field
     * @name fieldViewOptions
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCFieldView.DwCFieldViewOptions
     * @default null
     */
    fieldViewOptions: null,
    /**
     * the DwCViews suite's internal DwCFieldsView object.
     * this will display a list of fields available within the Darwin Core database
     * @field
     * @name fieldsView
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCFieldsView
     * @default null
     */
    fieldsView: null,
    /**
     * options passed to the embedded DwCFieldsView
     * @field
     * @name fieldsViewOptions
     * @memberOf DwCViews.DwCViewsOptions
     * @type DwCFieldsView.DwCFieldsViewOptions
     * @default null
     */
    fieldsViewOptions: null,
    /**
     * an optional callback function that is automatically invoked after the DwCViews object first initializes itself
     * @function
     * @name onInit
     * @memberOf DwCViews.DwCViewsOptions
     * @type Function
     * @default null
     * @param {DwCViews} this a the object will pass a reference to itself as the only argument
     */
    onInit: null,
    /**
     * an optional callback function that is invoked when the DwCViews.doSearch() function is called
     * @function
     * @name onSearch
     * @memberOf DwCViews.DwCViewsOptions
     * @type Function
     * @default null
     * @param {DwCViews} this a the object will pass a reference to itself
     * @param {String} filter the lucene-compatible conditional clause used in the search
     */
    onSearch: null
  };





  /***************************************************************************
   * DwCRecordTable
   *
   * Part of the DwCViews (Darwin Core Views) Suite
   *
   * A table used to view a single record within a Darwin Core Database
   ***************************************************************************/

  /**
   * @class a plugin that displays fields and values from a single record in the Darwin Core Database
   * @name DwCRecordTable
   * @param {DwCRecordTableOptions} options an associative array of options for the DwCRecordTable
   * @returns a new DwCRecordTable object
   */
  $.DwCRecordTable = function(element, options) {

    this.options = {};

    element.data('DwCRecordTable', this);

    /** @ignore */
    this.init = function(element, option) {

      this.options = $.extend({}, $.DwCRecordTable.defaultOptions, options);

      /**
       * the actual html element containing the DwCRecordtable plugin (usually a &lt;div&gt;)
       * @field
       * @name element
       * @memberOf DwCRecordTable
       * @type Object
       */
      this.element = element;

      // build the base Darwin Core Views URL
      this.baseURL = this.options.gatewayAddress + this.options.baseDir;

      /**
       * the &lt;tbody&gt; html tag of the &lt;table&gt; element used in the DwCRecordtable plugin
       * @field
       * @name tbody
       * @memberOf DwCRecordTable
       * @type Object
       */
      this.tbody = null;
      /**
       * this value will be displayed in the place of a null value
       * @field
       * @name showToolbar
       * @memberOf DwCRecordTable
       * @type String
       */
      this.globalDefaultValue = this.options.globalDefaultValue;
      /**
       * the unique id of the requested Darwin Core record
       * (this field is required)
       * @field
       * @name recordID
       * @memberOf DwCRecordTable
       * @type String
       */
      this.recordID = this.options.recordID;
      /**
       * this option determines which field contains the unique identifier for each record
       * in the Darwin Core Database
       * @field
       * @name idField
       * @memberOf DwCRecordTable
       * @type String
       */
      this.idField = this.options.idField;
      /**
       * the actual &lt;table&gt; html element used in the DwCRecordTable plugin
       * @field
       * @name recordTable
       * @memberOf DwCRecordTable
       * @type Object
       */
      this.recordTable = null;
      /**
       * the actual html element representing the hide/close button
       * @field
       * @name hideButton
       * @memberOf DwCRecordTable
       * @type Object
       */
      this.hideButton = null;
      /**
       * the actual html element representing the search box (typically an &lt;input type="text"&gt; tag)
       * @field
       * @name searchBox
       * @memberOf DwCRecordTable
       * @type Object
       */
      this.searchBox = null;
      /**
       * the actual html element representing the search box (typically a &lt;div&gt; tag)
       * @field
       * @name searchButton
       * @memberOf DwCRecordTable
       * @type Object
       */
      this.searchButton = null;

      // if we want this table to be hidden upon initialization
      if (this.options.hideOnInit) {
        this.element.css('display', 'none');
      }

      recordTable_Initialize(this);

      // go ahead and build the table's data unless otherwise specified
      if (this.recordID != '' && this.options.loadOnInit) {
        recordTable_FetchRecord(this);
      }

    }

  
  /***************************************************************************
   * DwCRecordTable - Begin Public Functions
   ***************************************************************************/

  /**
   * set/change the record being displayed within the DwCRecordTable
   * @function
   * @name setRecordID
   * @memberOf DwCRecordTable
   * @param {String} id the unique identifier (ID) of the record from the Darwin Core database
   * @param {Boolean} [show_table=false] if set to true, the DwCRecordTable will be displayed (unhidden)
   */
  this.setRecordID = function(id, show_table) {
    // default value for show_table (false);
    var show_table = typeof(show_table) != 'undefined'? show_table : false;

    this.recordID = id.toString();
    this.searchBox.attr('value', this.recordID);
    recordTable_FetchRecord(this, show_table);
  }


  /**
   * display/unhide the DwCRecordTable (if it is currently hidden)
   * @function
   * @name show
   * @memberOf DwCRecordTable
   */
  this.show = function() {
    var element = this.element;
    element.slideDown('slow', function() {
      element.show();
    });
  }


  /**
   * hide the DwCRecordTable (if it is currently visible)
   * @function
   * @name hide
   * @memberOf DwCRecordTable
   */
  this.hide = function() {
    var element = this.element;
    element.slideUp('slow', function() {
      element.hide();
    });
  }


  /**
   * populate the DwCRecordTable with the given record data
   * @function
   * @name populateTable
   * @memberOf DwCRecordTable
   * @param {Object} record the actual json data of the record to be displayed
   */
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


  /**
   * determines whether or not the DwCRecordTable is currently being displayed
   * @function
   * @name isHidden
   * @memberOf DwCRecordTable
   * @returns {Boolean} false if the DwCRecordTable is currently hidden, false if it is currently visible
   */
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

  /** @ignore */
  $.fn.DwCRecordTable = function(options) {
    return this.each(function() {
      (new $.DwCRecordTable($(this), options));
    });
  };


  /***************************************************************************
   * DwCRecordTable - Default Options
   ***************************************************************************/

  /**
   * @class
   * @name DwCRecordTableOptions
   * @memberOf DwCRecordTable
   */
  $.DwCRecordTable.defaultOptions = {
    /**
     * this option determines whether or not the DwCRecordTable will query and load
     * data automatically when it is first initialized
     * @field
     * @name loadOnInit
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type Boolean
     * @default true
     */
    loadOnInit: true,
    /**
     * this option determines which field contains the unique identifier for each record
     * in the Darwin Core Database
     * @field
     * @name idField
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type String
     * @default "id"
     */
    idField: "id",
    /**
     * the unique id of the requested Darwin Core record
     * (this field is required)
     * @field
     * @name recordID
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type String
     */
    recordID: '',
    /**
     * the address of the darwin core gateway
     * @field
     * @name gatewayAddress
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type String
     */
    gatewayAddress: "",
    /**
     * the absolute base path of the darwin core gateway service
     * @field
     * @name baseDir
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type String
     */
    baseDir: "/gateway/",
    /**
     * this value will be displayed in the place of a null value
     * @field
     * @name globalDefautlValue
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type String
     * @default ''
     */
    globalDefaultValue: '',
    /**
     * will the DwCRecordTable include a "hide" button
     * @field
     * @name showHideButton
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type Boolean
     * @default true
     */
    showHideButton: true,
    /**
     * should the DwCRecordTable be hidden by default
     * @field
     * @name hideOnInit
     * @memberOf DwCRecordTable.DwCRecordTableOptions
     * @type Boolean
     * @default false
     */
    hideOnInit: false
  };


  /***************************************************************************
   * DwCRecordTable - Begin Private Functions
   ***************************************************************************/

  /** @private */
  function recordTable_Initialize(obj) {
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
      obj.hide();
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


  /** @private */
  function recordTable_FetchRecord(obj, show_table) {
    var url = obj.baseURL + 'record/"' + encodeURI(solrEscapeValue(obj.recordID)) + '"';

    /// DEBUG ///
    console.log("Record URL: " + url);

    // default value for the show_table parameter (false)
    show_table = typeof(show_table) != 'undefined'? show_table : false;

    $.getJSON(url, function(record) {
      obj.populateTable(record);
      // show the table automatically, if requested
      if (show_table && obj.isHidden()) {
        obj.show();
      }
    });
  }





  /***************************************************************************
   * DwCRecordsTable
   *
   * Transforms a (potentially) blank div into a listing of records
   * from a Darwin Core Database
   ***************************************************************************/

  /**
   * @class a tabular listing of records from the Darwin Core database
   * @name DwCRecordsTable
   * @param {DwCRecordsTableOptions} options an associative array of options for the DwCRecordsTable
   * @returns {DwCRecordsTable} a new instance of the DwCRecordsTable
   */
  $.DwCRecordsTable = function(element, options) {

    this.options = {};

    element.data('DwCRecordsTable', this);

    /**
     * @ignore
     * DwCRecordsTable Constructor
     */
    this.init = function(element, options) {

      this.options = $.extend({}, $.DwCRecordsTable.defaultOptions, options);

      var obj = this; // extra handle for callback functions

      /**
       * the actual html element containing the DwCRecordtable plugin (usually a &lt;div&gt;)
       * @field
       * @name element
       * @memberOf DwCRecordsTable
       * @type Object
       */
      this.element = element;
      /**
       * the DwCSearch object that will be used to request records from the Darwin Core Database
       * @field
       * @name search
       * @memberOf DwCRecordsTable
       * @type DwCViews.DwCSearch
       */
      this.search = this.options.search;
      /**
       * the number of records to be shown in on each "page" in the table
       * @field
       * @name recordsPerPage
       * @memberOf DwCRecordsTable
       * @type Integer
       */
      this.recordsPerPage = this.options.recordsPerPage;
      /**
       * the name of the field by which the records will be sorted
       * @field
       * @name sortBy
       * @memberOf DwCRecordsTable
       * @type String
       */
      this.sortBy = this.options.sortBy;
      /**
       * sort order (one of either 'asc' or 'desc')
       * @field
       * @name sortOrder
       * @memberOf DwCRecordsTable
       * @type String
       */
      this.sortOrder = this.options.sortOrder;
      /**
       * an associative array of field names and field metadata
       * @field
       * @name fields
       * @memberOf DwCRecordsTable
       * @type Object
       */
      this.fields = this.options.fields;
      this.fields_string = recordsTable_PrepareFieldsString(this.options.fields);
      /**
       * whether or not to display the record (row) number as an extra column
       * @field
       * @name displayRowNums
       * @memberOf DwCRecordsTable
       * @type Boolean
       */
      this.displayRowNums = this.options.displayRowNums;
      /**
       * this value will be displayed in the place of a null value
       * @field
       * @name globalDefautlValue
       * @memberOf DwCRecordsTable
       * @type String
       */
      this.globalDefaultValue = this.options.globalDefaultValue;
      /**
       * an associated DwCRecordTable that can be used to display a more
       * complete view of a single record (invoked when a row/record is clicked)
       * @field
       * @name recordTable
       * @memberOf DwCRecordsTable
       * @type DwCRecordTable
       */
      this.recordTable = this.options.recordTable;
      /**
       * an associated DwCFieldsView that can be synchronized with the
       * DwCContextMenu field menu when fields/columns are added and removed
       * @field
       * @name fieldsView
       * @memberOf DwCRecordsTable
       * @type DwCRecordTable
       */
      this.fieldsView = this.options.fieldsView;
      /**
       * this option determines which field contains the unique identifier for each record
       * in the Darwin Core Database
       * @field
       * @name idField
       * @memberOf DwCRecordsTable
       * @type String
       */
      this.idField = this.options.idField;
      this.dbFields = null;
       /**
       * the DwCContextMenu used to quickly add/remove fields/columns
       * @field
       * @name fieldsMenu
       * @memberOf DwCRecordsTable
       * @type DwCContextMenu
       */     
      this.fieldsMenu = null;
       /**
       * a transparent, page-sized container used as a clickable overlay for
       * recording when a click is made outside of the DwCContextMenu
       * (usually a &lt;div&gt; html element)
       * @field
       * @name overlay
       * @memberOf DwCRecordsTable
       * @type Object
       */     
      this.overlay = null;

      // some event hooks
      /**
       * this is a callback function that will be automatically invoked when the
       * DwCRecordsTable is first initialized
       * @function
       * @name onInit
       * @memberOf DwCRecordsTable
       * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
       */
      this.onInit = this.options.onInit;
      /**
       * this is a callback function that will be automatically invoked when the
       * doSearch() function is called
       * @function
       * @name onSearch
       * @memberOf DwCRecordsTable
       * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
       * @param {Object} data the actual JSON object returned from a 'records'
       *   call returned by the Darwin Core Gateway
       */
      this.onSearch = this.options.onSearch;
      /**
       * this is a callback function that will be automatically invoked when a row
       * on the DwCRecordsTable is clicked
       * @function
       * @name onRowClick
       * @memberOf DwCRecordsTable
       * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
       * @param {Object} row the actual &lt;tr&gt; html element of the row that was clicked
       */
      this.onRowClick = this.options.onRowClick;

      // internal state variables
      this.start = 0;
      this.total = 0;
      this.data = null;

      // auto fetch data and load it into the table
      if (this.options.loadOnInit) {
        this.fetchRecords(false);
      }

      // add extra elements and style-ize the DwCRecordsTable element
      recordsTable_Initialize(this);
      recordsTable_PrepareHeader(this);
      recordsTable_PrepareBody(this);
      recordsTable_PrepareFooter(this);

      // fetch and cache the available db fields
      recordsTable_FetchFieldInfo(this);

      // bind right-click on field headers to the fields context menu
      this.recordsTable.find(".DwCRecordsTable_HeaderRow").bind('contextmenu', function(e) {
        obj.fieldsMenu.show(e);
        return false;
      });

      // create an "onInit" hook (look to see if an onInit() function has been defined)
      if (typeof(this.onInit) == 'function') {
        obj.onInit(obj);
      }

    };


  /***************************************************************************
   * DwCRecordsTable - Begin Public Functions
   ***************************************************************************/

    /**
     * update/refresh the displayed paging information (records count/page)
     * @function
     * @name updatePagingInfo
     * @memberOf DwCRecordsTable
     * @param {Object} data the JSON data returned from a records query
     */
    this.updatePagingInfo = function(data) {
      var label = "Showing Results: ";
      label += (data.start + 1) + " - ";
      if ((data.start + this.recordsPerPage) > this.total) {
        label += (this.total) + " ";
      } else {
        label += (data.start + this.recordsPerPage) + " ";
      }
      label += " (" + data.numFound + " total)";
      this.element.find(".DwCRecordsTable_PagingInfo").text(label);
    }

    /**
     * resets the paging state back to the defaults
     * (i.e. first page, default sort, ascending order)
     * @function
     * @name resetPagingState
     * @memberOf DwCRecordsTable
     */
    this.resetPagingState = function() {
      this.start = 0;
      this.sortBy = null;
      this.sortOrder = 'asc';
    }

    /**
     * fill the table with records from the Darwin Core database
     * @function
     * @name populateRecordsData
     * @memberOf DwCRecordsTable
     * @param {Object} data the actual 'records' JSON response from the Darwin Core Gateway
     */
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
          row.attr('dwc_recordid', record[obj.idField].toString());
        }

        // if the row should be clickable
        if (obj.onRowClick != null) {
          // set special classes
          row.addClass('DwCRecordsTable_ClickableObject');
          row.addClass('DwCRecordsTable_ClickableRow');
          // bind the click function
          row.click(function() {
            obj.onRowClick(obj, $(this));
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
          cell.text((i + data.start + 1).toString());
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


    /**
     * clear then repopulate all data and paging info in the table with the given data
     * @function
     * @name refreshData
     * @memberOf DwCRecordsTable
     * @param {Object} data JSON records data from the Darwin Core Database
     */
    this.refreshData = function(data) {
      this.total = parseInt(data.numFound);
      this.populateRecordsData(data);
      this.updatePagingInfo(data);
    }


    /**
     * fetch records from the Darwin Core database and populate the table
     * @function
     * @name fetchRecords
     * @memberOf DwCRecordsTable
     * @param {Boolean} [cached=false] if true, will attempt to use the internally cached data instead of fetching it from the database
     */
    this.fetchRecords = function(cached) {
      var obj = this; // object handler for callback functions

      // default value for the 'cached' parameter (false)
      cached = typeof(cached) != 'undefined'? cached : false;

      // use the existing data cache, if requested (and it exists)
      if (cached && this.data != null) {
        this.refreshData(this.data);
        // create a hook for the 'onSearch' event
        if (typeof(obj.onSearch) == 'function') {
          obj.onSearch(obj, obj.data);
        }
      }
      // fetch data
      else {
        this.search.doSearch({
          'fields_string': this.fields_string,
          'start': obj.start,
          'count': obj.recordsPerPage,
          'sortBy': obj.sortBy,
          'sortOrder': obj.sortOrder,
          'callback': function(data) {
            // cache data
            obj.data = data;
            // fill out the table with the new data
            obj.refreshData(data);
            // create a hook for the 'onSearch' event
            if (typeof(obj.onSearch) == 'function') {
              obj.onSearch(obj, data);
            }
          }
        });
      }

    }


    /**
     * add a field (column) to the DwCRecordsTable
     * @function
     * @name addField
     * @memberOf DwCRecordsTable
     * @param {String} field_name the name of the field that you wish to add
     * @param {Object} field_info an associative array of metadata for the given field
     */
    this.addField = function(field_name, field_info) {
      // if we already have field info, merely extend it rather than replace it
      if (field_name in this.fields) {
        this.fields[field_name] = $.extend({}, this.fields[field_name], field_info);
      }
      // if we don't have info for this field, use only what was passed
      else {
        this.fields[field_name] = field_info;
      }
      this.fields_string = recordsTable_PrepareFieldsString(this.fields);
      recordsTable_PrepareHeader(this);
      this.fetchRecords(false);
      recordsTable_PrepareFooter(this);

      // synchronize the fields context menu
      if (this.fieldsMenu) { this.fieldsMenu.itemOn('fields', field_info['name']); }

      // synchronize the fields view
      if (this.fieldsView) { this.fieldsView.syncWithRecordsTable(); }
    }


    /**
     * remove a field (column) from the DwCRecordsView
     * @function
     * @name removeField
     * @memberOf DwCRecordsTable
     * @param {String} field_name the name of the field to be removed
     */
    this.removeField = function(field_name) {
      if (field_name in this.fields) {
        this.fields[field_name]['display'] = false;
        recordsTable_RemoveFieldHeader(this, field_name);
        this.fields_string = recordsTable_PrepareFieldsString(this.fields);
        recordsTable_PrepareHeader(this);
        this.fetchRecords(true);
        recordsTable_PrepareFooter(this);

        // synchronize the fields context menu
        this.fieldsMenu.itemOff('fields', field_name);

        // synchronize the fields view
        if (this.fieldsView) { this.fieldsView.syncWithRecordsTable(); }
      }
    }


    /**
     * toggle the display of a field/column (display if hidden, hide if displayed)
     * @function
     * @name toggleField
     * @memberOf DwCRecordsTable
     * @param {String} field_name the name of the field that you wish toggle
     * @param {Object} field_info an associative array of metadata for the given field
     */
    this.toggleField = function(field_name, field_info) {
      if (field_name in this.fields && this.fields[field_name]['display']) {
        this.removeField(field_name);
      } else {
        this.addField(field_name, field_info);
      }
    }


    /**
     * sort the contents of of the table by the given field.  the current sort order will
     * be used.  if the tale is already sorted by the given field, the sort order will
     * be reversed
     * @function
     * @name sortByField
     * @memberOf DwCRecordsTable
     * @param {String} field_name the name of the field by which the table will be sorted
     */
    this.sortByField = function(field_name) {
      // are we reordering?
      if (this.sortBy == field_name) {
        // toggle search order
        this.sortOrder = (this.sortOrder == "asc"? "desc" : "asc");
      }
      else {
        this.sortBy = field_name;
      }
      this.fetchRecords(false);
    }


    /**
     * display the next page of records (if not already on the last page)
     * @function
     * @name nextPage
     * @memberOf DwCRecordsTable
     */
    this.nextPage = function() {
      if ((this.start + this.recordsPerPage) < this.total) {
        this.start = this.start + this.recordsPerPage;
        this.fetchRecords(false);
      }
    }


    /**
     * display the previous page of records (if not already on the first page)
     * @function
     * @name prevPage
     * @memberOf DwCRecordsTable
     */
    this.prevPage = function() {
      if ((this.start - this.recordsPerPage) >= 0) {
        this.start = this.start - this.recordsPerPage;
        this.fetchRecords(false);
      }
    }

    /**
     * display the first page of records (if not already on the first page)
     * @function
     * @name firstPage
     * @memberOf DwCRecordsTable
     */
    // get the first record results page
    this.firstPage = function() {
      this.start = 0;
      this.fetchRecords(false);
    }


    /**
     * display the last page of records (if not already on the last page)
     * @function
     * @name lastPage
     * @memberOf DwCRecordsTable
     */
    // get the next record results page
    this.lastPage = function() {
      if (this.total > this.recordsPerPage) {
        // determine the last page's starting record
        this.start = (this.total - (this.total % this.recordsPerPage));
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

  /** @ignore */
  $.fn.DwCRecordsTable = function(options) {
    return this.each(function() {
      (new $.DwCRecordsTable($(this), options));
    });
  };


  /***************************************************************************
   * DwCRecordsTable - Default Options
   ***************************************************************************/

  /**
   * @class
   * @name DwCRecordsTableOptions
   * @memberOf DwCRecordsTable
   */
  $.DwCRecordsTable.defaultOptions = {
    /**
     * whether or not the DwCRecordsTable will query and
     * display data upon initialization
     * @field
     * @name loadOnInit
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type Boolean
     * @default true
     */
    loadOnInit: true,
    //fields: new $.DwCViews.DwCFields(),
    /**
     * the DwCSearch object used to query for records from
     * the Darwin Core database
     * @field
     * @name search
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type DwCViews.DwCSearch
     * @default new $.DwCViews.DwCSearch()
     */
    search: new $.DwCViews.DwCSearch(),
    /**
     * the number of records to be shown in on each "page" in the table
     * @field
     * @name recordsPerPage
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type Integer
     * @default 25
     */
    recordsPerPage: 25,
    /**
     * the name of the field by which the records will be sorted
     * @field
     * @name sortBy
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type String
     * @default null
     */
    sortBy: null,
    /**
     * sort order (one of either 'asc' or 'desc')
     * @field
     * @name sortOrder
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type String
     * @default 'asc'
     */
    sortOrder: 'asc',
    /**
     * whether or not to display the record (row) number as an extra column
     * @field
     * @name displayRowNums
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type Boolean
     * @default true
     */
    displayRowNums: true,
    /**
     * this value will be displayed in the place of a null value
     * @field
     * @name globalDefautlValue
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type String
     * @default ''
     */
    globalDefaultValue: '',
    /**
     * an associated DwCRecordTable that can be used to display a more
     * complete view of a single record (invoked when a row/record is clicked)
     * @field
     * @name recordTable
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type DwCRecordTable
     * @default null
     */
    recordTable: null,
    /**
     * an associated DwCFieldsView that can be synchronized with the
     * DwCContextMenu field menu when fields/columns are added and removed
     * @field
     * @name fieldsView
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type DwCRecordTable
     * @default null
     */
    fieldsView: null,
    /**
     * this option determines which field contains the unique identifier for each record
     * in the Darwin Core Database
     * @field
     * @name idField
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type String
     * @default 'id'
     */
    idField: 'id',
    /**
     * this is a callback function that will be automatically invoked when the
     * DwCRecordsTable is first initialized
     * @function
     * @name onInit
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
     * @default null
     */
    onInit: null,
    /**
     * this is a callback function that will be automatically invoked when the
     * doSearch() function is called
     * @function
     * @name onSearch
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
     * @param {Object} data the actual JSON object returned from a 'records'
     *   call returned by the Darwin Core Gateway
     * @default null
     */
    onSearch: null,
    /**
     * this is a callback function that will be automatically invoked when a row
     * on the DwCRecordsTable is clicked
     * @function
     * @name onRowClick
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
     * @param {Object} row the actual &lt;tr&gt; html element of the row that was clicked
     * @default by default, when a row is clicked, an associated DwCRecordTable will be
     *   displayed with the Darwin Core record corresponding to that row
     */
    onRowClick: function(records_table, row) {
      // this click will do nothing if there is no associated record table
      if (records_table.recordTable != null) {
        id = row.attr('dwc_recordid');
        records_table.recordTable.setRecordID(id, true);
      }
    },
    /**
     * an associative array listing all fields that will be displayed as
     * well as metadata to for each of the fields.  each entry shall
     * be in the format:<br /><br />
     * &lt;field&gt;: { "display":&lt;Boolean&gt;, "name":&lt;field_name&gt;, "label":&lt;label&gt; }
     * @field
     * @name fields
     * @memberOf DwCRecordsTable.DwCRecordsTableOptions
     * @type Object
     */
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
   * DwCRecordsTable - Begin Private Functions
   ***************************************************************************/

  // style-ize elements and add table
  /** @private */
  function recordsTable_Initialize(obj) {
    var records_table;

    obj.element.addClass("DwCRecordsTable_Container");
    
    // if the table does not already exist, create it
    records_table = obj.element.find('.DwCRecordsTable:first');
    if (records_table.length == 0) {
      records_table = $('<table cellpadding="0" cellspacing="0" class="DwCRecordsTable"></table>');
      obj.element.append(records_table);
    }
    obj.recordsTable = records_table;
  }

  // ceate / style-ize column headers
  /** @private */
  function recordsTable_PrepareHeader(obj) {
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


  // set up the <tbody>, which will house the records data
  /** @private */
  function recordsTable_PrepareBody(obj) {
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
  /** @private */
  function recordsTable_PrepareFooter(obj) {
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


  // remove a field header given the field's name
  /** @private */
  function recordsTable_RemoveFieldHeader(obj, field_name) {
    obj.recordsTable.find('.DwCRecordsTable_FieldHeader[dwcviews_field="' + field_name + '"]').remove();
  }


  // fetch a list of available fields from the database records
  /** @private */
  function recordsTable_FetchFieldInfo(obj) {
    url = obj.search.gatewayAddress + obj.search.baseDir + "fields";
    $.getJSON(url, function(db_fields) {
      obj.dbFields = db_fields;
      recordsTable_CreateFieldsMenu(obj, db_fields);
    });
  }


  // sort fields by their display order
  /** @private */
  function recordsTable_SortFields(fields) {
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
      while (weights.hasOwnProperty(weight)) {
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
  /** @private */
  function recordsTable_PrepareFieldsString(fields) {
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


  /** @private */
  function recordsTable_CreateFieldsMenu(obj, db_fields) {
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

    obj.fieldsMenu = menu.data("DwCContextMenu");
  }





  /***************************************************************************
   * DwCMapView
   *
   * Creates a "spatial" (visual map) view of the given records in a
   * Darwin Core database based on the longitude and latitude values
   ***************************************************************************/

  /**
   * @class a "spatial" (visual map) view of the given records in a Darwin Core database based on each entry's long/lat values
   * @name DwCMapView
   * @constructor
   * @param {DwCMapViewOptions} options an associative array of options for the DwCMapView
   * @returns {Object} a new instance of the DwCMapView object
   */
  $.DwCMapView = function(element, options) {

    this.options = {};

    // store this object instance in the main element's .data() attribute
    element.data('DwCMapView', this);

    /** @ignore */
    this.init = function(element, option) {
      var obj = this; // object handle for callback functions
      var search_options = {};

      // merge default options and options passed into the function
      this.options = $.extend({}, $.DwCMapView.defaultOptions, options);

      /**
       * the actual html container that contains the DwCMapView
       * (generally a &lt;div&gt; tag)
       * @field
       * @name element
       * @memberOf DwCMapView
       * @type Object
       */
      this.element = element;

      /**
       * the actual google.maps.map api v3 object
       * @field
       * @name map
       * @memberof DwCMapView
       * @type google.maps.map
       */
      this.map = null;
      /**
       * the actual html (DOM) element serving as the marker button
       * (i.e. the button that turns marker display on and off)
       * @field
       * @name markerButton
       * @memberOf DwCMapView
       * @type Object
       */
      this.markerButton = null;
      /**
       * the actual html (DOM) element serving as the grid button
       * (i.e. the button that turns the grid view on and off)
       * @field
       * @name gridButton
       * @memberOf DwCMapView
       * @type Object
       */
      this.gridButton = null;
      /**
       * the associated (internal) DwCSearch object that will
       * be used to query records from the Darwin Core database
       * @field
       * @name search
       * @memberOf DwCMapView
       * @type DwCViews.DwCSearch
       */
      this.search = this.options.search;
      /**
       * the name of the field containing the unique identifier for each record
       * in the Darwin Core Database
       * @field
       * @name idField
       * @memberOf DwCMapView
       * @type String
       */
      this.idField = this.options.idField;
      /**
       * the name of the field that contains the latitude
       * information for each record in the Darwin Core Database
       * @field
       * @name latitudeField
       * @memberOf DwCMapView
       * @type String
       */
      this.latitudeField = this.options.latitudeField;
      /**
       * this option determines which field contains the longitude
       * information for each record in the Darwin Core Database
       * @field
       * @name longitudeField
       * @memberOf DwCMapView
       * @type String
       */
      this.longitudeField = this.options.longitudeField;
      /**
       * the name of the field that will act as the
       * title (the popup text) for each marker on the DwCMapView
       * @field
       * @name titleField
       * @memberOf DwCMapView
       * @type String
       */
      this.titleField = this.options.titleField;
      this.recordsTable = this.options.recordsTable;
      /**
       * the current zoom level of the google map
       * @field
       * @name zoom
       * @memberOf DwCMapView
       * @type Integer
       */
      this.zoom = this.options.zoom;
      /**
       * the type of google map to use (i.e. HYBRID, ROADMAP, SATELLITE, or TERRAIN)
       * @field
       * @name mapTypeId
       * @memberOf DwCMapView
       * @type google.maps.MapTypeId
       */
      this.mapTypeId = this.options.mapTypeId;
      /**
       * a google.maps.LatLng (API V3) object representing the coordinates
       * of the center of the map's current display bounds
       * @field
       * @name center
       * @memberOf DwCMapView
       * @type Object
       */
      this.center = this.options.center;
      /**
       * if this option is set to true, the DwCMapView will query for
       * records in smaller, individual groups (based on geographic ranges).
       * the grid view uses this
       * @field
       * @name tileResults
       * @memberOf DwCMapView
       * @type Boolean
       */
      this.tileResults = this.options.tileResults;
      /**
       * an associative array of every google.maps.Marker (API V3)
       * objects to be displayed on the map
       * @field
       * @name markers
       * @memberOf DwCMapView
       * @type Object
       */
      this.markers = this.options.markers;
      /**
       * an array of every google.maps.Rectangle (API V3)
       * objects to be displayed on the map (i.e. in grid view)
       * @field
       * @name rectangles
       * @memberOf DwCMapView
       * @type Object
       */
      this.rectangles = this.options.rectangles;
      this.autoCenter = this.options.autoCenter;
      /**
       * the maximum number of records to be returned by each query
       * (translating into the maximum number of markers to be displayed)
       * If a given query results in more than the maximum number of records,
       * a random sample of those records will be returned
       * @field
       * @name maxRecords
       * @memberOf DwCMapView
       * @type Integer
       */
      this.maxRecords = this.options.maxRecords;
      /**
       * if this option is set to true, a grid will be painted
       * over the map color-coated to show which areas  have a
       * more dense concentration of records associated with that area
       * @field
       * @name showGrid
       * @memberOf DwCMapView
       * @type Boolean
       */
      this.showGrid = this.options.showGrid;
      this.showMarkers = this.options.showMarkers;
      /**
       * when the 'tileResults' field is set to true, this determines
       * how many equally-sized rows (latitudinal groupings) will be used
       * @field
       * @name tileRows
       * @memberOf DwCMapView
       * @type Integer
       */
      this.tileRows = this.options.tileRows;
      /**
       * when the 'tileResults' field is set to true, this determines
       * how many equally-sized columns (longitudinal groupings) will be used
       * @field
       * @name tileCols
       * @memberOf DwCMapView
       * @type Integer
       */
      this.tileCols = this.options.tileCols;
      /**
       * when the 'tileResults' field is set to true, this determines
       * the maximum number of records/markers that will be displayed
       * within each tile (if the total count is higher than the maximum
       * number, a random subset will be used)
       * @field
       * @name maxMarkersPerTile
       * @memberOf DwCMapView
       * @type Integer
       */
      this.maxMarkersPerTile = this.options.maxMarkersPerTile;
      /**
       * the opacity of each rectangle's colored overlay
       * (value from 0 - 1)
       * @field
       * @name rectangleOpacity
       * @memberOf DwCMapView
       * @type Decimal
       */
      this.rectangleOpacity = this.options.tileOpacity;
      /**
       * the width of each rectangle's border
       * @field
       * @name rectangleStrokeWeight
       * @memberOf DwCMapView
       * @type Integer
       */
      this.rectangleStrokeWeight = this.options.rectangleStrokeWeight;
      /**
       * the color of each rectangle's border
       * @field
       * @name rectangleStrokeColor
       * @memberOf DwCMapView
       * @type String
       */
      this.rectangleStrokeColor = this.options.rectangleStrokeColor;
      /**
       * the opacity of each rectangle's border lines
       * (value between 0 - 1)
       * @field
       * @name rectangleStrokeOpacity
       * @memberOf DwCMapView
       * @type Decimal
       */
      this.rectangleStrokeOpacity = this.options.rectangleStrokeOpacity;

      // some event hook handlers
      /**
       * an optional callback function that is automatically invoked after
       * the DwCMapView object first initializes itself
       * @function
       * @name onInit
       * @memberOf DwCMapView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself as the only argument
       */
      this.onInit = this.options.onInit;
      /**
       * an optional callback function that is automatically invoked
       * when a marker is clicked
       * @function
       * @name onMarkerClick
       * @memberOf DwCMapView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself
       * @param {DwCViews} marker the google.maps.Marker object that was clicked
       */
      this.onMarkerClick = this.options.onMarkerClick;
      /**
       * an optional callback function that is automatically invoked
       * when a rectangle (or grid cell) is clicked
       * @function
       * @name onRectangleClick
       * @memberOf DwCMapView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself
       * @param {DwCViews} marker the google.maps.Rectangle object that was clicked
       */
      this.onRectangleClick = this.options.onRectangleClick;
      /**
       * an optional callback function that is automatically invoked
       * when a rectangle (or grid cell) is double-clicked
       * @function
       * @name onRectangleDoubleClick
       * @memberOf DwCMapView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself
       * @param {DwCViews} marker the google.maps.Rectangle object that was double-clicked
       */
      this.onRectangleDoubleClick = this.options.onRectangleDoubleClick;
      /**
       * an optional callback function that is automatically invoked after
       * the DwCMapView Search() function is called
       * @function
       * @name onSearch
       * @memberOf DwCMapView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself as the only argument
       */
      this.onSearch = this.options.onSearch;
      /**
       * an optional callback function that is automatically invoked when the
       * the DwCMapView Show() function is called
       * @function
       * @name onShow
       * @memberOf DwCMapView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself as the only argument
       */
      this.onShow = this.options.onShow;
      /**
       * an optional callback function that is automatically invoked when the
       * the DwCMapView Hide() function is called
       * @function
       * @name onHide
       * @memberOf DwCMapView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself as the only argument
       */
      this.onHide = this.options.onHide;

      // some internal variable used to help set and maintain map state
      this.totalMapRecords = 0; // total markers on the entire map
      this.totalBoundsRecords = 0; // total markers on just the curren map bounds
      this.lastKnownWidth = 0; // last known map container width
      this.lastKnownHeight = 0; // last known map container height
      this.lastKnownBounds = null; // the last known LatLngBounds map extent
      this.lastKnownCenter = null; // last known map center
      this.lastKnownZoom = 0; // last known zoom value of the map
      this.fitBounds = false;
      this.markerBounds = null; // used to fit the map to a new set of markers
      this.dynamicMarkers = false;
      this.dynamicMarkerEventHandler = null; // used when turning dynamic markers on and off 
      // filter addendum that culls records with invalid lat/lng values
      this.defaultFilterAddendum = solrEscapeValue(this.latitudeField) + ':[\-90 TO 90] AND ';
      this.defaultFilterAddendum += solrEscapeValue(this.longitudeField) + ':[\-180 TO 180]';

      // allows us to kill an ajax call already in progress
      /**
       * an array of all ajax handlers (typically used when 'tileResults' is
       * set to true).  this can be used to cancel any active/unfinished queries
       * @field
       * @name ajaxHandlers
       * @memberOf DwCMapView
       * @type Array
       */
      this.ajaxHandlers = [];

      mapView_Initialize(this);

      // if a callback function was specified for the onInit event hook
      if (typeof(this.onInit) == 'function') {
        this.onInit(this);
      }

      // perform our search and place markers on the map
      if (this.search) {
        // default filter addendum to cull out invalide lat/lng values
        search_options['filterAddendum'] = this.defaultFilterAddendum;

        // bind the idle function only after the initial search
        search_options['callback'] = function (data, args) {
          // bind the idle function to our actual google maps "map" object
          obj.idleEventhandler = google.maps.event.addListener(obj.map, 'idle', function () {
            obj.restoreState();
          });
        }

        // retreive records and place markers
        this.Search(this.search, search_options);
      }

    }

  
  /***************************************************************************
   * DwCMapView - Begin Public Functions
   ***************************************************************************/

    /**
     * save various size, zoom, and location attributes of the Google Map
     * (this allows the map to be restored to the same attributes later)
     * @function
     * @name saveState
     * @memberOf DwCMapView
     */
    this.saveState = function() {
      this.lastKnownWidth = this.element.width();
      this.lastKnownHeight = this.element.height();
      this.lastKnownBounds = this.map.getBounds();
      this.lastKnownCenter = this.map.getCenter();
      this.lastKnownZoom = this.map.getZoom();
    }



    /**
     * restores the map's last attributes (as recorded by the saveState() function)
     * @function
     * @name restoreState
     * @memberOf DwCMapView
     * @param {Boolean} [force_refresh=false] if true, forces a re-query of all records
     */
    this.restoreState = function(force_refresh) {
      // if the object is not visible (hidden), don't do anything at all
      if (this.isHidden()) {
        return;
      }

      // force_refresh defaults to false
      force_refresh = typeof(force_refresh) != 'undefined'? force_refresh : false;
      
      // resize the map to fit the new view size, if required
      google.maps.event.trigger(this.map, 'resize');

      // if there is a call to fit the map to a new set of markers
      if (this.fitBounds) {
        this.fitBounds = false;
        this.map.fitBounds(this.markerBounds);
      }

      // if the bounds of the map have changed, and dynamic loading has been turned on
      else if (force_refresh || (this.dynamicMarkers && !this.map.getBounds().equals(this.lastKnownBounds))) {
        // dynamically load all markers within the map's current/active bounds
        if (this.showMarkers || this.showGrid) {
          this.loadBounds({
            "bounds": this.map.getBounds(),
            "dynamic": true,
            "tile": false,
            "center": false
          });
        }
      }

      // save the state so that there is no redundant resizing or marker loading
      this.saveState();
    }


    /**
     * returns true if the map view is hidden, false if it is visible
     * @function
     * @name isHidden
     * @memberOf DwCMapView
     */
    this.isHidden = function() {
      return !this.element.is(":visible");
    }


    /**
     * hide the DwCMapView (if it is currently visible)
     * @function
     * @name hide
     * @memberOf DwCMapView
     */
    this.hide = function() {
      // don't do anything if the map view is already hidden
      if (!this.isHidden()) {
        // if a callback function was specified for the onHide() event hook
        if (typeof(this.onHide) == 'function') {
          this.onHide(this);
        }
        this.saveState();
        this.element.hide(0, null, null);
      }
    }


    /**
     * display/unhide the DwCMapView (if it is currently hidden)
     * @function
     * @name show
     * @memberOf DwCMapView
     */
    this.show = function() {
      var obj = this;

      // do nothing if the map view is already visible
      if (this.isHidden()) {
        this.element.show(0, null, function() {
          obj.restoreState();
          // if a callback function was specified for the onShow() event hook
          if (typeof(obj.onShow) == 'function') {
            obj.onShow(obj);
          }
        });
      }
    }


    /**
     * stop any unfinished ajax calls/queries that the DwCMapView object may have pending
     * (this will also prevent their associated callback functions)
     * @function
     * @name cancelAjaxCalls
     * @memberOf DwCMapView
     */
    this.cancelAjaxCalls = function() {
      var obj = this;
      $.each(this.ajaxHandlers, function(i, ajax_handler) {
        if (ajax_handler.readyState != 4) {
          /// DEBUG ///
          console.error("Aborting Ajax Call");
          ajax_handler.abort();
        }
      });
      obj.ajaxHandlers.length = 0;
    }


    /**
     * set appropriate active/inactive CSS classes on the custom map button
     * @function
     * @name refreshButtonStates
     * @memberOf DwCMapView
     */
    this.refreshButtonStates = function() {
      // marker button
      if (this.showMarkers && this.markerButton) {
        this.markerButton.addClass('DwCMapView_ActiveMapButton');
      }
      else {
        this.markerButton.removeClass('DwCMapView_ActiveMapButton');
      }

      // grid button
      if (this.showGrid && this.gridButton) {
        this.gridButton.addClass('DwCMapView_ActiveMapButton');
      }
      else {
        this.gridButton.removeClass('DwCMapView_ActiveMapButton');
      }
    }


    /**
     * alters the settings so that the map will only display markers
     * @function
     * @name displayMarkers
     * @memberOf DwCMapView
     * @param {Boolean} [show=true] set to false if you wish to prevent/delay the markers from actually being shown
     */
    this.displayMarkers = function(show) {
      var original_state = this.showMarkers;
      this.showMarkers = typeof(show) != 'undefined'? display : true;
      // re-query/re-draw if necessary
      if (this.showMarkers != original_state)  {
        this.reload();
      }
      this.refreshButtonStates();
    }


    /**
     * alters the settings so that the map will only display the grid
     * @function
     * @name displayGrid
     * @memberOf DwCMapView
     * @param {Boolean} [show=true] set to false if you wish to prevent/delay the grid from actually being shown
     */
    this.displayGrid = function(display) {
      display = typeof(display) != 'undefined'? display : true;

      // this SHOULD be unnecessary, showGrid = true should automagically tile results
      if (display) { this.tileResults = true; }
      var original_state = this.showGrid;
      this.showGrid = typeof(display) != 'undefined'? display : true;
      // re-query/re-draw if necessary
      if (this.showGrid != original_state)  {
        this.reload();
      }
      this.refreshButtonStates();
    }


    /**
     * creates a google.maps.Marker object and adds it to the internal Google Map
     * @function
     * @name addMarker
     * @memberOf DwCMapView
     * @param {String} key a string indentifier for this marker (may be used to access this marker)
     * @param {Object} [marker_options] a google.maps.MarkerOptions object as defined in the Google Maps V3 API
     * @param {Object} [marker_values] after the google.maps.Marker object is created, this will be passed to the marker's setValues() function as defined in the Google Maps V3 API
     * @returns {Object} A google.maps.Marker object
     */
    this.addMarker = function(key, marker_options, marker_values) {
      var obj = this;
      var default_marker_options = {};
      var marker;

      default_marker_options['map'] = this.map;

      // if no marker options were given, use the defaults
      if(typeof('marker_options') == 'undefined') {
        marker_options = default_marker_options; 
      // otherwise, extend the default options
      } else {
        marker_options = $.extend({}, default_marker_options, marker_options);
      }

      marker = new google.maps.Marker(marker_options);

      // if any values were passed, add them to the marker's values
      if (marker_values) {
        marker.setValues(marker_values);
      }

      // if a marker click callback function has been defined
      if (typeof(obj.onMarkerClick) == 'function') {
        // set the 'click' event to the callback
        google.maps.event.addListener(marker, 'click', function() {
          obj.onMarkerClick(obj, marker);
        });
      }

      // if the key already exists, unshow/hide the previous marker
      // this marker will replace it
      if (key in this.markers) {
        this.markers[key].setMap(null);
      }

      // add this marker to our array of all markers/overlays
      this.markers[key] = marker;

      return marker;
    }

    /**
     * creates a google.maps.Rectangle object and adds it to the internal Google Map
     * @function
     * @name addRectangle
     * @memberOf DwCMapView
     * @param {Object} bounds google.maps.LatLngBounds object as defined in the Google Maps V3 API
     * @param {Object} [rectangle_options] a google.maps.RectangleOptions object as defined in the Google Maps V3 API
     * @param {Object} [rectangle_values] after the google.maps.Rectangle object is created, this will be passed to the rectangle's setValues() function as defined in the Google Maps V3 API
     * @returns {Object} A google.maps.Rectangle object
     */
    this.addRectangle = function(bounds, rectangle_options, rectangle_values) {
      var obj = this;
      var default_rectangle_options = {}
      var rectangle;
      var rectangle_options;

      // calculate the rectangle color
      var fill_color = mapView_CalculateRectangleColor(this, {
        "rectangleBounds": bounds,
        "mapTotal": this.totalMapRecords,
        'boundsTotal': this.totalBoundsRecords,
        "value": rectangle_values['recordCount']
      });
      
      // default rectangle options
      default_rectangle_options['map'] = this.map;
      default_rectangle_options['bounds'] = bounds;
      default_rectangle_options['strokeWeight'] = this.rectangleStrokeWeight;
      default_rectangle_options['strokeColor'] = this.rectangleStrokeColor;
      default_rectangle_options['strokeOpacity'] = this.rectangleStrokeOpacity;
      default_rectangle_options['fillColor'] = fill_color;
      default_rectangle_options['fillOpacity'] = this.rectangleOpacity;
      if (typeof(this.onRectangleClick) != 'function' &&
        typeof(this.onRectangleDoubleClick) != 'function') {
        default_rectangle_options['clickable'] = false;
      }

      // extend default rectangle options
      if (typeof(rectangle_options) == 'undefined') {
        // if no options were specified, use the defaults
        rectangle_options = default_rectangle_options;
      }
      else {
        // mix/extend the default options with those given
        rectangle_options = $.extend({}, default_rectangle_options, rectangle_options);
      }

      rectangle = new google.maps.Rectangle(rectangle_options);

      // if any special values have been passed to be added to the rectangle
      if (rectangle_values) {
        rectangle.setValues(rectangle_values);
      }

      // add the new rectangle to the collection of overlays
      this.rectangles.push(rectangle);

      // attach an onclick callback function if one has been specified
      if (typeof(this.onRectangleClick) == 'function') {
        google.maps.event.addListener(rectangle, 'click', function() {
          obj.onRectangleClick(obj, rectangle);
        });
      }

      // attach a dblclick callback function if one has been specified
      if (typeof(this.onRectangleDoubleClick) == 'function') {
        google.maps.event.addListener(rectangle, 'dblclick', function() {
          obj.onRectangleDoubleClick(obj, rectangle);
        });
      }

      return rectangle;
    }


    /**
     * set all map markers to visible (everything in the "markers" array)
     * @function
     * @name drawMarkers
     * @memberOf DwCMapView
     */
    this.drawMarkers = function() {
      var obj = this;
      $.each(this.markers, function(key, marker) {
        marker.setMap(obj.map)
      });
    }


    /**
     * set all rectangles (grid segments) to visible (everything in the "rectangles" array
     * @function
     * @name drawRectangles
     * @memberOf DwCMapView
     */
    this.drawRectangles = function() {
      var obj = this;
      $.each(this.rectangles, function(index, rectangle) {
        rectangle.setMap(obj.map)
      });
    }


    /**
     * sets all overlays (markers and rectangles) to visible
     * @function
     * @name drawOverlays
     * @memberOf DwCMapView
     */
    this.drawOverlays = function() {
      this.displayMarkers();
      this.displayRectangles();
    }


    /**
     * remove all markers from the map (everything in the "markers" array)
     * @function
     * @name deleteMarkers
     * @memberOf DwCMapView
     */
    this.deleteMarkers = function() {
      var obj = this;
      $.each(this.markers, function(key, marker) {
        marker.setMap(null)
      });
      this.markers = {};
    }


    /**
     * remove all rectangles from the map (everything in the "rectangles" array)
     * @function
     * @name deleteRectangles
     * @memberOf DwCMapView
     */    this.deleteRectangles = function() {
      var obj = this;
      $.each(this.rectangles, function(index, rectangle) {
        rectangle.setMap(null)
      });
      this.rectangles.length = 0;
    }


    /**
     * remove all overlays from the map (all markers and rectangles)
     * @function
     * @name deleteOverlays
     * @memberOf DwCMapView
     */
    this.deleteOverlays = function() {
      this.deleteMarkers();
      this.deleteRectangles();
    }


    /**
     * query/display markers within a certain area of them ap
     * @function
     * @name loadBounds
     * @memberOf DwCMapView
     * @param {Object} args an associative array of options: TODO
     */
    this.loadBounds = function(args) {
      var obj = this;

      // if no alternative search was supplied, use the object's resident search
      var search = args.hasOwnProperty('search')? args['search'] : this.search; 

      // if no alternative search was supplied, use the object's resident search
      var search_options = args.hasOwnProperty('searchOptions')? args['searchOptions'] : {}; 

      // if no bounds were specified, use the current google map bounds
      var bounds = args.hasOwnProperty('bounds')? args['bounds'] : this.map.getBounds();

      // assume dynamic if not specified
      var dynamic = args.hasOwnProperty('dynamic')? args['dynamic'] : true;

      // tile defaults to true
      var tile = args.hasOwnProperty('tile')? args['tile'] : true;

      // add bounds as a filter addendum
      search_options['filterAddendum'] = mapView_CalculateBoundsAddendum(this, bounds);

      mapView_Search({
        "mapView": obj,
        "search": search,
        "searchOptions": search_options,
        "center": false,
        "tile": tile,
        "dynamic": dynamic,
        "bounds": bounds
      });
    }


    /**
     * takes the results of a DwCSearch and places the corresponding markers on the map
     * @function
     * @name loadMarkers
     * @memberOf DwCMapView
     * @param {Object} data the JSON records data found in the DwCSearch.data object
     * @param {LatLng} center a google.maps.LatLng object as outlined in the Google Maps V3 api
     */
    this.loadMarkers = function(data, center) {
      var obj = this;

      // center default values
      center = typeof(center) != 'undefined'? center : false;

      // if we're going to center on our new result set, create a blank bounds
      if (center) { bounds = new google.maps.LatLngBounds(); }

      $.each(data.docs, function(i, record) {
        var lat;
        var lng;
        var marker_options;
        var marker_values;

        lat = record[obj.latitudeField];
        lng = record[obj.longitudeField];

        // check to make sure that lat and lng are valid numbers
        if (isNumeric(lat) && isNumeric(lng)) {
          lat = parseFloat(lat);
          lng = parseFloat(lng);

          // check to make sure that the lat and lng values have valid ranges
          if (lat <= 90 && lat >= -90 && lng <= 180 && lng >= -180) {

            marker_options = {};
            marker_options['position'] = new google.maps.LatLng(lat, lng);

            // if the title field is present, use its value as the marker title
            if (obj.titleField && obj.titleField in record) {
              marker_options['title'] = record[obj.titleField].toString();
            }

            // add the recordID to the metadata
            marker_values = { 'recordID': record[obj.idField] };

            // add the marker to our mapView and tell it to display itself
            obj.addMarker(record[obj.idField].toString(), marker_options, marker_values);

            // if we are going to center tha map on the new result-set
            if (center) {
              // add the coordinance to be considered when zooming/centering the map
              bounds.extend(marker_options['position']);
            }
          }
          
        }
      });

      // if center == true, center/zoom the map based on the new set of markers
      if (center) {
        // set the bounds (which will be 'restored' when the map view is unhidden)
        this.markerBounds = bounds;
        this.fitBounds = true;
        this.restoreState();
      }
    }


    /**
     * the generic search function for this plugin (non-dynamic, non-tiling)
     * @function
     * @name Search
     * @memberOf DwCMapView
     * @param {DwCSearch} search the JSON records data found in the DwCSearch.data object
     * @param {DwCSearchOptions} search_options an associative array of options for the search
     */
    this.Search = function(search, search_options) {
      // standard args that make this a top-level search
      var args = {
        "mapView": this,
        "center": true,
        "dynamic": false,
        "tile": false,
      };

      // the initial search will encompass the entire map, if we are tiling, we need
      // to pass the bounds for the entire map
      args['bounds'] = new google.maps.LatLngBounds(
        new google.maps.LatLng(-90, -180, true),
        new google.maps.LatLng(90, 180, true)
      );
      // the initial viewport should be to stretch/blow up the whole map to fit
      this.markerBounds = args['bounds'];
      this.fitBounds = true;

      // if optional args were supplied, pass them on
      if (typeof(search) != "undefined") {args['search'] = search}
      if (typeof(search_options) != "undefined") {args['searchOptions'] = search_options}

      mapView_Search(args);
    }


    /**
     * requeries/reloads/redraws all map overlays
     * @function
     * @name reload
     * @memberOf DwCMapView
     */
    this.reload = function() {
      this.restoreState(true);
    }


    /**
     * set/toggle between markers/grid view
     * @function
     * @name toggleDisplayType
     * @memberOf DwCMapView
     * @param {Boolean|null} [toggle_type=null] true = show markers, false = show grid, null = toggle
     */
    this.toggleDisplayType = function(toggle_type) {
      // if no type was specified, toggle
      if (typeof(toggle_type) == 'undefined') {
        if (this.showGrid) { toggle_type = true; }
        else { toggle_type = false; }
      }
      // turn on markers, turn off grid
      if (toggle_type) {
        this.tileResults = false;
        this.showGrid = false;
        this.displayMarkers();
      }
      else {
        this.showMarkers = false;
        this.displayGrid();
      }
    }



  /***************************************************************************
   * DwCMapView - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCMapView - Namespace Declaration
   ***************************************************************************/

  /** @ignore */
  $.fn.DwCMapView = function(options) {
    return this.each(function() {
      (new $.DwCMapView($(this), options));
    });
  };


  /***************************************************************************
   * DwCMapView - Default Options
   ***************************************************************************/

  /**
   * @class an associative array of options for the DwCMapView object
   * @name DwCMapViewOptions
   * @memberOf DwCMapView
   */
  $.DwCMapView.defaultOptions = {
    recordsTable: null,
    /**
     * the associated (internal) DwCSearch object that will
     * be used to query records from the Darwin Core database
     * @field
     * @name search
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type DwCViews.DwCSearch
     * @default null
     */
    search: null,
    /**
     * the name of the field containing the unique identifier for each record
     * in the Darwin Core Database
     * @field
     * @name idField
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type String
     * @default 'id'
     */
    idField: 'id',
    /**
     * this option determines which field contains the latitude
     * information for each record in the Darwin Core Database
     * @field
     * @name latitudeField
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type String
     * @default 'lat'
     */
    latitudeField: 'lat',
    /**
     * this option determines which field contains the longitude
     * information for each record in the Darwin Core Database
     * @field
     * @name longitudeField
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type String
     * @default 'lng'
     */
    longitudeField: 'lng',
    /**
     * the name of the field that will act as the
     * title (the popup text) for each marker on the DwCMapView
     * @field
     * @name titleField
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type String
     * @default 'sciName_s'
     */
    titleField: 'sciName_s',
    /**
     * the maximum number of records to be returned by each query
     * (translating into the maximum number of markers to be displayed)
     * If a given query results in more than the maximum number of records,
     * a random sample of those records will be returned
     * @field
     * @name maxRecords
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Integer
     * @default 1000
     */
    maxRecords: 1000,
    /**
     * an associative array of every google.maps.Marker (API V3)
     * objects to be displayed on the map
     * @field
     * @name tileResults
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Object
     * @default false
     */
    tileResults: false,
    /**
     * an associative array of every google.maps.Marker (API V3)
     * objects to be displayed on the map
     * @field
     * @name markers
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Object
     * @default {}
     */
    markers: {},
    /**
     * an array of every google.maps.Rectangle (API V3)
     * objects to be displayed on the map (i.e. in grid view)
     * @field
     * @name rectangles
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Object
     * @ default []
     */
    rectangles: [],
    /**
     * the current zoom level of the google map
     * @field
     * @name zoom
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Integer
     * @default 0
     */
    zoom: 0,
    /**
     * a google.maps.LatLng (API V3) object representing the coordinates
     * of the center of the map's current display bounds
     * @field
     * @name center
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Object
     * @default new google.maps.LatLng(0,0)
     */
    center: new google.maps.LatLng(0,0),
    autoCenter: true,
    /**
     * the type of google map to use (i.e. HYBRID, ROADMAP, SATELLITE, or TERRAIN)
     * @field
     * @name mapTypeId
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type google.maps.MapTypeId
     * @default google.maps.MapTypeId.HYBRID
     */
    mapTypeId: google.maps.MapTypeId.HYBRID,
    /**
     * if this option is set to true, a grid will be painted
     * over the map color-coated to show which areas  have a
     * more dense concentration of records associated with that area
     * @field
     * @name showGrid
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Boolean
     * @default false
     */
    showGrid: false,
    /**
     * if set to true, individual records will be queried and displayed
     * as markers on the map (according to their latitude/longitude information)
     * @field
     * @name showMarkers
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Boolean
     * @default true
     */
    showMarkers: true,
    /**
     * when the 'tileResults' field is set to true, this determines
     * how many equally-sized rows (latitudinal groupings) will be used
     * @field
     * @name tileRows
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Integer
     * @default 10
     */
    tileRows: 10,
    /**
     * when the 'tileResults' field is set to true, this determines
     * how many equally-sized columns (longitudinal groupings) will be used
     * @field
     * @name tileCols
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Integer
     * @default 10
     */
    tileCols: 10,
    /**
     * when the 'tileResults' field is set to true, this determines
     * the maximum number of records/markers that will be displayed
     * within each tile (if the total count is higher than the maximum
     * number, a random subset will be used)
     * @field
     * @name maxMarkersPerTile
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Integer
     * @default 10
     */
    maxMarkersPerTile: 10,
    /**
     * the opacity of each rectangle's colored overlay
     * (value from 0 - 1)
     * @field
     * @name rectangleOpacity
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Decimal
     * @default 0.25
     */
    rectangleOpacity: 0.25,
    /**
     * the width of each rectangle's border
     * @field
     * @name rectangleStrokeWeight
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Integer
     * @default 1
     */
    rectangleStrokeWeight: 1,
    /**
     * the color of each rectangle's border
     * @field
     * @name rectangleStrokeColor
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type String
     * @default '#000000'
     */
    rectangleStrokeColor: '#000000',
    /**
     * the opacity of each rectangle's border lines
     * (value between 0 - 1)
     * @field
     * @name rectangleStrokeOpacity
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Decimal
     * @default 0.5
     */
    rectangleStrokeOpacity: 0.5,
    /**
     * an optional callback function that is automatically invoked after
     * the DwCMapView object first initializes itself
     * @function
     * @name onInit
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onInit: null,
    /**
     * an optional callback function that is automatically invoked
     * when a marker is clicked
     * @function
     * @name onMarkerClick
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself
     * @param {DwCViews} marker the google.maps.Marker object that was clicked
     * @default null
     */
    onMarkerClick: null,
    //onRectangleClick: function(map_view, rectangle) {
    //  alert("Total Records in Tile: " + rectangle.get('recordCount'));
    //},
    /**
     * an optional callback function that is automatically invoked
     * when a rectangle (or grid cell) is clicked
     * @function
     * @name onRectangleClick
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself
     * @param {DwCViews} marker the google.maps.Rectangle object that was clicked
     * @default null
     */
    onRectangleClick: null,
    /**
     * an optional callback function that is automatically invoked
     * when a rectangle (or grid cell) is double-clicked
     * @function
     * @name onRectangleDoubleClick
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself
     * @param {DwCViews} marker the google.maps.Rectangle object that was double-clicked
     * @default by default, a double click will fit the map to the bounds of the double-clicked rectangle
     */
    onRectangleDoubleClick: function(obj, rectangle) {
      obj.map.fitBounds(rectangle.getBounds());
    },
    onDynamicLoad: null,
    /**
     * an optional callback function that is automatically invoked after
     * the DwCMapView Search() function is called
     * @function
     * @name onSearch
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onSearch: null,
    /**
     * an optional callback function that is automatically invoked when the
     * the DwCMapView Show() function is called
     * @function
     * @name onShow
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onShow: null,
    /**
     * an optional callback function that is automatically invoked when the
     * the DwCMapView Hide() function is called
     * @function
     * @name onHide
     * @memberOf DwCMapView.DwCMapViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onHide: null
  };


  /**
   * @class an associative array of options to be used when tiling
   * @name DwCMapViewTileOptions
   * @memberOf DwCMapView
   */
  $.DwCMapView.defaultTileOptions = {
    /**
     * if set to true, the northern rectangle border (longitude) will be included
     * when querying for records located within the rectangle's bounds
     * @field
     * @name northInclusive
     * @memberOf DwCMapView.DwCMapViewTileOptions
     * @type Boolean
     * @default true
     */
    northInclusive: true,
    /**
     * if set to true, the southern rectangle border (longitude) will be included
     * when querying for records located within the rectangle's bounds
     * @field
     * @name southInclusive
     * @memberOf DwCMapView.DwCMapViewTileOptions
     * @type Boolean
     * @default true
     */
    southInclusive: true,
    /**
     * if set to true, the eastern rectangle border (latitude) will be included
     * when querying for records located within the rectangle's bounds
     * @field
     * @name eastInclusive
     * @memberOf DwCMapView.DwCMapViewTileOptions
     * @type Boolean
     * @default true
     */
    eastInclusive: true,
    /**
     * if set to true, the western rectangle border (latitude) will be included
     * when querying for records located within the rectangle's bounds
     * @field
     * @name westInclusive
     * @memberOf DwCMapView.DwCMapViewTileOptions
     * @type Boolean
     * @default true
     */
    westInclusive: true
  }





  /***************************************************************************
   * DwCMapView - Begin Private Functions
   ***************************************************************************/

  /** @private */
  function mapView_Initialize(obj) {
    var map;
    var map_options = {}
    var button_container;

    // style-ize the map container
    obj.element.addClass('DwCMapView_Container');

    // options for the map
    map_options['zoom'] = obj.zoom;
    map_options['center'] = obj.center;
    map_options['mapTypeId'] = obj.mapTypeId;

    // initialize the map
    obj.map = new google.maps.Map(obj.element[0], map_options);

    // set the map's initial state
    obj.saveState();

    // create some extra buttons for the map

    obj.markerButton = $('<div></div>');
    obj.markerButton.addClass('DwCMapView_MarkerButton');
    obj.markerButton.addClass('DwCMapView_MapButton');
    // set as active if markers are turned on
    if (obj.showMarkers) {
      obj.markerButton.addClass('DwCMapView_ActiveMapButton');
    }

    obj.gridButton = $('<div></div>');
    obj.gridButton.addClass('DwCMapView_GridButton');
    obj.gridButton.addClass('DwCMapView_MapButton');
    if (obj.tileResults && this.showGrid) {
      obj.markerButton.addClass('DwCMapView_ActiveMapButton');
    }

    // stick them all into a common container
    button_container = $('<div></div>');
    button_container.addClass('DwCMapView_ButtonContainer');
    button_container.append(obj.markerButton);
    button_container.append(obj.gridButton);
    obj.element.append(button_container);

    // bind the marker button event
    google.maps.event.addDomListener(obj.markerButton[0], 'click', function() {
      obj.toggleDisplayType(true);
    });
    // bind the grid button event
    google.maps.event.addDomListener(obj.gridButton[0], 'click', function() {
      obj.toggleDisplayType(false);
    });

    // add the button container to the google maps control object
    obj.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(button_container[0]);
  }


  /** @private */
  function mapView_Search(args) {
    var obj = args['mapView'];
    var ajax_handler;
    var callback;
    var callback_args = {};
    
    // set some default values
    var search = args.hasOwnProperty('search')? args['search'] : obj.search;
    var search_options = args.hasOwnProperty('searchOptions')? args['searchOptions'] : {};
    var center = args.hasOwnProperty('center')? args['center'] : true;
    var dynamic = args.hasOwnProperty('dynamic')? args['dynamic'] : false;
    var tile = args.hasOwnProperty('tile')? args['tile'] : false;

    // create options to pass to our actual search function
    callback_args['mapView'] = obj;
    callback_args['dynamic'] = dynamic;
    callback_args['center'] = center;
    callback_args['tile'] = tile;
    if (args.hasOwnProperty('rectangleOptions')) {
      callback_args['rectangleOptions'] = args['rectangleOptions'];
    }

    // add some essential options/overrides
    search_options['fieldString'] = obj.idField + "," + obj.latitudeField + ',' + obj.longitudeField + ',' + obj.titleField;
    search_options['sortBy'] = 'random_1';
    // if a callback function has already been specified, allow it to
    // piggyback off of the search function after it completes
    if (search_options.hasOwnProperty('callback') && typeof(search_options['callback']) == 'function') {
      var callback = search_options['callback'];
      search_options['callback'] = function(data, args) {
        mapView_DoSearch(data, args);
        callback();
      };
    }
    else {
      search_options['callback'] = mapView_DoSearch;
    }
    search_options['callbackArgs'] = callback_args;
    if (obj.showMarkers) {
      search_options['count'] = obj.maxRecords;
    }
    else {
      search_options['count'] = 0;
    }

    // if this is a dynamic or tile call, we expect a bounds.
    // if no bounds were given, get the curernt bounds from the map
    if (dynamic || tile) {
      callback_args['bounds'] = args.hasOwnProperty('bounds')? args['bounds'] : obj.map.getBounds();
      search_options['filterAddendum'] = mapView_CalculateBoundsAddendum(obj, callback_args['bounds']);
    }
    // otherwise, we only pass along bounds if they were explicitely given
    else if (args.hasOwnProperty('bounds')) { callback_args['bounds'] = args['bounds']; }

    // partial (individual tile) queries will not cancel each other out
    if (!tile) {
      // kill any previous dynamic requests first!
      obj.cancelAjaxCalls();
    }

    // perform the actual search
    ajax_handler = search.doSearch(search_options);

    if (dynamic) {
      obj.ajaxHandlers.push(ajax_handler);
    }
  }


  // helper function, used as a callback function in the
  // map view's doSearch() public function
  /** @private */
  function mapView_DoSearch(data, args) {
    var obj = args['mapView'];
    var count = data.numFound;
    var bounds = args.hasOwnProperty('bounds')? args['bounds'] : obj.map.getBounds();

    // center defaults to true
    var center = args.hasOwnProperty('center')? args['center'] : true;

    // if no dynamic option was specified, assume it is false
    var dynamic = args.hasOwnProperty('dynamic')? args['dynamic'] : false;

    // if no 'tile' option was specified, default to false
    var tile = args.hasOwnProperty('tile')? args['tile'] : false;

    // if this is not a tile/dynamic query
    if (!dynamic && !tile) {
      // set the total number or records
      obj.totalMapRecords = count;
      // turn on dynamic loading if the count is greater than the total # of records,
      // otherwise, turn it off
      obj.dynamicMarkers = count > obj.maxRecords;
    }

    if (tile) {
      mapView_DrawTile({
        "mapView": obj,
        "data": data,
        "bounds": bounds
      });
    }
    else {
      // delete all previous overlays
      obj.deleteOverlays();

      // save the number of records in our current bounds alone
      this.totalBoundsRecords = count;

      if (obj.tileResults) {
        mapView_LoadRectangles({
          "mapView": obj,
          "count": data.numFound,
          "bounds": bounds,
          "dynamic": dynamic
        });
      }
      else {
        obj.loadMarkers(data, center);
      }
    }

    // if we have a full-on search, trigger the onSearch hook function
    if (!dynamic && typeof(obj.onSearch) == 'function') {
      obj.onSearch(obj);
    }

  }


  /** @private */
  function mapView_CalculateBoundsAddendum(obj, bounds, tile_options) {
    var filter_addendum = "";
    var northeast = bounds.getNorthEast(); // LatLng top-right corner
    var southwest = bounds.getSouthWest(); // LatLng bottom-left corner
    var max_lat;
    var max_lng;
    var min_lat;
    var min_lng;

    // extend the default tile options with those passed as an argument
    tile_options = $.extend({}, $.DwCMapView.defaultTileOptions, tile_options);

    // figure out the min/max latitude
    if (northeast.lat() > southwest.lat()) {
      max_lat = northeast.lat();
      min_lat = southwest.lat();
    }
    else {
      max_lat = southwest.lat();
      min_lat = northeast.lat();
    }

    // figure out the min/max longitude
    if (northeast.lng() > southwest.lng()) {
      max_lng = northeast.lng();
      min_lng = southwest.lng();
    }
    else {
      max_lng = southwest.lng();
      min_lng = northeast.lng();
    }

    // add a filter clause for the latitude
    filter_addendum += solrEscapeValue(obj.latitudeField);
    filter_addendum += ":[";
    filter_addendum += solrEscapeValue(min_lat);
    filter_addendum += " TO ";
    filter_addendum += solrEscapeValue(max_lat);
    filter_addendum += "]";

    filter_addendum += " AND ";

    // check if the bounds box spans the 180th longitude
    if (northeast.lng() < southwest.lng()) {
      filter_addendum += "(";
      filter_addendum += solrEscapeValue(obj.longitudeField);
      filter_addendum += ":";
      filter_addendum += "[" + solrEscapeValue(max_lng) + " TO 180]";
      filter_addendum += " OR ";
      filter_addendum += solrEscapeValue(obj.longitudeField);
      filter_addendum += ":";
      filter_addendum += "[\-180 TO " + solrEscapeValue(min_lng) + "]";
      filter_addendum += ")";
    }
    else {
      filter_addendum += solrEscapeValue(obj.longitudeField);
      filter_addendum += ":";
      filter_addendum += "[";
      filter_addendum += solrEscapeValue(min_lng);
      filter_addendum += " TO ";
      filter_addendum += solrEscapeValue(max_lng);
      filter_addendum += "]";
    }

    // add a special filter for any side that is exclusive
    // (i.e. should not be included in the result set)
    if (!tile_options['northInclusive']) {
      filter_addendum += " AND NOT " + obj.latitudeField + ":" + northeast.lat();
    }
    if (!tile_options['southInclusive']) {
      filter_addendum += " AND NOT " + obj.latitudeField + ":" + southwest.lat();
    }
    if (!tile_options['eastInclusive']) {
      filter_addendum += " AND NOT " + obj.longitudeField + ":" + northeast.lng();
    }
    if (!tile_options['westInclusive']) {
      filter_addendum += " AND NOT " + obj.longitudeField + ":" + southwest.lng();
    }

    return filter_addendum;
  }

  // draw markers and the rectangle for teh given bounds
  /** @private */
  function mapView_DrawTile(args) {
    // required args
    var obj = args['mapView'];
    var data = args['data'];
    var bounds = args['bounds'];
    var rectangle_options = args.hasOwnProperty('rectangleOptions')? args['rectangleOptions'] : {};
    var rectangle_values = args.hasOwnProperty('rectangleValues')? args['rectangleValues'] : {};
    var rectangle;

    if (obj.showMarkers) {
      obj.loadMarkers(data, false)
    }
    if (obj.showGrid) {
      // add metadata to the rectangle
      if (!rectangle_values.hasOwnProperty('recordCount')) {
        rectangle_values['recordCount'] = data.numFound;
      }
      // add the rectangle
      rectangle = obj.addRectangle(bounds, rectangle_options, rectangle_values);
      rectangle.set('recordCount', data.numFound);
    }
  }


  // queries, loads markers and draws a rectangle over the given bounds
  /** @private */
  function mapView_LoadTile(args) {
    // required options
    var obj = args['mapView'];
    var bounds = args['bounds'];

    var search = args.hasOwnProperty('search')? args['search'] : obj.search;
    var search_options = args.hasOwnProperty('searchOptions')? args['searchOptions'] : {};
    var rectangle_options = args.hasOwnProperty('rectangleOptions')? args['rectangleOptions'] : {};
    var dynamic = args.hasOwnProperty('dynamic')? args['dynamic'] : false;

    search_options['filterAddendum'] = mapView_CalculateBoundsAddendum(obj, bounds, rectangle_options);

    mapView_Search({
      "mapView": obj,
      "search": search,
      "search_options": search_options,
      "bounds": bounds,
      "dynamic": dynamic,
      "center": false,
      "tile": true
    });

  }


  /** @private */
  function mapView_LoadRectangles(args) {
    var obj = args['mapView'];

    var count = args.hasOwnProperty('totalRecords')? args['totalRecords'] : obj.totalMapRecords;
    var bounds = args.hasOwnProperty('bounds')? args['bounds'] : obj.map.getBounds();
    var dynamic = args.hasOwnProperty('dynamic')? args['dynamic'] : false;

    var span = bounds.toSpan();
    var total_width = span.lng();
    var total_height = span.lat();;
    var tile_width, tile_height;
    var north, east, south, west;
    var northeast, southwest;
    var tile_bounds;
    var rectangle;
    var x = 1;

    // width (in degrees) of each tile
    tile_width = total_width / obj.tileCols;

    // height (in degrees) of each tile
    tile_height = total_height / obj.tileRows;

    // loop through each column (left-to-right)
    while (x <= obj.tileCols) {
      var y = 1;
      var rectangle_options = {};
      if (x == 1) {
        west = bounds.getSouthWest().lng();
        rectangle_options['westInclusive'] = true;
      } 
      else {
        west += tile_width;
        rectangle_options['westInclusive'] = false;
      }

      if (x == obj.tileCols) { east = bounds.getNorthEast().lng(); }
      else { east = west + tile_width;}

      // loop through rows, bottom-up
      while (y <= obj.tileRows) {
        if (y == 1) {
          south = bounds.getSouthWest().lat();
          rectangle_options['southInclusive'] = true;
        }
        else {
          south += tile_height;
          rectangle_options['southInclusive'] = false;
        }

        if (y == obj.tileRows) { north = bounds.getNorthEast().lat(); }
        else { north = south + tile_height; }

        // load the tile
        
        southwest = new google.maps.LatLng(south, west);
        northeast = new google.maps.LatLng(north, east);
        tile_bounds = new google.maps.LatLngBounds(southwest, northeast);

        mapView_LoadTile({
         "mapView": obj,
         "bounds": tile_bounds,
         "rectangleOptions": rectangle_options,
         "dynamic": dynamic
        });

        y++;
      }

      x++;
    }
  }


  // takes a rectangle then returns a number representing the
  // perecentage that the are of the rectangle represents of
  // the total map.  All calculations are performed in degrees.
  /** @private */
  function mapView_CalculateRectanglePercent(obj, bounds) {
    var total = 360 * 180; // size of the entire map (in degrees)
    var span = bounds.toSpan();
    var width = span.lng(); // in degrees
    var height = span.lat(); // in height

    return (width * height) / total;
  }


  // takes a plethora of information about the rectange, the map,
  // and its current state and returns an RGB value in hex format
  // representing the relative number of markers in the rectangle
  /** @private */
  function mapView_CalculateRectangleWeight(obj, args) {
    var rectangle_bounds = args['rectangleBounds']; // rectangle coordinates
    var rectangle_value = args['value']; // # of markers in the rectangle
    var map_total = args['mapTotal']; // total # of markers in the map
    var bounds_total = args['boundsTotal']; // total # of markers in the current bounds
    var rectangle_percentage = mapView_CalculateRectanglePercent(obj, rectangle_bounds);

    // in order to score a 1.0 weight, the rectangle's value must be at least
    // scale * rectangle_average.  This value is arbitrary and may be changed.
    var scale = 2;

    var rectangle_average;
    var value;

    // calculate what we will consider an average value (will represent 0 weight of 0.5)
    rectangle_average = map_total * rectangle_percentage;

    // determine rectangle weight based on (rectangle_average * scale) as a weight of 1.0
    value = rectangle_value / (rectangle_average * scale);

    // value cannot exceed 1
    if (value > 1) {  value = 1; }

    return value;
  }


  // takes a whole bunch of variables and magically returns an HTML/CSS-compatible
  // color value
  /** @private */
  function mapView_CalculateRectangleColor(obj, args) {
    var red, green, blue;

    // will return a 
    var rectangle_weight = mapView_CalculateRectangleWeight(obj, args);

    // if the weight is 0, return null (no color)
    if (rectangle_weight == 0) {
      return null;
    }
    else {
      // calculate rgb values
      red = Math.floor(rectangle_weight * 255); // upper bound
      green = Math.floor((1 - rectangle_weight) * 255); // lower bound
      blue = 0; // not used

      // put it in a css-recognizable format
      return  "rgb(" + red + "," + green + "," + blue + ")"; 
    }
  }





  /***************************************************************************
   * DwCFieldView
   *
   * Creates a detailed view for a single field found within the
   * Darwin Core Database
   ***************************************************************************/

  /**
   * @class a detailed view of a single field found within the Darwin Core database
   * @name DwCFieldView
   * @constructor
   * @param {DwCFieldViewOptions} options an associative array of options
   * @returns {DwCFieldView} a new instance of the DwCFieldView object
   */
  $.DwCFieldView = function(element, options) {

    this.options = {};

    // store this object instance in the main element's .data() attribute
    element.data('DwCFieldView', this);

    /** @ignore */
    this.init = function(element, option) {

      // merge default options and options passed into the function
      this.options = $.extend({}, $.DwCFieldView.defaultOptions, options);

      // create a handle on the DOM element
      /**
       * the actual html container that contains the DwCFieldView
       * (generally a &lt;div&gt; tag)
       * @field
       * @name element
       * @memberOf DwCFieldView
       * @type Object
       */
      this.element = element;

      // standard options
      /**
       * the associated (internal) DwCSearch object that will
       * be used to query records from the Darwin Core database
       * @field
       * @name search
       * @memberOf DwCFieldView
       * @type DwCViews.DwCSearch
       */
      this.search = this.options.search;
      /**
       * a handle to the parent DwCViews object
       * (if this DwCFieldView is contained within one)
       * @field
       * @name dwcviews
       * @memberOf DwCFieldView
       * @type DwCViews
       */
      this.dwcviews = this.options.dwcviews;
      /**
       * the address of the darwin core gateway
       * @field
       * @name gatewayAddress
       * @memberOf DwCFieldView
       * @type String
       */
      this.gatewayAddress = this.options.gatewayAddress;
      /**
       * the absolute base path of the darwin core gateway service
       * @field
       * @name baseDir
       * @memberOf DwCFieldView
       * @type String
       */
      this.baseDir = this.options.baseDir;
      /**
       * a lucene-compatible query
       * @field
       * @name filter
       * @memberOf DwCFieldView
       * @type String
       */
      this.filter = this.options.filter;
      /**
       * an associative array of labels for each field's common attributes
       * @field
       * @name attributes
       * @memberOf DwCFieldView
       * @type Object
       */
      this.attributes = this.options.attributes;
      /**
       * the maximum number of distinct values to be displayed
       * in the wordcloud or histogram views
       * (if the total number is greater than the maximum value, each value
       * will be chosen at random)
       * @field
       * @name maxFieldValues
       * @memberOf DwCFieldView
       * @type Integer
       */
      this.maxFieldValues = this.options.maxFieldValues;
      /**
       * the font-size that will be considered the upper bound
       * for a value (i.e. the most frequent value)
       * @field
       * @name wordCloudMaxFontSize
       * @memberOf DwCFieldView
       * @type Decimal
       */
      this.wordCloudMaxFontSize = this.options.wordCloudMaxFontSize;
      /**
       * the font-size that will be considered the lower bound
       * for a value (i.e. the least frequent value)
       * @field
       * @name wordCloudMinFontSize
       * @memberOf DwCFieldView
       * @type Decimal
       */
      this.wordCloudMinFontSize = this.options.wordCloudMinFontSize;
      /**
       * the type of unit to which wordCloudMaxFontSize and wordCloudMinFontSize
       * will refer (i.e. 'pt', 'px', 'em', etc.)
       * @field
       * @name wordCloudFontUnit
       * @memberOf DwCFieldView
       * @type String
       */
      this.wordCloudFontUnit = this.options.wordCloudFontUnit;
      /**
       * the base google charts url (without any options)
       * @field
       * @name googleChartsUrl
       * @memberOf DwCFieldView
       * @type String
       */
      this.googleChartsUrl = this.options.googleChartsUrl;
      /**
       * the title at the top of the histogram
       * @field
       * @name histogramTitle
       * @memberOf DwCFieldView
       * @type String
       */
      this.histogramTitle = this.options.histogramTitle;
      /**
       * all numeric fields' 'value' displays are represented by a
       * bar graph style histogram.  this field represents the number
       * of different bars/bins (groupings) in which the values will
       * be presented   
       * @field
       * @name histogramNBins
       * @memberOf DwCFieldView
       * @type Integer
       */
      this.histogramNBins = this.options.histogramNBins;
      /**
       * the actual size of the histogram to be generated
       * in the format &lt;width&gt;x&lt;height&gt;
       * (i.e. '400x400')
       * @field
       * @name histogramSize
       * @memberOf DwCFieldView
       * @type String
       */
      this.histogramSize = this.options.histogramSize;
      /**
       * the color of each bar in the histogram 
       * @field
       * @name histogramBarColor
       * @memberOf DwCFieldView
       * @type String
       */
      this.histogramBarColor = this.options.histogramBarColor;

      // event hooks
      /**
       * an optional callback function that is automatically invoked after
       * the DwCFieldView object first initializes itself
       * @function
       * @name onInit
       * @memberOf DwCFieldView
       * @type Function
       * @param {DwCFieldView} this the object will pass a reference to itself as the only argument
       */
      this.onInit = this.options.onInit;
      /**
       * an optional callback function that is automatically invoked when the
       * the DwCFieldView Show() function is called
       * @function
       * @name onShow
       * @memberOf DwCFieldView
       * @type Function
       * @param {DwCFieldView} this the object will pass a reference to itself as the only argument
       */
      this.onShow = this.options.onShow;
      /**
       * an optional callback function that is automatically invoked when the
       * the DwCFieldView Hide() function is called
       * @function
       * @name onHide
       * @memberOf DwCFieldView
       * @type Function
       * @param {DwCFieldView} this the object will pass a reference to itself as the only argument
       */
      this.onHide = this.options.onHide;
      /**
       * this callback function is automatically invoked when a user clicks
       * on one of the values in the wordcloud
       * @function
       * @name fieldValueOnClick
       * @memberOf DwCFieldView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself
       * @param {Object} element the actual html (DOM) element that was clicked
       */
      this.fieldValueOnClick = this.options.fieldValueOnClick;

      // other internal state variables
      /**
       * the name of the Darwin Core Field represented by
       * this DwCField object
       * @field
       * @name field
       * @memberOf DwCFieldView
       * @type String
       */
      this.field = null;
      this.fieldTable = null;

      fieldView_init(this);

      // do we want to load the data immediately?
      if (this.fieldName && this.options.loadOnInit) {
        this.populateFieldView();
      }

      // set up an onInit/onLoad hook if an onInit function was defined
      if (typeof(this.onInit) == 'function') {
        this.onInit(this);
      }

      // immediately hide this view, if requested
      if (this.options.hideOnInit) {
        this.element.css('display', 'none');
      }

    }

  
  /***************************************************************************
   * DwCFieldView - Begin Public Functions
   ***************************************************************************/

    /**
     * display/unhide the DwCFieldView (if it is currently hidden)
     * @function
     * @name show
     * @memberOf DwCFieldView
     */
    this.show = function() {
      var element = this.element;
      element.slideDown('slow', function() {
        element.show();
      });
    }


    /**
     * hide the DwCFieldView (if it is currently visible)
     * @function
     * @name hide
     * @memberOf DwCFieldView
     */
    this.hide = function() {
      var element = this.element;
      element.slideUp('slow', function() {
        element.hide();
      });
    }


    /**
     * set/change which field this DwCFieldView will display 
     * @function
     * @name setField
     * @memberOf DwCFieldView
     * @param {String} field_name the name of the field in the Darwin Core Database to be displayed
     * @param {Boolean} [load=true] true if the field data should be retrieved immediately
     * @param {Boolean} [show=true] true if the DwCFieldView be displayed once field information has been loaded? (if not already visible)
     */
    // set/change which field the field view will display
    this.setField = function(field_name, load, show) {
      // we don't need to do anything if it's already set to this field
      if (this.fieldName != field_name) {

        // set some defaults
        load = typeof('load') != 'undefined'? load : true;
        show = typeof('show') != 'undefined'? show: true;

        this.field = null;
        this.fieldName = field_name;

        // load the data immediately (if specified)
        if (load) { this.populateFieldView(); }
        // show the table once the data is loaded (if specified)
        if (show) { this.show(); }
      }
    }


    /**
     * Add a filter to limit the number of values displayed
     * @function
     * @name setFilter
     * @memberOf DwCFieldView
     * @param {String} filter a lucene-compatible conditional statement that will be appended to the values query
     * @param {Boolean} [load=true] true if the filter should be applied immediately
     * @param {Boolean} [show=true] true if the DwCFieldView be displayed once the filter has been applied? (if not already visible)
     */
    // set/change the which field the field view will display
    this.setFilter = function(filter, load, show) {
      // we don't need to do anything if it's already set to this field
      if (this.fieldName != field_name) {

        // set some defaults
        load = typeof('load') != 'undefined'? load : true;
        show = typeof('show') != 'undefined'? show: true;

        this.field = null;
        this.filter = filter;

        // load the data immediately (if specified)
        if (load) { this.populateFieldView(); }
        // show the table once the data is loaded (if specified)
        if (show) { this.show(); }
      }
    }


    /**
     * update the information on the currently displayed field (based on current options and filter)
     * @function
     * @name refresh
     * @memberOf DwCFieldView
     * @param {Boolean} [show=false] true if the DwCFieldView should be displayed (unhidden) once refreshed
     * @param {Boolean} [cached=false] true if the DwCFieldView should attempt to cached data (if present) instead of fetching new data from the Darwin Core database
     */
    this.refresh = function(show, cached) {
      // default argument values
      show = typeof(show) != 'undefined'? show : false;
      cached = typeof(show) != 'undefined'? cached : false;

      // if cache == false, remove any previously cached data
      //alert("REFRESH! Search = " + this.search + "\nfilter = " + this.search.filter + "\nField Name: " + this.fieldName + "\nCached?: " + cached);
      if (!cached) { this.field = null; }

      if (this.fieldName) {
        this.populateFieldView();
        // show the table once the data is loaded (if specified)
        if (show && this.fieldName) { this.show(); }
      }
    }


    /**
     * retrieve information about the currently selected field and use it to populate the DwCFieldView
     * @function
     * @name populateFieldView
     * @memberOf DwCFieldView
     */
    this.populateFieldView = function() {
      var obj = this;

      // if no field name has been set, this function will do nothing
      if (!this.fieldName) { return; }

      // create the DwCField object (if necessary)
      fieldView_BuildField(this);

      // empty the table (to make way for the new data)
      fieldView_EmptyView(this);

      // if there is not yet any field data, we need to
      // retrieve it first
      if (!this.field.fieldData) {
        this.field.fetchAttributes(function() {
          fieldView_PopulateAttributes(obj);
          fieldView_PopulateFieldValueRepresentation(obj);
        });
      }
      // use the fieldData already present
      else { 
        fieldView_PopulateAttributes(obj);
        fieldView_PopulateFieldValueRepresentation(obj);
      }
    }


  /***************************************************************************
   * DwCFieldView - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCFieldView - Namespace Declaration
   ***************************************************************************/

  /** @ignore */
  $.fn.DwCFieldView = function(options) {
    return this.each(function() {
      (new $.DwCFieldView($(this), options));
    });
  };


  /***************************************************************************
   * DwCFieldView - Default Options
   ***************************************************************************/

  /**
   * @class some options for the DwCFieldView
   * @name DwCFieldViewOptions
   * @memberOf DwCFieldView
   */
  $.DwCFieldView.defaultOptions = {
    /**
     * the associated (internal) DwCSearch object that will
     * be used to query records from the Darwin Core database
     * @field
     * @name search
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type DwCViews.DwCSearch
     * @default null
     */
    search: null,
    /**
     * a handle to the parent DwCViews object
     * (if this DwCFieldView is contained within one)
     * @field
     * @name dwcviews
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type DwCViews
     * @default null
     */
    dwcviews: null,
    /**
     * the address of the darwin core gateway
     * @field
     * @name gatewayAddress
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default ""
     */
    gatewayAddress: "",
    /**
     * the absolute base path of the darwin core gateway service
     * @field
     * @name baseDir
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default "/gateway/"
     */
    baseDir: "/gateway/",
    /**
     * a lucene-compatible query
     * @field
     * @name filter
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default null
     */
    filter: null,
    /**
     * an associative array of labels for each field's common attributes
     * @field
     * @name attributes
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Object
     * @default
     * {
     *   label: "Server Label",
     *   type: "Data Type",
     *   distinct: "Dinstinct Values",
     *   minvalue: "Minimum Value",
     *   maxvalue: "Maximum Value"
     * }
     */
    attributes: {
      label: "Server Label",
      type: "Data Type",
      distinct: "Distinct Values",
      minvalue: "Minimum Value",
      maxvalue: "Maximum Value"
    },
    /**
     * the maximum number of distinct values to be displayed
     * in the wordcloud or histogram views
     * (if the total number is greater than the maximum value, each value
     * will be chosen at random)
     * @field
     * @name maxFieldValues
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Integer
     * @default 50
     */
    maxFieldValues: 50,
    /**
     * the font-size that will be considered the upper bound
     * for a value (i.e. the most frequent value)
     * @field
     * @name wordCloudMaxFontSize
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Decimal
     * @default 3
     */
    wordCloudMaxFontSize: 3,
    /**
     * the font-size that will be considered the lower bound
     * for a value (i.e. the least frequent value)
     * @field
     * @name wordCloudMinFontSize
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Decimal
     * @default 0.80
     */
    wordCloudMinFontSize: 0.80,
    /**
     * the type of unit to which wordCloudMaxFontSize and wordCloudMinFontSize
     * will refer (i.e. 'pt', 'px', 'em', etc.)
     * @field
     * @name wordCloudFontUnit
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default 'em'
     */
    wordCloudFontUnit: 'em',
    /**
     * the base google charts url (without any options)
     * @field
     * @name googleChartsUrl
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default 'http://chart.apis.google.com/chart'
     */
    googleChartsUrl: 'http://chart.apis.google.com/chart',
    /**
     * the title at the top of the histogram
     * @field
     * @name histogramTitle
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default null
     */
    histogramTitle: null, //'Field Value Distributions',
    /**
     * all numeric fields' 'value' displays are represented by a
     * bar graph style histogram.  this field represents the number
     * of different bars/bins (groupings) in which the values will
     * be presented   
     * @field
     * @name histogramNBins
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Integer
     * @default 10
     */
    histogramNBins: 10,
    /**
     * the actual size of the histogram to be generated
     * in the format &lt;width&gt;x&lt;height&gt;
     * @field
     * @name histogramSize
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default '775x375'
     */
    histogramSize: '775x375',
    /**
     * the color of each bar in the histogram 
     * @field
     * @name histogramBarColor
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type String
     * @default '3366cc'
     */
    histogramBarColor: '3366cc',
    /**
     * will the DwCFieldView object query and load its data upon initialization
     * @field
     * @name loadOnInit
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Boolean
     * @default true
     */
    loadOnInit: true,
    /**
     * will the DwCFieldView object be hidden when it is first initialized
     * @field
     * @name hideOnInit
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Boolean
     * @default true
     */
    hideOnInit: false,
    /**
     * an optional callback function that is automatically invoked after
     * the DwCFieldView object first initializes itself
     * @function
     * @name onInit
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Function
     * @param {DwCFieldView} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onInit: null,
    /**
     * an optional callback function that is automatically invoked when the
     * the DwCFieldView Show() function is called
     * @function
     * @name onShow
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Function
     * @param {DwCFieldView} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onShow: null,
    /**
     * an optional callback function that is automatically invoked when the
     * the DwCFieldView Hide() function is called
     * @function
     * @name onHide
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Function
     * @param {DwCFieldView} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onHide: null,
    /**
     * this callback function is automatically invoked when a user clicks
     * on one of the values in the wordcloud
     * @function
     * @name fieldValueOnClick
     * @memberOf DwCFieldView.DwCFieldViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself as the only argument
     * @param {Object} element the actual html (DOM) element that was clicked
     * @default by default, clicking on a value will set a global filter on all plugins within the DwCieldsView
     *   (if it exists) so that the only records returned will be those where this field has
     *   the specified value (the value that was clicked)
     */
    fieldValueOnClick: function(field_view, element) {
      var filter, original_filter, value_filter;
      if (field_view.dwcviews) {
        original_filter = field_view.dwcviews.search.filter;
        //value_filter = field_view.fieldName + ':' + encodeURI(element.attr('dwc_fieldvalue'));
        value_filter = field_view.fieldName + ':"' + element.attr('dwc_fieldvalue') + '"';
        if (original_filter) {
          filter = "(" + original_filter + ") AND (" + value_filter + ")";
        }
        else {
          filter = value_filter;
        }
        field_view.dwcviews.doSearch(filter);
      }
    }
  };


  /***************************************************************************
   * DwCFieldView - Begin Private Functions
   ***************************************************************************/

  /** @private **/
  function fieldView_init(obj) {
    var table, thead, tr, th, div;

    obj.element.addClass('DwCFieldView_Container');

    table = obj.element.find('table.DwCFieldView_Table:first');

    if (table.length == 0) {
      table = $('<table cellpadding="0" cellspacing="0" class="DwCFieldView_Table"></table>');
      obj.element.append(table);
    }
    obj.fieldTable = table;

    thead = obj.fieldTable.find('thead:first');
    if (thead.length == 0) {
      thead = $('<thead></thead>');
      obj.fieldTable.prepend(thead);
    }

    tr = $('<tr class="DwCFieldView_ControlRow"></tr>');
    thead.append(tr);
    th = $('<th colspan="2"></th>');
    tr.append(th);
    div = $('<div class="DwCFieldView_Title"></div>');
    th.append(div);
    div = $('<div class="DwCFieldView_HideButton"></div>');
    // this is the hide button, bind the onClick event to hide the view
    div.click(function() {
      obj.hide();
    });
    th.append(div);

    if (obj.fieldTable.find('tbody:first').length == 0) {
      obj.fieldTable.append('<tbody></tbody>');
    }
  }


  // if the DwCField object does not exist, build it
  /** @private **/
  function fieldView_BuildField(obj) {
    var field_options = {};
    // if a field already exists, don't do anything
    if (!obj.field) {
      field_options['fieldName'] = obj.fieldName;
      field_options['maxFieldValues'] = obj.maxFieldValues;
      field_options['fieldHistogramNBins'] = obj.histogramNBins;
      // determine the gatewayAddress/baseDir/filter.  If a DwCSearch object
      // was passed, use its settings.  If not, use those passed in the options
      field_options['gatewayAddress'] = typeof(obj.search) == 'object'? obj.search.gatewayAddress : obj.gatewayAddress;
      field_options['baseDir'] = typeof(obj.search) == 'object'? obj.search.baseDir : obj.baseDir;
      field_options['filter'] = typeof(obj.search) == 'object'? obj.search.filter : obj.filter;
      obj.field = new $.DwCViews.DwCField(field_options);
    }
  }


  /** @private **/
  function fieldView_EmptyView(obj) {
    var tbody = obj.fieldTable.find('tbody:last');
    tbody.empty();
  }


  /** @private **/
  function fieldView_PopulateAttributes(obj) {
    var data = obj.field.fieldData[obj.fieldName];
    var thead, tbody, tr, td;
    var row_class = 2; // the field name will be row class 1

    tbody = obj.fieldTable.find('tbody:last');
    if (tbody.length == 0) {
      tbody = $('<tbody></tbody>');
      obj.fieldTable.append(tbody);
    }

    // show the field name
    tr = $('<tr></tr>');
    tr.addClass('DwCFieldView_AttributeRow');
    tr.addClass('DwCFieldView_AttributeRow1');
    td = $('<td class="DwCFieldView_AttributeTitle">Field Name</td>');
    tr.append(td);
    td = $('<td class="DwCFieldView_AttributeValue"></td>');
    td.text(obj.fieldName);
    tr.append(td);
    tbody.append(tr);

    // loop through each attribute and display it
    if (obj.attributes) {
      // if a dictionary of attributes was specified, show only those
      $.each(obj.attributes, function(attr, label) {
        tr = $('<tr></tr>');
        tr.addClass('DwCFieldView_AttributeRow');
        tr.addClass('DwCFieldView_AttributeRow' + row_class);
        td = $('<td></td>');
        td.text(label);
        td.addClass('DwCFieldView_AttributeTitle');
        tr.append(td);
        td = $('<td></td>');
        td.addClass('DwCFieldView_AttributeValue');
        if (data.hasOwnProperty(attr) && data[attr] !== null) { td.text(data[attr].toString()); }
        else { td.addClass('DwCFieldView_NullValue'); }
        tr.append(td);
        tbody.append(tr);       

        // toggle the row class
        row_class = (row_class % 2) + 1;
      });
    }
    else {
      // if no attributes were specified, show all that were returned
      // in the field query
      $.each(data, function(attr, value) {
        tr = $('<tr></tr>');
        tr.addClass('DwCFieldView_AttributeRow');
        tr.addClass('DwCFieldView_AttributeRow' + row_class);
        td = $('<td></td>');
        td.text(attr.toString());
        td.addClass('DwCFieldView_AttributeTitle');
        tr.append(td);
        td = $('<td></td>');
        td.addClass('DwCFieldView_AttributeValue');
        td.text(value.toString());
        tr.append(td);
        tbody.append(tr);

        // toggle the row class
        row_class = (row_class % 2) + 1;
      });
    }
  }


  /** @private **/
  function fieldView_BuildWordCloud(obj) {
    var wcloud_title;
    var wcloud_cell;
    var wcloud_value;
    var tr;

    // if the word cloud title bar doesn't exist, add it
    wcloud_title = obj.fieldTable.find('td.DwCFieldView_WordCloudTitle:last');
    if (wcloud_title.length == 0) {
      tr = $('<tr></tr>');
      tr.addClass('DwCFieldView_WordCloud');
      wcloud_title = $('<td colspan="2"></td>');
      wcloud_title.addClass('DwCFieldView_WordCloudTitle');
      tr.append(wcloud_title);
      obj.fieldTable.append(tr);
    }

    // if the word cloud container doesn't exit, add it
    wcloud_cell = obj.fieldTable.find('td.DwCFieldView_WordCloudValue:last');
    if (wcloud_cell.length == 0) {
      tr = $('<tr></tr>');
      tr.addClass('DwCFieldView_WordCloud');
      wcloud_cell = $('<td colspan="2"></td>');
      wcloud_cell.addClass('DwCFieldView_WordCloudValue');
      tr.append(wcloud_cell);
      obj.fieldTable.append(tr);
    }

    $.each(obj.field.fieldValues, function(index, value_pair) {
      wcloud_value = $('<span></span>');
      wcloud_value.addClass('DwCFieldView_WordCloudValue');
      wcloud_value.text(value_pair[0]);
      // scale the size of the font
      wcloud_value.css('font-size', fieldView_CalculateFontSize(obj, value_pair[1]));
      wcloud_value.attr('dwc_fieldvalue', value_pair[0].toString());
      wcloud_cell.append(wcloud_value);

      // bind the onclick even, if a function was given
      if (typeof(obj.fieldValueOnClick) == 'function') {
        wcloud_value.click(function() {
          obj.fieldValueOnClick(obj, $(this));
        });
      }
    });
  }


  /** @private **/
  function fieldView_BuildHistogram(obj) {
    var histogram_title;
    var histogram_container;
    var histogram_img;
    var tr;
    var histogram_url;
    var url_attrs = {};
    var first = true;
    var max_bin_count = 10;

    // first, we need to construct the URL for our google charts image
    if (obj.histogramTitle) { url_attrs['chtt'] = obj.histogramTitle; } // chart title
    url_attrs['chs'] = obj.histogramSize; // chart size
    url_attrs['chco'] = obj.histogramBarColor; // cbar color
    url_attrs['cht'] = 'bhg'; // ???? but required
    url_attrs['chbh'] = 'a'; // ???? but stretches graph to fit
    url_attrs['chxt'] = 'y,x'; // define axes (plural of axis)
    url_attrs['chd'] = 't:'; // data set (built in loop)
    url_attrs['chxl'] = '0:|'; // data labels (built in loop)
    // loop through each histogram bin and set data/labels
    $.each(obj.field.fieldHistogram, function(index, bin_array) {
      if (!first) {
        url_attrs['chd'] += ',';
        url_attrs['chxl'] += '|';
      }
      else {
        first = false;
      }
      // set data value
      url_attrs['chd'] += bin_array[2].toString();
      // set data label
      url_attrs['chxl'] += bin_array[0].toFixed(2).toString();
      url_attrs['chxl'] += '  →  ';
      url_attrs['chxl'] += bin_array[1].toFixed(2).toString();
      url_attrs['chxl'] += '  ';

      // determine max count
      if (bin_array[2] > max_bin_count) { max_bin_count = bin_array[2]; }
    });

    // set the max for the Y axis
    url_attrs['chds'] = "0," + max_bin_count; // scale the chart
    url_attrs['chxr'] = '1,0,' + max_bin_count; // set the labels

    // construct the URL
    histogram_url = obj.googleChartsUrl + "?" + $.param(url_attrs);

    // if the histogram title bar doesn't exist, add it
    histogram_title = obj.fieldTable.find('td.DwCFieldView_HistogramTitle:last');
    if (histogram_title.length == 0) {
      tr = $('<tr></tr>');
      tr.addClass('DwCFieldView_Histogram');
      histogram_title = $('<td colspan="2"></td>');
      histogram_title.addClass('DwCFieldView_HistogramTitle');
      tr.append(histogram_title);
      obj.fieldTable.append(tr);
    }

    // if the histogram container doesn't exit, add it
    histogram_container = obj.fieldTable.find('td.DwCFieldView_HistogramValue:last');
    if (histogram_container.length == 0) {
      tr = $('<tr></tr>');
      tr.addClass('DwCFieldView_Histogram');
      histogram_container = $('<td colspan="2"></td>');
      histogram_container.addClass('DwCFieldView_WordCloudValue');
      histogram_img = $('<img></img>');
      histogram_img.addClass('DwCFieldView_Histogram');
      histogram_img.attr('src', histogram_url);
      histogram_container.append(histogram_img);
      tr.append(histogram_container);
      obj.fieldTable.append(tr);
    }
  }


  /** @private **/
  function fieldView_CalculateFontSize(obj, value) {
    // calculate the most and least frequent terms
    var min, max;
    $.each(obj.field.fieldValues, function(index, value_pair) {
      if (typeof(min) == 'undefined' || value_pair[1] < min) {
        min = value_pair[1];
      }
      if (typeof(max) == 'undefined' || value_pair[1] > max) {
        max = value_pair[1];
      }
    });
    
    var percent = calculateHistogramPercentage({
      "minvalue": min,
      "maxvalue": max,
      "value": value
    });
    var font_size = histogramPercentageToRange({
      "floor": obj.wordCloudMinFontSize,
      "ceiling": obj.wordCloudMaxFontSize,
      "value": percent
    });
    return font_size + obj.wordCloudFontUnit;
  }


  // first determines if the field is a number or date, then
  // creates either a wordcloud or histogram to represent
  // the current values for the given field
  /** @private **/
  function fieldView_PopulateFieldValueRepresentation(obj) {
    // generate a word cloud for non-numeric/date values
    if ($.inArray(obj.field.fieldData[obj.fieldName]['type'], solrQuantifiableFieldTypes) == -1) {
      // make sure that we have the field values for the word cloud
      if (!obj.field.fieldValues) {
        obj.field.fetchValues(function() {
          fieldView_BuildWordCloud(obj);
        });
      }
      else { fieldView_BuildWordCloud(obj); }
    }
    // we have a quantifiable value.  generate a histogram
    else {
      // make sure that we have the field histogram information
      if (!obj.field.fieldHistogram) {
        obj.field.fetchHistogram(function() {
          fieldView_BuildHistogram(obj);
        });
      }
      else { fieldView_BuildHistogram(obj); }
    }
  }





  /***************************************************************************
   * DwCFieldsView
   *
   * Creates a table with a summary of all available fields in the
   * Darwin Core database.
   ***************************************************************************/

  /**
   * @class a plugin that displays all of the public fields in the Darwin Core Database
   * @name DwCFieldsView
   * @constructor
   * @param {DwCFieldsViewOptions} options an associative array of options for teh DwCFieldsView object
   * @returns {Object} a new instance of the DwCFieldsView object
   */
  $.DwCFieldsView = function(element, options) {

    this.options = {};

    // store this object instance in the main element's .data() attribute
    element.data('DwCFieldsView', this);

    /** @ignore */
    this.init = function(element, option) {
      var obj = this;

      // merge default options and options passed into the function
      this.options = $.extend({}, $.DwCFieldsView.defaultOptions, options);

      // create a handle on the DOM element
      /**
       * the actual html container that contains the DwCFieldsView
       * (generally a &lt;div&gt; tag)
       * @field
       * @name element
       * @memberOf DwCFieldsView
       * @type Object
       */
      this.element = element;
      
      // set options as state variables
      this.fields = this.options.fields;
      /**
       * the address of the darwin core gateway
       * @field
       * @name gatewayAddress
       * @memberOf DwCFieldsView
       * @type String
       */
      this.gatewayAddress = this.options.gatewayAddress;
      /**
       * the absolute base path of the darwin core gateway service
       * @field
       * @name baseDir
       * @memberOf DwCFieldsView
       * @type String
       */
      this.baseDir = this.options.baseDir;
      /**
       * an associative array of labels to be used when displaying
       * information about each field
       * @field
       * @name attributes
       * @memberOf DwCFieldsView.DwCFieldsViewOptions
       * @type Object
       */
      this.attributes = this.options.attributes;
      /**
       * the associated DwCFieldView object (if not null, this will
       * be used to display detailed information about a single field)
       * @field
       * @name fieldView
       * @memberOf DwCFieldsView
       * @type DwCFieldView
       */
      this.fieldView = this.options.fieldView;
      /**
       * the associated DwCRecordsTable object (if not null, changes made
       * in the DwCFieldsView can be used to affect columns/fields shown
       * in this DwCRecordsTable)
       * @field
       * @name recordsTable
       * @memberOf DwCFieldsView
       * @type DwCRecordsTable
       */
      this.recordsTable = this.options.recordsTable;

      // event hooks
      /**
       * this is a callback function that will be automatically invoked when the
       * DwCFieldsView is first initialized
       * @function
       * @name onInit
       * @memberOf DwCFieldsView
       * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
       */
      this.onInit = this.options.onInit;
      /**
       * an optional callback function that is automatically invoked when the
       * the DwCFieldsView show() function is called
       * @function
       * @name onShow
       * @memberOf DwCFieldsView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself as the only argument
       */
      this.onShow = this.options.onShow;
      /**
       * an optional callback function that is automatically invoked when the
       * the DwCFieldsView hide() function is called
       * @function
       * @name onHide
       * @memberOf DwCFieldsView
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself as the only argument
       */
      this.onHide = this.options.onHide;
      /**
       * this is a callback function that will be automatically invoked when a row
       * (representing a field) on the DwCFieldsView is clicked
       * @function
       * @name onRowClick
       * @memberOf DwCFieldsView
       * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
       * @param {Object} row the actual &lt;tr&gt; html element of the row that was clicked
       */
      this.onRowClick = this.options.onRowClick;

      // some internal state variables
      /**
       * the actual &lt;table&gt; html element used in the DwCFieldsView
       * @function
       * @name fieldsTable
       * @memberOf DwCFieldsView
       * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
       * @param {Object} row the actual &lt;tr&gt; html element of the row that was clicked
       */
      this.fieldsTable = null;

      // if there is an associated recordsTable, make sure
      // that it is aware of this fields view
      if (this.recordsTable) {
        this.recordsTable.fieldsView = this;
      }

      // if no DwCFields object was passed, create one
      if (!this.fields) {
        this.fields = new $.DwCViews.DwCFields({
          'gatewayAddress': this.gatewayAddress,
          'basDir': this.baseDir,
        });
      }

      // set up the basic HTML/DOM skeleton
      fieldsView_init(this);

      // go ahead and query for the fields 
      this.fields.fetchFields(function(data) { obj.populateFields(data) });

      // set up an onInit/onLoad hook if an onInit function was defined
      if (typeof(this.onInit) == 'function') {
        this.onInit(this);
      }

    }

  
  /***************************************************************************
   * DwCFieldsView - Begin Public Functions
   ***************************************************************************/

    /**
     * determine whether the DwCFieldsView is currently hidden or visible
     * @function
     * @name isHidden
     * @memberOf DwCFieldsView
     * @returns {Boolean} true if the DwCFieldsView is currently visible, false otherwise
     */
    this.isHidden = function() {
      return !this.element.is(":visible");
    }


    /**
     * hides the DwCFieldsView plugin (if visible)
     * @function
     * @name hide
     * @memberOf DwCFieldsView
     */
    this.hide = function() {
      var obj = this;
      // don't do anything if the map view is already hidden
      if (!this.isHidden()) {
        // if a callback function was specified for the onHide() event hook
        if (typeof(this.onHide) == 'function') {
          obj.onHide(this);
        }
        this.element.hide(0, null);
      }
    }


    /**
     * display the DwCFieldsView plugin (if it is hidden)
     * @function
     * @name show
     * @memberOf DwCFieldsView
     */
    this.show = function() {
      var obj = this;

      // do nothing if the map view is already visible
      if (this.isHidden()) {
        this.element.show(0, null, function() {
          // if a callback function was specified for the onShow() event hook
          if (typeof(obj.onShow) == 'function') {
            obj.onShow(obj);
          }
        });
      }
    }


    /**
     * populate the DwCFieldsView with the given field data
     * @function
     * @name populateFields
     * @memberOf DwCFieldsView
     * @param {Object} data the JSON fields data used to populate the DwCFieldsView
     */
    this.populateFields = function(data) {
      var obj = this;
      var tbody = obj.fieldsTable.find('tbody:first');
      var row_class = 1; // alternate row classes
      var first_row = true;
      var row;

      tbody.empty();
      
      $.each(data, function(field_name, field_attrs) {
        var cell, checkbox;
        var field_info;
        var first_column = true;
        row = $('<tr></tr>');

        // set a fieldname attribute for use with event functions
        row.attr('dwc_fieldname', field_name);

        // generic row class
        row.addClass('DwCFieldsView_FieldRow');
        // add an alternating row class
        row.addClass('DwCFieldsView_FieldRow' + row_class);

        // extra css class if this is the first row
        if (first_row) { row.addClass('DwCFieldsView_FirstRow'); }

        // if this fields view is bound to a records table,
        // create checkmarks in order to toggle the fields on/off
        if (obj.recordsTable) {
          cell = $('<td></td>');
          cell.addClass('DwCFieldsView_FieldRow');
          cell.addClass('DwCFieldsView_AttributeValue');
          cell.addClass('DwCFieldsView_FieldToggleCheckBox');
          checkbox = $('<input type="checkbox" />');
          checkbox.addClass('DwCFieldsView_FieldToggleCheckBox');
          // create a "field" attribute for reference with callback functions
          checkbox.attr('dwc_fieldname', field_name);
          cell.append(checkbox);
          row.append(cell);

          // set the initial checkbox state
          if (obj.recordsTable.fields.hasOwnProperty(field_name) &&
            obj.recordsTable.fields[field_name]['display']) {
            checkbox.attr('checked', true);
          }

          // bind the "onChange" event to the button
          checkbox.click(function(event) {
            // first toggle the checked value
            if ($(this).attr('checked')) {
              field_info = {
                'name': field_name,
                'display': true
              }
              // if there is a proper label, add it
              if (field_attrs['label']) {
                field_info['label'] = field_attrs['label'];
              }
              obj.recordsTable.addField(field_name, field_info);
            }
            else
            {
              obj.recordsTable.removeField(field_name);
            }

            // prevent the checkbox click from continuing to
            // trigger a row click event
            event.stopPropagation();
          });
        }

        $.each(obj.attributes, function(attr_name, attr_label) {
          cell = $('<td></td>');

          // general css clas for all field cells
          cell.addClass('DwCFieldsView_FieldRow');

          // special css class if this is the first row
          if (first_row) { cell.addClass('DwCFieldsView_FirstRow'); }

          if (attr_name == '__field_name__') {
            cell.addClass('DwCFieldsView_FieldName');
            cell.text(field_name);
          }
          else {
            cell.addClass('DwCFieldsView_AttributeValue');
            if (field_attrs.hasOwnProperty(attr_name)) {
              cell.text(field_attrs[attr_name].toString());
            }
          }

          // add a special class if it is the first column
          if (first_column) {
            cell.addClass('DwCFieldsView_FirstColumn');
            // all subsequent columns will not be the first column
            first_column = false;
          }

          row.append(cell);
        });

        // attach a special class to the cells in the last column
        cell.addClass('DwCFieldsView_LastColumn');

        // if we have an onRowClick hook function
        if (typeof(obj.onRowClick) == 'function') {
          // set some special classes
          row.addClass('DwCFieldsView_ClickableRow');
          // attach the event hook
          row.click(function() {
            obj.onRowClick(obj, $(this));
          });
        }

        tbody.append(row);

        // subsequent rows will not be the first
        first_row = false;

        // toggle row class
        row_class = (row_class % 2) + 1;
      });

      // add a special class to the last row
      row.addClass('DwCFieldsView_LastRow');
      // add a special class to the cells in the last row
      row.find('td').addClass('DwCFieldsView_LastRow');
    }


    /**
     * analyzes the associated records table and checks all checkboxes
     * who's associated fields are currently displayed in the records table
     * (likewise, it unchecks all other checkboxes)
     *
     * @function
     * @name syncWithRecordsTable
     * @memberOf DwCFieldsView
     */
    this.syncWithRecordsTable = function() {
      var obj = this;
      var checkboxes;
      // do nothing if there is no associated records table
      if (this.recordsTable) {
        // search for all of the field toggle checkboxes
        checkboxes = this.fieldsTable.find('input.DwCFieldsView_FieldToggleCheckBox[type="checkbox"]');
        $.each(checkboxes, function(i, checkbox) {
          var field_name = $(checkbox).attr('dwc_fieldname');
          if (obj.recordsTable.fields.hasOwnProperty(field_name) &&
              obj.recordsTable.fields[field_name]['display']) {
            $(checkbox).attr('checked', 'checked');
          }
          else {
            $(checkbox).removeAttr('checked');
          }
        });
      }
    }


  /***************************************************************************
   * DwCFieldsView - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCFieldsView - Namespace Declaration
   ***************************************************************************/

  /** @ignore */
  $.fn.DwCFieldsView = function(options) {
    return this.each(function() {
      (new $.DwCFieldsView($(this), options));
    });
  };


  /***************************************************************************
   * DwCFieldsView - Default Options
   ***************************************************************************/

  /**
   * @class
   * @name DwCFieldsViewOptions
   * @memberOf DwCFieldsView
   */
  $.DwCFieldsView.defaultOptions = {
    fields: null,

    attributes: {
      '__field_name__': 'Name',
      'label': 'Label',
      'type': 'Type',
      'distinct': 'Distinct',
      'stored': 'Stored',
      'multivalued': 'Multi-Values'
    },
    /**
     * the address of the darwin core gateway
     * @field
     * @name gatewayAddress
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @type String
     * @default ''
     */
    gatewayAddress: '',
    /**
     * the absolute base path of the darwin core gateway service
     * @field
     * @name baseDir
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @type String
     * @default '/gateway/'
     */
    baseDir: '/gateway/',
    /**
     * the associated DwCFieldView object (if not null, this will
     * be used to display detailed information about a single field)
     * @field
     * @name fieldView
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @type DwCFieldView
     * @default null
     */
    fieldView: null,
    /**
     * the associated DwCRecordsTable object (if not null, changes made
     * in the DwCFieldsView can be used to affect columns/fields shown
     * in this DwCRecordsTable)
     * @field
     * @name recordsTable
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @type DwCRecordsTable
     * @default null
     */
    recordsTable: null,
    /**
     * this is a callback function that will be automatically invoked when the
     * DwCFieldsView is first initialized
     * @function
     * @name onInit
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
     * @default null
     */
    onInit: null,
    /**
     * an optional callback function that is automatically invoked when the
     * the DwCFieldsView show() function is called
     * @function
     * @name onShow
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onShow: null,
    /**
     * an optional callback function that is automatically invoked when the
     * the DwCFieldsView hide() function is called
     * @function
     * @name onHide
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @type Function
     * @param {DwCViews} this the object will pass a reference to itself as the only argument
     * @default null
     */
    onHide: null,
    /**
     * this is a callback function that will be automatically invoked when a row
     * (representing a field) on the DwCFieldsView is clicked
     * @function
     * @name onRowClick
     * @memberOf DwCFieldsView.DwCFieldsViewOptions
     * @param {DwCRecordsTable} this the DwCRecordsTable will pass itself to this function
     * @param {Object} row the actual &lt;tr&gt; html element of the row that was clicked
     * @default by default, when a row is clicked, that field's details will be displayed
     *   in the associated DwCFieldView object (if one exists)
     */
    onRowClick: function (obj, row) {
      obj.fieldView.setField(row.attr('dwc_fieldname'), true, true);
    }
  };


  /***************************************************************************
   * DwCFieldsView - Begin Private Functions
   ***************************************************************************/

  /** @private */
  function fieldsView_init(obj) {
    var table;
    var table_header;

    obj.element.addClass('DwCFieldsView_Container');

    table = obj.element.find('table.DwCFieldsView_Table:first');

    if (table.length == 0) {
      table = $('<table cellpadding="0" cellspacing="0" class="DwCFieldsView_Table"></table>');
      obj.element.append(table);
    }
    obj.fieldsTable = table;

    table_header = obj.fieldsTable.find('thead:first');
    if (table_header.length == 0) {
      table_header = $('<thead></thead>');
      obj.fieldsTable.prepend(table_header);
    }
    table_header.append('<tr class="DwCFieldsView_AttributeTitlesRow"></tr>');

    if (obj.fieldsTable.find('tbody:first').length == 0) {
      obj.fieldsTable.append('<tbody></tbody>');
    }

    // populate the titles row
    fieldsView_BuildAttributesHeader(obj);
  }


  /** @private */
  function fieldsView_BuildAttributesHeader(obj) {
    var titles_row = obj.fieldsTable.find('tr.DwCFieldsView_AttributeTitlesRow:first');

    titles_row.empty();

    // if this fieldsView is bound to a RecordsTable
    if (obj.recordsTable) {
      // add an extra checkbox column for turning fields on and off
      titles_row.append('<th class="DwCFieldsView_AttributeTitle"></th>');
    }

    $.each(obj.attributes, function(key, value) {
      var header = $('<th></th>');
      header.addClass('DwCFieldsView_AttributeTitle');
      header.text(value);
      titles_row.append(header);
    });
  }


  /** @private */
  function fieldsView_BindFieldToggle(obj, button) {
    button.click(function () {
      
    });
  }





  /***************************************************************************
   * DwCViewPicker
   *
   * a little bar that lets you switch between the different views
   * (i.e. recordsTable, mapView, fieldsView)
   ***************************************************************************/

  /**
   * @class a simple control panel that allows the user to switch between different views embedded within the DwCViews widget
   * @name DwCViewPicker
   * @constructor
   * @param {Object} options an associative array of options for the DwCViewPicker
   * @returns {DwCViewPicker} a new instance of the DwCViewPicker object
   */
  $.DwCViewPicker = function(element, options) {

    this.options = {};

    element.data('DwCViewPicker', this);

    /** @ignore */
    this.init = function(element, options) {

      this.options = $.extend({}, $.DwCViewPicker.defaultOptions, options);

      /**
       * the actual html container that contains the DwCFieldView
       * (generally a &lt;div&gt; tag)
       * @field
       * @name element
       * @memberOf DwCViewPicker
       * @type Object
       */
      this.element = element;

      /**
       * the name of the button representing the view that will
       * be displayed by default (upon initialization)
       * @field
       * @name defaultView
       * @memberOf DwCViewPicker
       * @type String
       */
      this.defaultView = this.options.defaultView
      /**
       * an associative array of all buttons and the DwC Plugins
       * that each one represents
       * @field
       * @name buttons
       * @memberOf DwCViewPicker
       * @type Object
       */
      this.buttons = this.options.buttons;
      /**
       * this callback function is automatically invoked when a user clicks
       * on one of the view buttons
       * @function
       * @name onButtonClick
       * @memberOf DwCViewPicker
       * @type Function
       * @param {DwCViews} this the object will pass a reference to itself
       * @param {Object} the DwC Plugin that the button represents
       */
      this.onButtonClick = this.options.onButtonClick;

      setupPicker(this);

    }


  /***************************************************************************
   * DwCViewPicker - Begin Public Functions
   ***************************************************************************/


    /**
     * add a new button, or update an existing button
     * @name setButton
     * @memberOf DwCViewPicker
     * @param {String} button_name the name of the button that you wish to add
     * @param {Object} button_info an associative array of options for this button
     */
    this.setButton = function(button_name, button_info) {
      if (this.buttons.hasOwnProperty(button_name)) {
        var button = this.element.find('.DwCViewPicker_' + button_name);

        // keep any old options (that are not being overridden)
        this.buttons[button_name] = $.extend({}, this.buttons[button_name], button_info);

        if (button.length != 0) {
          // unbind the click event
          button.unbind('click');
        
          // bind the new (or same) click event if one is specified
          this.bindButtonClick(this, button, button_name, button_info);
        }
      }
    }


    /**
     * show/display the given view and hide the others
     * @name showView
     * @memberOf DwCViewPicker
     * @param {String} button_name the name of the button associated with the view that you wish to be displayed
     */
    this.showView = function(button_name) {
      // loop through each button hiding/showing the appropriate view(s)
      $.each(this.buttons, function(name, button_info) {
        var view = button_info['view'];

        if (view) {
          // show the specified view
          if (name == button_name) {
            // if the view has a native "show()" command, use it
            if (typeof(view.show) == 'function') { view.show(); }
            // if not, call a generic JQuery "show()" on it
            else { view.element.show(); }
          }
          // hide all other views
          else {
            // if the view has a native "hide()" command, use it
            if (typeof(view.hide) == 'function') { view.hide(); }
            // if not, call a generic JQuery "hide()" on it
            else { view.element.hide(); }
          }
        }
      });
    }


  /***************************************************************************
   * DwCViewPicker - Final Initialization Call
   ***************************************************************************/

    this.init(element, options);

  };


  /***************************************************************************
   * DwCViewPicker - Namespace Declaration
   ***************************************************************************/

  /** @ignore */
  $.fn.DwCViewPicker = function(options) {
    return this.each(function() {
      (new $.DwCViewPicker($(this), options));
    });
  };


  /***************************************************************************
   * DwCViewPicker - Default Options
   ***************************************************************************/

  /**
   * @class
   * @name DwCViewPickerOptions
   * @memberOf DwCViewPicker
   */
  $.DwCViewPicker.defaultOptions = {
    /**
     * the name of the button in the DwCViewPicker that represents the
     * "default" DwC plugin (the plugin that will be displayed upon initialization) 
     * @field
     * @name defaultView
     * @memberOf DwCViewPicker.DwCViewPickerOptions
     * @type String
     * @default "RecordsTableButton"
     */
    defaultView: "RecordsTableButton",
    /**
     * a callback function that is automatically invoked when any of
     * the DwCViewPicker's buttons are clicked
     * @function
     * @name onButtonClick
     * @memberOf DwCViewPicker.DwCViewPickerOptions
     * @default null
     * @param {Object} this the DwCViewPicker object that is invoking this function
     * @param {Object} view the DwC Plugin corresponding to the button that was pressed
     */
    onButtonClick: null,
    /**
     * An associative array of buttons and button information
     * this array should be in the following format:
     * { "&lt;ButtonName&gt;": { "view" : &lt;DwCPlugin&gt; }, etc. }
     * @field
     * @name buttons
     * @memberOf DwCViewPicker.DwCViewPickerOptions
     * @type Object
     */
    buttons: {
      "RecordsTableButton": {
        "view": null 
      },
      "MapViewButton": {
        "view": null
      },
      "FieldsViewButton": {
        "view": null
      }
    }
  };


  /***************************************************************************
   * DwCViewPicker - Begin Private Functions
   ***************************************************************************/

  /** @private */
  function setupPicker(obj) {

    // style-ize the container
    obj.element.addClass('DwCViewPicker_Container');

    // add our buttons (as defined by the "buttons" option)
    $.each(obj.buttons, function(name, button_info) {
      var button = $('<div></div>');

      // add the generic button class
      button.addClass('DwCViewPicker_Button');
      // add a unique button class
      button.addClass('DwCViewPicker_' + name);

      // add click events
      bindButtonClick(obj, button, name, button_info);

      // add the button to the container
      obj.element.append(button);
    });

    // initially, show only the default view, hide all others
    if (obj.buttons &&
        obj.defaultView &&
        obj.buttons.hasOwnProperty(obj.defaultView)) {
      obj.showView(obj.defaultView);
    }
    // if there is no default, or if the default doesn't exist
    // simpy show the first one that was defined
    else {
      if (obj.buttons) {
        $.each(obj.buttons, function(name, button_info) {
          obj.showView(name);
          return false;
        });
      }
    }
    
  }


  /** @private */
  function bindButtonClick(obj, button, button_name, button_info) {
    button.click(function() {
      // show the corresponding view and hide the other views
      obj.showView(button_name);

      // if a click function has been defined
      if (typeof(button_info['click']) == 'function') {
        if (button_info['click'](obj, button_info['view'])) {
          // if the button's click callback returns true,
          // pass it off to the global button click callback
          if (typeof(obj.onButtonClick) == 'function') {
            obj.onButtonClick(obj, button_info['view']);
          }
        }
      }
      // if no special button click was passed in the options,
      // only use the global
      else if (typeof(obj.onButtonClick) == 'function') {
        obj.onButtonClick(obj, button_info['view']);
      }
    });
  }




  /***************************************************************************
   * DwCContextMenu
   *
   * The Right-Click menu used to control various DwC objects and functions
   ***************************************************************************/

  /**
   * @class a right-click style context menu
   * @name DwCContextMenu
   * @constructor
   * @param {DwCContextMenuOptions} options an associative array of options for the DwCContextMenu
   * @returns {DwCContextMenu} a new instance of the DwCContextMenu object
   */
  $.DwCContextMenu = function(element, options) {

    this.options = {};

    element.data('DwCContextMenu', this);

    /** @ignore */
    this.init = function(element, options) {

      this.options = $.extend({}, $.DwCContextMenu.defaultOptions, options);

      /**
       * the actual html element containing the DwCContextMenu plugin (usually a &lt;div&gt;)
       * @field
       * @name element
       * @memberOf DwCContextMenu
       * @type Object
       */
      this.element = element;

      /**
       * an associative array of menu groups, menu items, and callback functions
       * { '&lt;Group Name&gt;' {'label': '&lt;Group Name&gt;', 'displayLabel': &lt;true|false&gt;,
       * 'items': {'&lt;Field Name&rt;': {'label': '&lt;Field Label&rt;', 'display': &lt;true|false&rt;,
       * 'on': &lt;true|false&rt;, 'click': &lt;Callback Function&rt;} }, etc. }
       * @field
       * @name groups
       * @memberOf DwCContextMenu
       * @type Object
       */
      this.groups = options.groups
      /**
       * a transparent, page-sized container used as a clickable overlay for
       * recording when a click is made outside of the DwCContextMenu
       * (usually a &lt;div&gt; html element)
       * @field
       * @name overlay
       * @memberOf DwCContextMenu
       * @type Object
       */
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

    /**
     * display/unhide the DwCContextMenu at the point specified in the given mouse-click event
     * @function
     * @name show
     * @memberOf DwCContextMenu
     * @param {Event} e a mouse click event
     */
    this.show = function(e) {
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


    /**
     * hide the DwCContextMenu
     * @function
     * @name hide
     * @memberOf DwCContextMenu
     */
    this.hide = function() {
      element = this.element;
      // use a fade-out animation
      element.fadeOut(function() {
        element.hide();
      });
      this.overlay.hide();
    }


    /**
     * adds a special style to the menu item (changing its display to the "on" status)
     * @function
     * @name itemOn
     * @memberOf DwCContextMenu
     * @param {String} group the group name in which the item exists
     * @param {String} item the item name to be toggled to "on"
     */
    this.itemOn = function(group, item) {
      var item = this.groups[group]['items'][item];
      item['element'].addClass('DwCContextMenu_ItemOn');
      item['on'] = true;
    }


    /**
     * removes a special style from the menu item (changing its display to the "off" status)
     * @function
     * @name itemOff
     * @memberOf DwCContextMenu
     * @param {String} group the group name in which the item exists
     * @param {String} item the item name to be toggled to "off"
     */
    this.itemOff = function(group, item) {
      var item = this.groups[group]['items'][item];
      item['element'].removeClass('DwCContextMenu_ItemOn');
      item['on'] = false;
    }


    /**
     * properly tags (or untags) each item's CSS classes based on whether they are tagged "on" or "off"
     * (this function should used when an external call changes any menu status)
     * @function
     * @name refreshItemsOnOff
     * @memberOf DwCContextMenu
     */
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

  /** @ignore */
  $.fn.DwCContextMenu = function(options) {
    return this.each(function() {
      (new $.DwCContextMenu($(this), options));
    });
  };


  /***************************************************************************
   * DwCContextMenu - Default Options
   ***************************************************************************/

  /**
   * @class an associative array of options for the DwCContextMenu
   * @name DwCContextMenuOptions
   * @memberOf DwCContextMenu
   */
  $.DwCContextMenu.defaultOptions = {
    /**
     * an associative array of menu groups, menu items, and callback functions
     * @field
     * @name groups
     * @memberOf DwCContextMenu.DwCContextMenuOptions
     * @default {}
     */
    groups: {},
    /**
     * a transparent, page-sized container used as a clickable overlay for
     * recording when a click is made outside of the DwCContextMenu
     * (usually a &lt;div&gt; html element)
     * @field
     * @name overlay
     * @memberOf DwCContextMenu.DwCContextMenuOptions
     * @default null (a new container will automatically be made if nothing is specified)
     */
    overlay: null
  };


  /***************************************************************************
   * DwCContextMenu - Begin Private Functions
   ***************************************************************************/

  /** @private */
  function prepareMenu(obj) {
    obj.element.addClass('DwCContextMenu');
    obj.element.css('display', 'none');
  }


  /** @private */
  function bindMenuEvents(obj) {
    obj.element.bind('contextmenu', function(e) {
      obj.hide();
      return false;
    });

    obj.overlay.bind('contextmenu', function(e) {
      obj.hide();
      return false;
    });

    obj.overlay.click(function(e) {
      obj.hide();
      return false;
    });
  }


  /** @private */
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
            obj.hide();
            return item['click']($(this));
          });
        // if no click event was specified, just close the menu
        } else {
          item_element.click(function() {
            obj.hide();
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


  /** @private */
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





  /***************************************************************************
   * Some General Functions
   ***************************************************************************/

  /**
   * returns true if the given value is numeric, false otherwise
   * @function
   * @name isNumeric
   * @param {String} n any value
   */
  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }


  /** @private */
  // calculate a percentage based on various values
  function calculateHistogramPercentage(args) {
    // required options
    var min = args['minvalue']; // global minimum value
    var max = args['maxvalue']; // global maximum value
    var value = args['value']; // the actual value of this entry

    return (value - min) / (max - min);
  }


  /** @private */
  function histogramPercentageToRange(args) {
    var floor = args['floor']; // minimum allowable value
    var ceiling = args['ceiling']; // maximum allowable value
    var value = args['value']; // number between 0 - 1
    return (value * (ceiling - floor)) + floor;
  }


  /**
   * prepares a string for SOLR by escaping any special (reserved) characters
   * @function
   * @name solrEscapeValue
   * @param {String} str a string to be prepared for SOLR
   */
  function solrEscapeValue(str) {
    var esc_str = '';

    // make sure that the value is a string
    str = str.toString();

    for (var i=0; i<str.length; i++) {
      if (str[i] in solrSpecialCharacters) {
        esc_str += solrEscapeCharacter;
      }
      esc_str += str[i];
    }

    return esc_str;
  }

  /**
   * an associative array containing all reserved lucene characters/strings
   * @field
   * @name solrSpecialCharacters
   * @type Array
   */
  // note, we only use the keys, the values don't actually matter
  var solrSpecialCharacters = {
    '-': '-',
    '+': '+',
    '&': '&',
    '|': '|',
    '!': '!',
    '(': '(',
    ')': ')',
    '{': '{',
    '}': '}',
    '[': '[',
    ']': ']',
    '^': '^',
    '"': '"',
    '~': '~',
    '*': '*',
    '?': '?',
    ':': ':',
    '\\': '\\'
  };


  /**
   * the string that will be appended to escaped lucene characters
   * @field
   * @name solrEscapeCharacter
   * @type String
   * @default '\\'
   */
  // the character used to escape special characters in SOLR values
  var solrEscapeCharacter = '\\';

  /**
   * An array of strings listing all quantifiable lucene types (i.e. numbers and dates)
   * @field
   * @name solrQuantifiableFieldTypes
   * @type Array
   * @default new Array( 'integer', 'sint', 'sdouble', 'long', 'double',
   *   'float', 'sfloat', 'slong', 'date' )
   */
  // list of all quantifiable solr field types (includes numbers and dates)
  var solrQuantifiableFieldTypes = new Array( 
    'integer',
    'sint',
    'sdouble',
    'long',
    'double',
    'float',
    'sfloat',
    'slong',
    'date'
  );

})(jQuery);
