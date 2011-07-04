(function($) {

  /***************************************************************************
   * DwCViews
   *
   * Creates a self-contained suite of objects for browsing data from a
   * Darwin Core database.
   ***************************************************************************/

  $.DwCViews = function(element, options) {

    this.options = {};

    element.data('DwCViews', this);

    this.init = function(element, option) {
      this.options = $.extend({}, $.DwCViews.defaultOptions, options);
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
  };


  /***************************************************************************
   * DwCViews - Begin Private Functions
   ***************************************************************************/

  // function privFunc(obj) {}


  /***************************************************************************
   * DwCRecordsTable
   *
   * Transforms a (potentially) blank table into table used to list records
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
      this.start = this.options.start;
      this.count = this.options.count;
      this.fields = this.options.fields;
      this.fields_string = prepareFieldsString(this.options.fields);
      this.sortBy = this.options.defaultSortBy;
      this.sortOrder = this.options.defaultSortOrder;
      this.displayRowNums = this.options.displayRowNums;
      this.globalDefaultValue = this.options.globalDefaultValue;
      this.total = 0;
      this.data = null;
      this.db_fields = null;
      this.field_menu = null;
      this.overlay = null;

      // build the base Darwin Core Views URL
      this.base_url = this.options.gatewayAddress + this.options.baseDir;

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
      this.element.find(".DwCRecordsTable_HeaderRow").bind('contextmenu', function(e) {
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
      // clear any previous data rows
      this.element.find("tbody:last").empty();
      var obj = this; // handle on our "this" object for the callbacks
      var tbody_html = "";
      var row_type = 1;
      $.each(data.docs, function(row_num, record) {
        tbody_html += '<tr class="DwCRecordsTable_ResultRow' + row_type + '">\n';
        // if we wish to display row numbers
        if (obj.displayRowNums) {
          tbody_html += ' <td class="DwCRecordsTable_Value">' + (row_num + obj.start + 1) + '.</td>\n';
        }
        // loop through each of the defined fields
        for (var key in obj.fields) {
          var field = obj.fields[key];
          var value = record[key];
          // if the field is undefined for this document, display the default value
          if (value == null) {
             // look for field-specific default value.  Fallback to global default
             value = 'defaultValue' in field? field['defaultValue'] : obj.globalDefaultValue;
          }
          tbody_html += ' <td class="DwCRecordsTable_Value">' + value + '</td>\n';
        }
        tbody_html += "</tr>\n";
        // toggle alternating row classes
        row_type = (row_type % 2) + 1;
      });
      this.element.find("tbody:last").append(tbody_html);
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
      var url = prepareUrl(this);
      var obj = this; // object handler for callback functions
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
    this.addField = function(field_info) {
      this.fields[field_info['name']] = field_info;
      this.fields_string = prepareFieldsString(this.fields);
      prepareHeader(this);
      this.fetchRecords(false);
      prepareFooter(this);
      this.fields_menu.itemOn('fields', field_info['name']);
    }


    // remove a field (column) from the table
    this.removeField = function(field_name) {
      delete this.fields[field_name];
      removeFieldHeader(this, field_name);
      this.fields_string = prepareFieldsString(this.fields);
      prepareHeader(this);
      this.fetchRecords(true);
      prepareFooter(this);
      this.fields_menu.itemOff('fields', field_name);
    }


    this.toggleField = function(field_info) {
      if (field_info['name'] in this.fields) {
        this.removeField(field_info['name']);
      } else {
        this.addField(field_info);
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
    start: 0,
    count: 25,
    defaultSortBy: null,
    defaultSortOrder: "asc",
    displayRowNums: true,
    dataType: "records",
    globalDefaultValue: "&nbsp;",
    fields: {
      "id" : {
        "name": "id",
        "label": "ID"
      },
      "sciName_s": {
        "name": "sciName_s",
        "label": "Species",
      },
      "lng": {
        "name": "lng",
        "label":"Longitude",
      },
      "lat": {
        "name": "lat",
        "label": "Latitude"
      }
    }
  };


  /***************************************************************************
   * DwCContextMenu - Begin Private Functions
   ***************************************************************************/

  // style-ize table
  function prepareTable(obj) {
    obj.element.addClass("DwCRecordsTable");
  }

  // ceate / style-ize column headers
  function prepareHeader(obj) {
    // create a column header row if one does not exist
    var row = obj.element.find(".DwCRecordsTable_HeaderRow");
    if (row.length == 0) {
      // is a <thead></thead> tag defined?
      var thead = obj.element.find("thead:last");
      if (thead.length == 0) {
        thead = $("<thead></thead>");
        obj.element.prepend(thead);
      }
      // create a column headers row at the end of the <thead> body
      row = $('<tr class="DwCRecordsTable_HeaderRow"></tr>');
      thead.append(row);
    }

    // create result # column if requested in the options
    if (obj.displayRowNums) {
      if (obj.element.find('.DwCRecordsTable_FieldHeader[DwCViews_Field="__DwCRowNum"]').length == 0) {
        row.append('<th class="DwCRecordsTable_FieldHeader" DwCViews_Field="__DwCRowNum">&nbsp;</th>)');
      }
    }

    // create labels for each of fields' column
    for (var key in obj.fields) {
      var field = obj.fields[key];
      // if the field/column does not exist, add it
      if (obj.element.find('.DwCRecordsTable_FieldHeader[DwCViews_Field="' + key + '"]').length == 0) {
        // if no label was specified, just display the raw field name
        var label = 'label' in field? field['label'] : key;
        var html = "";
        html += '<th class="DwCRecordsTable_FieldHeader" DwCViews_Field="' + key + '">';
        html += '<div class="DwCRecordsTable_FieldSorter" DwCViews_Field="' + key + '">';
        html += label;
        html += '</div>\n';
        html += '</th>\n';
        row.append(html);
      }
    }

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
    obj.element.find('.DwCRecordsTable_FieldHeader[DwCViews_Field="' + field_name + '"]').remove();
  }

  // set up the <tbody>, which will house the records data
  function prepareBody(obj) {
    // if no <tbody> was defined in the base HTML,
    // add it to the DwCRecordsTable
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
    // how many columns are in our table?
    var column_count = obj.element.find(".DwCRecordsTable_HeaderRow:last")[0].cells.length;

    // if a footer row has already been defined
    if (obj.element.find(".DwCRecordsTable_PagingRow").length == 0) {
      // if there is no table footer, create one
      if (obj.element.find("tfoot").length == 0) {
        obj.element.append('<tfoot></tfoot>');
      }
      var tfoot = obj.element.find("tfoot:last");

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
    first_button.addClass('DwCRecordsTable_FloatButton');
    first_button.click(function() {
      obj.element.data("DwCRecordsTable").firstPage();
    });

    if (obj.element.find(".DwCRecordsTable_PrevButton").length == 0) {
      button_container.append('<div class="DwCRecordsTable_PrevButton"></div>');
    }
    prev_button = obj.element.find(".DwCRecordsTable_PrevButton");
    prev_button.addClass('DwCRecordsTable_FloatButton');
    prev_button.click(function() {
      obj.element.data("DwCRecordsTable").prevPage();
    });

    if (obj.element.find(".DwCRecordsTable_LastButton").length == 0) {
      button_container.append('<div class="DwCRecordsTable_LastButton"></div>');
    }
    last_button = obj.element.find(".DwCRecordsTable_LastButton");
    last_button.addClass('DwCRecordsTable_FloatButton');
    last_button.click(function() {
      obj.element.data("DwCRecordsTable").lastPage();
    });

    if (obj.element.find(".DwCRecordsTable_NextButton").length == 0) {
      button_container.append('<div class="DwCRecordsTable_NextButton"></div>');
    }
    next_button = obj.element.find(".DwCRecordsTable_NextButton");
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
    url = obj.base_url + "fields";
    $.getJSON(url, function(db_fields) {
      obj.db_fields = db_fields;
      createFieldsMenu(obj, db_fields);
    });
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
    for (var key in this.fields) {
      if (!is_first) {
        fields_string += ",";
      }
      fields_string += key;
      is_first = false;
    }
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
        obj.toggleField({"name": name}); 
        return false;
      }
      // if the field is in the table currently, set it as "On"
      item['on'] = name in obj.fields;
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
      this.element.css({position: 'absolute', left: e.pageX, top: e.pageY});
      this.overlay.show();
      this.element.show();
    }


    this.hideMenu = function() {
      this.element.hide();
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

        // take care of mouse-over (hover) styling
        item_element.hover(function() {
          $(this).addClass("DwCContextMenu_ItemHover");
        }, function() {
          $(this).removeClass("DwCContextMenu_ItemHover");
        });

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
      width: '100%',
      height: '100%',
      position: 'absolute',
      left: '0px',
      top: '0px',
    });

    // keep the overlay hidden until we need it
    overlay.hide();

    overlay.appendTo(document.body);
    return overlay;
  }

})(jQuery);
