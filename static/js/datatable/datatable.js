/*
 * This combined file was created by the DataTables downloader builder:
 *   https://datatables.net/download
 *
 * To rebuild or modify this file with the latest versions of the included
 * software please visit:
 *   https://datatables.net/download/#dt/sp-1.2.2
 *
 * Included libraries:
 *  SearchPanes 1.2.2
 */

/*! SearchPanes 1.2.2
 * 2019-2020 SpryMedia Ltd - datatables.net/license
 */
(function () {
    'use strict';
  
    var $;
    var DataTable;
    function setJQuery(jq) {
        $ = jq;
        DataTable = jq.fn.dataTable;
    }
    var SearchPane = /** @class */ (function () {
        /**
         * Creates the panes, sets up the search function
         * @param paneSettings The settings for the searchPanes
         * @param opts The options for the default features
         * @param idx the index of the column for this pane
         * @returns {object} the pane that has been created, including the table and the index of the pane
         */
        function SearchPane(paneSettings, opts, idx, layout, panesContainer, panes) {
            var _this = this;
            if (panes === void 0) { panes = null; }
            // Check that the required version of DataTables is included
            if (!DataTable || !DataTable.versionCheck || !DataTable.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            if (!DataTable.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new DataTable.Api(paneSettings);
            this.classes = $.extend(true, {}, SearchPane.classes);
            // Get options from user
            this.c = $.extend(true, {}, SearchPane.defaults, opts);
            this.customPaneSettings = panes;
            this.s = {
                cascadeRegen: false,
                clearing: false,
                colOpts: [],
                deselect: false,
                displayed: false,
                dt: table,
                dtPane: undefined,
                filteringActive: false,
                index: idx,
                indexes: [],
                lastCascade: false,
                lastSelect: false,
                listSet: false,
                name: undefined,
                redraw: false,
                rowData: {
                    arrayFilter: [],
                    arrayOriginal: [],
                    arrayTotals: [],
                    bins: {},
                    binsOriginal: {},
                    binsTotal: {},
                    filterMap: new Map(),
                    totalOptions: 0
                },
                scrollTop: 0,
                searchFunction: undefined,
                selectPresent: false,
                serverSelect: [],
                serverSelecting: false,
                showFiltered: false,
                tableLength: null,
                updating: false
            };
            var rowLength = table.columns().eq(0).toArray().length;
            this.colExists = this.s.index < rowLength;
            // Add extra elements to DOM object including clear and hide buttons
            this.c.layout = layout;
            var layVal = parseInt(layout.split('-')[1], 10);
            this.dom = {
                buttonGroup: $('<div/>').addClass(this.classes.buttonGroup),
                clear: $('<button type="button">&#215;</button>')
                    .addClass(this.classes.dull)
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.clearButton),
                container: $('<div/>').addClass(this.classes.container).addClass(this.classes.layout +
                    (layVal < 10 ? layout : layout.split('-')[0] + '-9')),
                countButton: $('<button type="button"></button>')
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.countButton),
                dtP: $('<table><thead><tr><th>' +
                    (this.colExists
                        ? $(table.column(this.colExists ? this.s.index : 0).header()).text()
                        : this.customPaneSettings.header || 'Custom Pane') + '</th><th/></tr></thead></table>'),
                lower: $('<div/>').addClass(this.classes.subRow2).addClass(this.classes.narrowButton),
                nameButton: $('<button type="button"></button>').addClass(this.classes.paneButton).addClass(this.classes.nameButton),
                panesContainer: panesContainer,
                searchBox: $('<input/>').addClass(this.classes.paneInputButton).addClass(this.classes.search),
                searchButton: $('<button type = "button" class="' + this.classes.searchIcon + '"></button>')
                    .addClass(this.classes.paneButton),
                searchCont: $('<div/>').addClass(this.classes.searchCont),
                searchLabelCont: $('<div/>').addClass(this.classes.searchLabelCont),
                topRow: $('<div/>').addClass(this.classes.topRow),
                upper: $('<div/>').addClass(this.classes.subRow1).addClass(this.classes.narrowSearch)
            };
            this.s.displayed = false;
            table = this.s.dt;
            this.selections = [];
            this.s.colOpts = this.colExists ? this._getOptions() : this._getBonusOptions();
            var colOpts = this.s.colOpts;
            var clear = $('<button type="button">X</button>').addClass(this.classes.paneButton);
            $(clear).text(table.i18n('searchPanes.clearPane', 'X'));
            this.dom.container.addClass(colOpts.className);
            this.dom.container.addClass((this.customPaneSettings !== null && this.customPaneSettings.className !== undefined)
                ? this.customPaneSettings.className
                : '');
            // Set the value of name incase ordering is desired
            if (this.s.colOpts.name !== undefined) {
                this.s.name = this.s.colOpts.name;
            }
            else if (this.customPaneSettings !== null && this.customPaneSettings.name !== undefined) {
                this.s.name = this.customPaneSettings.name;
            }
            else {
                this.s.name = this.colExists ?
                    $(table.column(this.s.index).header()).text() :
                    this.customPaneSettings.header || 'Custom Pane';
            }
            $(panesContainer).append(this.dom.container);
            var tableNode = table.table(0).node();
            // Custom search function for table
            this.s.searchFunction = function (settings, searchData, dataIndex, origData) {
                // If no data has been selected then show all
                if (_this.selections.length === 0) {
                    return true;
                }
                if (settings.nTable !== tableNode) {
                    return true;
                }
                var filter = null;
                if (_this.colExists) {
                    // Get the current filtered data
                    filter = searchData[_this.s.index];
                    if (colOpts.orthogonal.filter !== 'filter') {
                        // get the filter value from the map
                        filter = _this.s.rowData.filterMap.get(dataIndex);
                        if (filter instanceof $.fn.dataTable.Api) {
                            filter = filter.toArray();
                        }
                    }
                }
                return _this._search(filter, dataIndex);
            };
            $.fn.dataTable.ext.search.push(this.s.searchFunction);
            // If the clear button for this pane is clicked clear the selections
            if (this.c.clear) {
                $(clear).on('click', function () {
                    var searches = _this.dom.container.find(_this.classes.search);
                    searches.each(function () {
                        $(this).val('');
                        $(this).trigger('input');
                    });
                    _this.clearPane();
                });
            }
            // Sometimes the top row of the panes containing the search box and ordering buttons appears
            //  weird if the width of the panes is lower than expected, this fixes the design.
            // Equally this may occur when the table is resized.
            table.on('draw.dtsp', function () {
                _this._adjustTopRow();
            });
            table.on('buttons-action', function () {
                _this._adjustTopRow();
            });
            $(window).on('resize.dtsp', DataTable.util.throttle(function () {
                _this._adjustTopRow();
            }));
            // When column-reorder is present and the columns are moved, it is necessary to
            //  reassign all of the panes indexes to the new index of the column.
            table.on('column-reorder.dtsp', function (e, settings, details) {
                _this.s.index = details.mapping[_this.s.index];
            });
            return this;
        }
        /**
         * In the case of a rebuild there is potential for new data to have been included or removed
         * so all of the rowData must be reset as a precaution.
         */
        SearchPane.prototype.clearData = function () {
            this.s.rowData = {
                arrayFilter: [],
                arrayOriginal: [],
                arrayTotals: [],
                bins: {},
                binsOriginal: {},
                binsTotal: {},
                filterMap: new Map(),
                totalOptions: 0
            };
        };
        /**
         * Clear the selections in the pane
         */
        SearchPane.prototype.clearPane = function () {
            // Deselect all rows which are selected and update the table and filter count.
            this.s.dtPane.rows({ selected: true }).deselect();
            this.updateTable();
            return this;
        };
        /**
         * Strips all of the SearchPanes elements from the document and turns all of the listeners for the buttons off
         */
        SearchPane.prototype.destroy = function () {
            $(this.s.dtPane).off('.dtsp');
            $(this.s.dt).off('.dtsp');
            $(this.dom.nameButton).off('.dtsp');
            $(this.dom.countButton).off('.dtsp');
            $(this.dom.clear).off('.dtsp');
            $(this.dom.searchButton).off('.dtsp');
            $(this.dom.container).remove();
            var searchIdx = $.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            while (searchIdx !== -1) {
                $.fn.dataTable.ext.search.splice(searchIdx, 1);
                searchIdx = $.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            }
            // If the datatables have been defined for the panes then also destroy these
            if (this.s.dtPane !== undefined) {
                this.s.dtPane.destroy();
            }
            this.s.listSet = false;
        };
        /**
         * Updates the number of filters that have been applied in the title
         */
        SearchPane.prototype.getPaneCount = function () {
            return this.s.dtPane !== undefined ?
                this.s.dtPane.rows({ selected: true }).data().toArray().length :
                0;
        };
        /**
         * Rebuilds the panes from the start having deleted the old ones
         * @param? last boolean to indicate if this is the last pane a selection was made in
         * @param? dataIn data to be used in buildPane
         * @param? init Whether this is the initial draw or not
         * @param? maintainSelection Whether the current selections are to be maintained over rebuild
         */
        SearchPane.prototype.rebuildPane = function (last, dataIn, init, maintainSelection) {
            if (last === void 0) { last = false; }
            if (dataIn === void 0) { dataIn = null; }
            if (init === void 0) { init = null; }
            if (maintainSelection === void 0) { maintainSelection = false; }
            this.clearData();
            var selectedRows = [];
            this.s.serverSelect = [];
            var prevEl = null;
            // When rebuilding strip all of the HTML Elements out of the container and start from scratch
            if (this.s.dtPane !== undefined) {
                if (maintainSelection) {
                    if (!this.s.dt.page.info().serverSide) {
                        selectedRows = this.s.dtPane.rows({ selected: true }).data().toArray();
                    }
                    else {
                        this.s.serverSelect = this.s.dtPane.rows({ selected: true }).data().toArray();
                    }
                }
                this.s.dtPane.clear().destroy();
                prevEl = $(this.dom.container).prev();
                this.destroy();
                this.s.dtPane = undefined;
                $.fn.dataTable.ext.search.push(this.s.searchFunction);
            }
            this.dom.container.removeClass(this.classes.hidden);
            this.s.displayed = false;
            this._buildPane(!this.s.dt.page.info().serverSide ?
                selectedRows :
                this.s.serverSelect, last, dataIn, init, prevEl);
            return this;
        };
        /**
         * removes the pane from the page and sets the displayed property to false.
         */
        SearchPane.prototype.removePane = function () {
            this.s.displayed = false;
            $(this.dom.container).hide();
        };
        /**
         * Sets the cascadeRegen property of the pane. Accessible from above because as SearchPanes.ts deals with the rebuilds.
         * @param val the boolean value that the cascadeRegen property is to be set to
         */
        SearchPane.prototype.setCascadeRegen = function (val) {
            this.s.cascadeRegen = val;
        };
        /**
         * This function allows the clearing property to be assigned. This is used when implementing cascadePane.
         * In setting this to true for the clearing of the panes selection on the deselects it forces the pane to
         * repopulate from the entire dataset not just the displayed values.
         * @param val the boolean value which the clearing property is to be assigned
         */
        SearchPane.prototype.setClear = function (val) {
            this.s.clearing = val;
        };
        /**
         * Updates the values of all of the panes
         * @param draw whether this has been triggered by a draw event or not
         */
        SearchPane.prototype.updatePane = function (draw) {
            if (draw === void 0) { draw = false; }
            this.s.updating = true;
            this._updateCommon(draw);
            this.s.updating = false;
        };
        /**
         * Updates the panes if one of the options to do so has been set to true
         *   rather than the filtered message when using viewTotal.
         */
        SearchPane.prototype.updateTable = function () {
            var selectedRows = this.s.dtPane.rows({ selected: true }).data().toArray();
            this.selections = selectedRows;
            this._searchExtras();
            // If either of the options that effect how the panes are displayed are selected then update the Panes
            if (this.c.cascadePanes || this.c.viewTotal) {
                this.updatePane();
            }
        };
        /**
         * Sets the listeners for the pane.
         *
         * Having it in it's own function makes it easier to only set them once
         */
        SearchPane.prototype._setListeners = function () {
            var _this = this;
            var rowData = this.s.rowData;
            var t0;
            // When an item is selected on the pane, add these to the array which holds selected items.
            // Custom search will perform.
            this.s.dtPane.on('select.dtsp', function () {
                clearTimeout(t0);
                if (_this.s.dt.page.info().serverSide && !_this.s.updating) {
                    if (!_this.s.serverSelecting) {
                        _this.s.serverSelect = _this.s.dtPane.rows({ selected: true }).data().toArray();
                        _this.s.scrollTop = $(_this.s.dtPane.table().node()).parent()[0].scrollTop;
                        _this.s.selectPresent = true;
                        _this.s.dt.draw(false);
                    }
                }
                else {
                    $(_this.dom.clear).removeClass(_this.classes.dull);
                    _this.s.selectPresent = true;
                    if (!_this.s.updating) {
                        _this._makeSelection();
                    }
                    _this.s.selectPresent = false;
                }
            });
            // When an item is deselected on the pane, re add the currently selected items to the array
            // which holds selected items. Custom search will be performed.
            this.s.dtPane.on('deselect.dtsp', function () {
                t0 = setTimeout(function () {
                    if (_this.s.dt.page.info().serverSide && !_this.s.updating) {
                        if (!_this.s.serverSelecting) {
                            _this.s.serverSelect = _this.s.dtPane.rows({ selected: true }).data().toArray();
                            _this.s.deselect = true;
                            _this.s.dt.draw(false);
                        }
                    }
                    else {
                        _this.s.deselect = true;
                        if (_this.s.dtPane.rows({ selected: true }).data().toArray().length === 0) {
                            $(_this.dom.clear).addClass(_this.classes.dull);
                        }
                        _this._makeSelection();
                        _this.s.deselect = false;
                        _this.s.dt.state.save();
                    }
                }, 50);
            });
            // When saving the state store all of the selected rows for preselection next time around
            this.s.dt.on('stateSaveParams.dtsp', function (e, settings, data) {
                // If the data being passed in is empty then a state clear must have occured so clear the panes state as well
                if ($.isEmptyObject(data)) {
                    _this.s.dtPane.state.clear();
                    return;
                }
                var selected = [];
                var searchTerm;
                var order;
                var bins;
                var arrayFilter;
                // Get all of the data needed for the state save from the pane
                if (_this.s.dtPane !== undefined) {
                    selected = _this.s.dtPane.rows({ selected: true }).data().map(function (item) { return item.filter.toString(); }).toArray();
                    searchTerm = $(_this.dom.searchBox).val();
                    order = _this.s.dtPane.order();
                    bins = rowData.binsOriginal;
                    arrayFilter = rowData.arrayOriginal;
                }
                if (data.searchPanes === undefined) {
                    data.searchPanes = {};
                }
                if (data.searchPanes.panes === undefined) {
                    data.searchPanes.panes = [];
                }
                for (var i = 0; i < data.searchPanes.panes.length; i++) {
                    if (data.searchPanes.panes[i].id === _this.s.index) {
                        data.searchPanes.panes.splice(i, 1);
                        i--;
                    }
                }
                // Add the panes data to the state object
                data.searchPanes.panes.push({
                    arrayFilter: arrayFilter,
                    bins: bins,
                    id: _this.s.index,
                    order: order,
                    searchTerm: searchTerm,
                    selected: selected
                });
            });
            this.s.dtPane.on('user-select.dtsp', function (e, _dt, type, cell, originalEvent) {
                originalEvent.stopPropagation();
            });
            this.s.dtPane.on('draw.dtsp', function () {
                _this._adjustTopRow();
            });
            // When the button to order by the name of the options is clicked then
            //  change the ordering to whatever it isn't currently
            $(this.dom.nameButton).on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([0, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
                _this.s.dt.state.save();
            });
            // When the button to order by the number of entries in the column is clicked then
            //  change the ordering to whatever it isn't currently
            $(this.dom.countButton).on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([1, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
                _this.s.dt.state.save();
            });
            // When the clear button is clicked reset the pane
            $(this.dom.clear).on('click.dtsp', function () {
                var searches = _this.dom.container.find('.' + _this.classes.search);
                searches.each(function () {
                    // set the value of the search box to be an empty string and then search on that, effectively reseting
                    $(this).val('');
                    $(this).trigger('input');
                });
                _this.clearPane();
            });
            // When the search button is clicked then draw focus to the search box
            $(this.dom.searchButton).on('click.dtsp', function () {
                $(_this.dom.searchBox).focus();
            });
            // When a character is inputted into the searchbox search the pane for matching values.
            // Doing it this way means that no button has to be clicked to trigger a search, it is done asynchronously
            $(this.dom.searchBox).on('input.dtsp', function () {
                _this.s.dtPane.search($(_this.dom.searchBox).val()).draw();
                _this.s.dt.state.save();
            });
            // Make sure to save the state once the pane has been built
            this.s.dt.state.save();
            return true;
        };
        /**
         * Takes in potentially undetected rows and adds them to the array if they are not yet featured
         * @param filter the filter value of the potential row
         * @param display the display value of the potential row
         * @param sort the sort value of the potential row
         * @param type the type value of the potential row
         * @param arrayFilter the array to be populated
         * @param bins the bins to be populated
         */
        SearchPane.prototype._addOption = function (filter, display, sort, type, arrayFilter, bins) {
            // If the filter is an array then take a note of this, and add the elements to the arrayFilter array
            if (Array.isArray(filter) || filter instanceof DataTable.Api) {
                // Convert to an array so that we can work with it
                if (filter instanceof DataTable.Api) {
                    filter = filter.toArray();
                    display = display.toArray();
                }
                if (filter.length === display.length) {
                    for (var i = 0; i < filter.length; i++) {
                        // If we haven't seen this row before add it
                        if (!bins[filter[i]]) {
                            bins[filter[i]] = 1;
                            arrayFilter.push({
                                display: display[i],
                                filter: filter[i],
                                sort: sort[i],
                                type: type[i]
                            });
                        }
                        // Otherwise just increment the count
                        else {
                            bins[filter[i]]++;
                        }
                        this.s.rowData.totalOptions++;
                    }
                    return;
                }
                else {
                    throw new Error('display and filter not the same length');
                }
            }
            // If the values were affected by othogonal data and are not an array then check if it is already present
            else if (typeof this.s.colOpts.orthogonal === 'string') {
                if (!bins[filter]) {
                    bins[filter] = 1;
                    arrayFilter.push({
                        display: display,
                        filter: filter,
                        sort: sort,
                        type: type
                    });
                    this.s.rowData.totalOptions++;
                }
                else {
                    bins[filter]++;
                    this.s.rowData.totalOptions++;
                    return;
                }
            }
            // Otherwise we must just be adding an option
            else {
                arrayFilter.push({
                    display: display,
                    filter: filter,
                    sort: sort,
                    type: type
                });
            }
        };
        /**
         * Adds a row to the panes table
         * @param display the value to be displayed to the user
         * @param filter the value to be filtered on when searchpanes is implemented
         * @param shown the number of rows in the table that are currently visible matching this criteria
         * @param total the total number of rows in the table that match this criteria
         * @param sort the value to be sorted in the pane table
         * @param type the value of which the type is to be derived from
         */
        SearchPane.prototype._addRow = function (display, filter, shown, total, sort, type, className) {
            var index;
            for (var _i = 0, _a = this.s.indexes; _i < _a.length; _i++) {
                var entry = _a[_i];
                if (entry.filter === filter) {
                    index = entry.index;
                }
            }
            if (index === undefined) {
                index = this.s.indexes.length;
                this.s.indexes.push({ filter: filter, index: index });
            }
            return this.s.dtPane.row.add({
                className: className,
                display: display !== '' ?
                    display :
                    this.s.colOpts.emptyMessage !== false ?
                        this.s.colOpts.emptyMessage :
                        this.c.emptyMessage,
                filter: filter,
                index: index,
                shown: shown,
                sort: sort !== '' ?
                    sort :
                    this.s.colOpts.emptyMessage !== false ?
                        this.s.colOpts.emptyMessage :
                        this.c.emptyMessage,
                total: total,
                type: type
            });
        };
        /**
         * Adjusts the layout of the top row when the screen is resized
         */
        SearchPane.prototype._adjustTopRow = function () {
            var subContainers = this.dom.container.find('.' + this.classes.subRowsContainer);
            var subRow1 = this.dom.container.find('.dtsp-subRow1');
            var subRow2 = this.dom.container.find('.dtsp-subRow2');
            var topRow = this.dom.container.find('.' + this.classes.topRow);
            // If the width is 0 then it is safe to assume that the pane has not yet been displayed.
            //  Even if it has, if the width is 0 it won't make a difference if it has the narrow class or not
            if (($(subContainers[0]).width() < 252 || $(topRow[0]).width() < 252) && $(subContainers[0]).width() !== 0) {
                $(subContainers[0]).addClass(this.classes.narrow);
                $(subRow1[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowSearch);
                $(subRow2[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowButton);
            }
            else {
                $(subContainers[0]).removeClass(this.classes.narrow);
                $(subRow1[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowSearch);
                $(subRow2[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowButton);
            }
        };
        /**
         * Method to construct the actual pane.
         * @param selectedRows previously selected Rows to be reselected
         * @last boolean to indicate whether this pane was the last one to have a selection made
         */
        SearchPane.prototype._buildPane = function (selectedRows, last, dataIn, init, prevEl) {
            var _this = this;
            if (selectedRows === void 0) { selectedRows = []; }
            if (last === void 0) { last = false; }
            if (dataIn === void 0) { dataIn = null; }
            if (init === void 0) { init = null; }
            if (prevEl === void 0) { prevEl = null; }
            // Aliases
            this.selections = [];
            var table = this.s.dt;
            var column = table.column(this.colExists ? this.s.index : 0);
            var colOpts = this.s.colOpts;
            var rowData = this.s.rowData;
            // Other Variables
            var countMessage = table.i18n('searchPanes.count', '{total}');
            var filteredMessage = table.i18n('searchPanes.countFiltered', '{shown} ({total})');
            var loadedFilter = table.state.loaded();
            // If the listeners have not been set yet then using the latest state may result in funny errors
            if (this.s.listSet) {
                loadedFilter = table.state();
            }
            // If it is not a custom pane in place
            if (this.colExists) {
                var idx = -1;
                if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes) {
                    for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                        if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                            idx = i;
                            break;
                        }
                    }
                }
                // Perform checks that do not require populate pane to run
                if ((colOpts.show === false
                    || (colOpts.show !== undefined && colOpts.show !== true)) &&
                    idx === -1) {
                    this.dom.container.addClass(this.classes.hidden);
                    this.s.displayed = false;
                    return false;
                }
                else if (colOpts.show === true || idx !== -1) {
                    this.s.displayed = true;
                }
                if (!this.s.dt.page.info().serverSide &&
                    (dataIn === null ||
                        dataIn.searchPanes === null ||
                        dataIn.searchPanes.options === null)) {
                    // Only run populatePane if the data has not been collected yet
                    if (rowData.arrayFilter.length === 0) {
                        this._populatePane(last);
                        this.s.rowData.totalOptions = 0;
                        this._detailsPane();
                        // If the index is not found then no data has been added to the state for this pane,
                        //  which will only occur if it has previously failed to meet the criteria to be
                        //  displayed, therefore we can just hide it again here
                        if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes && idx === -1) {
                            this.dom.container.addClass(this.classes.hidden);
                            this.s.displayed = false;
                            return;
                        }
                        rowData.arrayOriginal = rowData.arrayTotals;
                        rowData.binsOriginal = rowData.binsTotal;
                    }
                    var binLength = Object.keys(rowData.binsOriginal).length;
                    var uniqueRatio = this._uniqueRatio(binLength, table.rows()[0].length);
                    // Don't show the pane if there isn't enough variance in the data, or there is only 1 entry for that pane
                    if (this.s.displayed === false && ((colOpts.show === undefined && colOpts.threshold === null ?
                        uniqueRatio > this.c.threshold :
                        uniqueRatio > colOpts.threshold)
                        || (colOpts.show !== true && binLength <= 1))) {
                        this.dom.container.addClass(this.classes.hidden);
                        this.s.displayed = false;
                        return;
                    }
                    // If the option viewTotal is true then find
                    // the total count for the whole table to display alongside the displayed count
                    if (this.c.viewTotal && rowData.arrayTotals.length === 0) {
                        this.s.rowData.totalOptions = 0;
                        this._detailsPane();
                    }
                    else {
                        rowData.binsTotal = rowData.bins;
                    }
                    this.dom.container.addClass(this.classes.show);
                    this.s.displayed = true;
                }
                else if (dataIn !== null && dataIn.searchPanes !== null && dataIn.searchPanes.options !== null) {
                    if (dataIn.tableLength !== undefined) {
                        this.s.tableLength = dataIn.tableLength;
                        this.s.rowData.totalOptions = this.s.tableLength;
                    }
                    else if (this.s.tableLength === null || table.rows()[0].length > this.s.tableLength) {
                        this.s.tableLength = table.rows()[0].length;
                        this.s.rowData.totalOptions = this.s.tableLength;
                    }
                    var colTitle = table.column(this.s.index).dataSrc();
                    if (dataIn.searchPanes.options[colTitle] !== undefined) {
                        for (var _i = 0, _a = dataIn.searchPanes.options[colTitle]; _i < _a.length; _i++) {
                            var dataPoint = _a[_i];
                            this.s.rowData.arrayFilter.push({
                                display: dataPoint.label,
                                filter: dataPoint.value,
                                sort: dataPoint.label,
                                type: dataPoint.label
                            });
                            this.s.rowData.bins[dataPoint.value] = this.c.viewTotal || this.c.cascadePanes ?
                                dataPoint.count :
                                dataPoint.total;
                            this.s.rowData.binsTotal[dataPoint.value] = dataPoint.total;
                        }
                    }
                    var binLength = Object.keys(rowData.binsTotal).length;
                    var uniqueRatio = this._uniqueRatio(binLength, this.s.tableLength);
                    // Don't show the pane if there isn't enough variance in the data, or there is only 1 entry for that pane
                    if (this.s.displayed === false && ((colOpts.show === undefined && colOpts.threshold === null ?
                        uniqueRatio > this.c.threshold :
                        uniqueRatio > colOpts.threshold)
                        || (colOpts.show !== true && binLength <= 1))) {
                        this.dom.container.addClass(this.classes.hidden);
                        this.s.displayed = false;
                        return;
                    }
                    this.s.rowData.arrayOriginal = this.s.rowData.arrayFilter;
                    this.s.rowData.binsOriginal = this.s.rowData.bins;
                    this.s.displayed = true;
                }
            }
            else {
                this.s.displayed = true;
            }
            // If the variance is accceptable then display the search pane
            this._displayPane();
            if (!this.s.listSet) {
                // Here, when the state is loaded if the data object on the original table is empty,
                //  then a state.clear() must have occurred, so delete all of the panes tables state objects too.
                this.dom.dtP.on('stateLoadParams.dt', function (e, settings, data) {
                    if ($.isEmptyObject(table.state.loaded())) {
                        $.each(data, function (index, value) {
                            delete data[index];
                        });
                    }
                });
            }
            // Add the container to the document in its original location
            if (prevEl !== null && $(this.dom.panesContainer).has(prevEl).length > 0) {
                $(this.dom.container).insertAfter(prevEl);
            }
            else {
                $(this.dom.panesContainer).prepend(this.dom.container);
            }
            // Declare the datatable for the pane
            var errMode = $.fn.dataTable.ext.errMode;
            $.fn.dataTable.ext.errMode = 'none';
            var haveScroller = DataTable.Scroller;
            this.s.dtPane = $(this.dom.dtP).DataTable($.extend(true, {
                columnDefs: [
                    {
                        className: 'dtsp-nameColumn',
                        data: 'display',
                        render: function (data, type, row) {
                            if (type === 'sort') {
                                return row.sort;
                            }
                            else if (type === 'type') {
                                return row.type;
                            }
                            var message;
                            (_this.s.filteringActive || _this.s.showFiltered) && _this.c.viewTotal
                                ? message = filteredMessage.replace(/{total}/, row.total)
                                : message = countMessage.replace(/{total}/, row.total);
                            message = message.replace(/{shown}/, row.shown);
                            while (message.indexOf('{total}') !== -1) {
                                message = message.replace(/{total}/, row.total);
                            }
                            while (message.indexOf('{shown}') !== -1) {
                                message = message.replace(/{shown}/, row.shown);
                            }
                            // We are displaying the count in the same columne as the name of the search option.
                            // This is so that there is not need to call columns.adjust(), which in turn speeds up the code
                            var pill = '<span class="' + _this.classes.pill + '">' + message + '</span>';
                            if (_this.c.hideCount || colOpts.hideCount) {
                                pill = '';
                            }
                            return '<div class="' + _this.classes.nameCont + '"><span title="' +
                                (typeof data === 'string' && data.match(/<[^>]*>/) !== null ? data.replace(/<[^>]*>/g, '') : data) +
                                '" class="' + _this.classes.name + '">' +
                                data + '</span>' +
                                pill + '</div>';
                        },
                        targets: 0,
                        // Accessing the private datatables property to set type based on the original table.
                        // This is null if not defined by the user, meaning that automatic type detection would take place
                        type: table.settings()[0].aoColumns[this.s.index] !== undefined ?
                            table.settings()[0].aoColumns[this.s.index]._sManualType :
                            null
                    },
                    {
                        className: 'dtsp-countColumn ' + this.classes.badgePill,
                        data: 'shown',
                        orderData: [1, 2],
                        targets: 1,
                        visible: false
                    },
                    {
                        data: 'total',
                        targets: 2,
                        visible: false
                    }
                ],
                deferRender: true,
                dom: 't',
                info: false,
                language: this.s.dt.settings()[0].oLanguage,
                paging: haveScroller ? true : false,
                scrollX: false,
                scrollY: '200px',
                scroller: haveScroller ? true : false,
                select: true,
                stateSave: table.settings()[0].oFeatures.bStateSave ? true : false
            }, this.c.dtOpts, colOpts !== undefined ? colOpts.dtOpts : {}, (this.s.colOpts.options !== undefined || !this.colExists)
                ? {
                    createdRow: function (row, data, dataIndex) {
                        $(row).addClass(data.className);
                    }
                }
                : undefined, (this.customPaneSettings !== null && this.customPaneSettings.dtOpts !== undefined)
                ? this.customPaneSettings.dtOpts
                : {}));
            $(this.dom.dtP).addClass(this.classes.table);
            // This is hacky but necessary for when datatables is generating the column titles automatically
            $(this.dom.searchBox).attr('placeholder', colOpts.header !== undefined
                ? colOpts.header
                : this.colExists
                    ? table.settings()[0].aoColumns[this.s.index].sTitle
                    : this.customPaneSettings.header || 'Custom Pane');
            // As the pane table is not in the document yet we must initialise select ourselves
            $.fn.dataTable.select.init(this.s.dtPane);
            $.fn.dataTable.ext.errMode = errMode;
            // If it is not a custom pane
            if (this.colExists) {
                // On initialisation, do we need to set a filtering value from a
                // saved state or init option?
                var search = column.search();
                search = search ? search.substr(1, search.length - 2).split('|') : [];
                // Count the number of empty cells
                var count_1 = 0;
                rowData.arrayFilter.forEach(function (element) {
                    if (element.filter === '') {
                        count_1++;
                    }
                });
                // Add all of the search options to the pane
                for (var i = 0, ien = rowData.arrayFilter.length; i < ien; i++) {
                    var selected = false;
                    for (var _b = 0, _c = this.s.serverSelect; _b < _c.length; _b++) {
                        var option = _c[_b];
                        if (option.filter === rowData.arrayFilter[i].filter) {
                            selected = true;
                        }
                    }
                    if (this.s.dt.page.info().serverSide &&
                        (!this.c.cascadePanes ||
                            (this.c.cascadePanes && rowData.bins[rowData.arrayFilter[i].filter] !== 0) ||
                            (this.c.cascadePanes && init !== null) ||
                            selected)) {
                        var row = this._addRow(rowData.arrayFilter[i].display, rowData.arrayFilter[i].filter, init ?
                            rowData.binsTotal[rowData.arrayFilter[i].filter] :
                            rowData.bins[rowData.arrayFilter[i].filter], this.c.viewTotal || init
                            ? String(rowData.binsTotal[rowData.arrayFilter[i].filter])
                            : rowData.bins[rowData.arrayFilter[i].filter], rowData.arrayFilter[i].sort, rowData.arrayFilter[i].type);
                        for (var _d = 0, _e = this.s.serverSelect; _d < _e.length; _d++) {
                            var option = _e[_d];
                            if (option.filter === rowData.arrayFilter[i].filter) {
                                this.s.serverSelecting = true;
                                row.select();
                                this.s.serverSelecting = false;
                            }
                        }
                    }
                    else if (!this.s.dt.page.info().serverSide &&
                        rowData.arrayFilter[i] &&
                        (rowData.bins[rowData.arrayFilter[i].filter] !== undefined || !this.c.cascadePanes)) {
                        this._addRow(rowData.arrayFilter[i].display, rowData.arrayFilter[i].filter, rowData.bins[rowData.arrayFilter[i].filter], rowData.binsTotal[rowData.arrayFilter[i].filter], rowData.arrayFilter[i].sort, rowData.arrayFilter[i].type);
                    }
                    else if (!this.s.dt.page.info().serverSide) {
                        // Just pass an empty string as the message will be calculated based on that in _addRow()
                        this._addRow('', count_1, count_1, '', '', '');
                    }
                }
            }
            DataTable.select.init(this.s.dtPane);
            // If there are custom options set or it is a custom pane then get them
            if (colOpts.options !== undefined ||
                (this.customPaneSettings !== null && this.customPaneSettings.options !== undefined)) {
                this._getComparisonRows();
            }
            // Display the pane
            this.s.dtPane.draw();
            this._adjustTopRow();
            if (!this.s.listSet) {
                this._setListeners();
                this.s.listSet = true;
            }
            for (var _f = 0, selectedRows_1 = selectedRows; _f < selectedRows_1.length; _f++) {
                var selection = selectedRows_1[_f];
                if (selection !== undefined) {
                    for (var _g = 0, _h = this.s.dtPane.rows().indexes().toArray(); _g < _h.length; _g++) {
                        var row = _h[_g];
                        if (this.s.dtPane.row(row).data() !== undefined && selection.filter === this.s.dtPane.row(row).data().filter) {
                            // If this is happening when serverSide processing is happening then different behaviour is needed
                            if (this.s.dt.page.info().serverSide) {
                                this.s.serverSelecting = true;
                                this.s.dtPane.row(row).select();
                                this.s.serverSelecting = false;
                            }
                            else {
                                this.s.dtPane.row(row).select();
                            }
                        }
                    }
                }
            }
            //  If SSP and the table is ready, apply the search for the pane
            if (this.s.dt.page.info().serverSide) {
                this.s.dtPane.search($(this.dom.searchBox).val()).draw();
            }
            // Reload the selection, searchbox entry and ordering from the previous state
            // Need to check here if SSP that this is the first draw, otherwise it will infinite loop
            if (loadedFilter &&
                loadedFilter.searchPanes &&
                loadedFilter.searchPanes.panes &&
                (dataIn === null ||
                    dataIn.draw === 1)) {
                if (!this.c.cascadePanes) {
                    this._reloadSelect(loadedFilter);
                }
                for (var _j = 0, _k = loadedFilter.searchPanes.panes; _j < _k.length; _j++) {
                    var pane = _k[_j];
                    if (pane.id === this.s.index) {
                        $(this.dom.searchBox).val(pane.searchTerm);
                        $(this.dom.searchBox).trigger('input');
                        this.s.dtPane.order(pane.order).draw();
                    }
                }
            }
            // Make sure to save the state once the pane has been built
            this.s.dt.state.save();
            return true;
        };
        /**
         * Update the array which holds the display and filter values for the table
         */
        SearchPane.prototype._detailsPane = function () {
            var table = this.s.dt;
            this.s.rowData.arrayTotals = [];
            this.s.rowData.binsTotal = {};
            var settings = this.s.dt.settings()[0];
            var indexArray = table.rows().indexes();
            if (!this.s.dt.page.info().serverSide) {
                for (var _i = 0, indexArray_1 = indexArray; _i < indexArray_1.length; _i++) {
                    var rowIdx = indexArray_1[_i];
                    this._populatePaneArray(rowIdx, this.s.rowData.arrayTotals, settings, this.s.rowData.binsTotal);
                }
            }
        };
        /**
         * Appends all of the HTML elements to their relevant parent Elements
         */
        SearchPane.prototype._displayPane = function () {
            var container = this.dom.container;
            var colOpts = this.s.colOpts;
            var layVal = parseInt(this.c.layout.split('-')[1], 10);
            //  Empty everything to start again
            $(this.dom.topRow).empty();
            $(this.dom.dtP).empty();
            $(this.dom.topRow).addClass(this.classes.topRow);
            // If there are more than 3 columns defined then make there be a smaller gap between the panes
            if (layVal > 3) {
                $(this.dom.container).addClass(this.classes.smallGap);
            }
            $(this.dom.topRow).addClass(this.classes.subRowsContainer);
            $(this.dom.upper).appendTo(this.dom.topRow);
            $(this.dom.lower).appendTo(this.dom.topRow);
            $(this.dom.searchCont).appendTo(this.dom.upper);
            $(this.dom.buttonGroup).appendTo(this.dom.lower);
            // If no selections have been made in the pane then disable the clear button
            if (this.c.dtOpts.searching === false ||
                (colOpts.dtOpts !== undefined &&
                    colOpts.dtOpts.searching === false) ||
                (!this.c.controls || !colOpts.controls) ||
                (this.customPaneSettings !== null &&
                    this.customPaneSettings.dtOpts !== undefined &&
                    this.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.customPaneSettings.dtOpts.searching)) {
                $(this.dom.searchBox).attr('disabled', 'disabled')
                    .removeClass(this.classes.paneInputButton)
                    .addClass(this.classes.disabledButton);
            }
            $(this.dom.searchBox).appendTo(this.dom.searchCont);
            // Create the contents of the searchCont div. Worth noting that this function will change when using semantic ui
            this._searchContSetup();
            // If the clear button is allowed to show then display it
            if (this.c.clear && this.c.controls && colOpts.controls) {
                $(this.dom.clear).appendTo(this.dom.buttonGroup);
            }
            if (this.c.orderable && colOpts.orderable && this.c.controls && colOpts.controls) {
                $(this.dom.nameButton).appendTo(this.dom.buttonGroup);
            }
            // If the count column is hidden then don't display the ordering button for it
            if (!this.c.hideCount &&
                !colOpts.hideCount &&
                this.c.orderable &&
                colOpts.orderable &&
                this.c.controls &&
                colOpts.controls) {
                $(this.dom.countButton).appendTo(this.dom.buttonGroup);
            }
            $(this.dom.topRow).prependTo(this.dom.container);
            $(container).append(this.dom.dtP);
            $(container).show();
        };
        /**
         * Gets the options for the row for the customPanes
         * @returns {object} The options for the row extended to include the options from the user.
         */
        SearchPane.prototype._getBonusOptions = function () {
            // We need to reset the thresholds as if they have a value in colOpts then that value will be used
            var defaultMutator = {
                orthogonal: {
                    threshold: null
                },
                threshold: null
            };
            return $.extend(true, {}, SearchPane.defaults, defaultMutator, this.c !== undefined ? this.c : {});
        };
        /**
         * Adds the custom options to the pane
         * @returns {Array} Returns the array of rows which have been added to the pane
         */
        SearchPane.prototype._getComparisonRows = function () {
            var colOpts = this.s.colOpts;
            // Find the appropriate options depending on whether this is a pane for a specific column or a custom pane
            var options = colOpts.options !== undefined
                ? colOpts.options
                : this.customPaneSettings !== null && this.customPaneSettings.options !== undefined
                    ? this.customPaneSettings.options
                    : undefined;
            if (options === undefined) {
                return;
            }
            var tableVals = this.s.dt.rows({ search: 'applied' }).data().toArray();
            var appRows = this.s.dt.rows({ search: 'applied' });
            var tableValsTotal = this.s.dt.rows().data().toArray();
            var allRows = this.s.dt.rows();
            var rows = [];
            // Clear all of the other rows from the pane, only custom options are to be displayed when they are defined
            this.s.dtPane.clear();
            for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
                var comp = options_1[_i];
                // Initialise the object which is to be placed in the row
                var insert = comp.label !== '' ? comp.label : this.c.emptyMessage;
                var comparisonObj = {
                    className: comp.className,
                    display: insert,
                    filter: typeof comp.value === 'function' ? comp.value : [],
                    shown: 0,
                    sort: insert,
                    total: 0,
                    type: insert
                };
                // If a custom function is in place
                if (typeof comp.value === 'function') {
                    // Count the number of times the function evaluates to true for the data currently being displayed
                    for (var tVal = 0; tVal < tableVals.length; tVal++) {
                        if (comp.value.call(this.s.dt, tableVals[tVal], appRows[0][tVal])) {
                            comparisonObj.shown++;
                        }
                    }
                    // Count the number of times the function evaluates to true for the original data in the Table
                    for (var i = 0; i < tableValsTotal.length; i++) {
                        if (comp.value.call(this.s.dt, tableValsTotal[i], allRows[0][i])) {
                            comparisonObj.total++;
                        }
                    }
                    // Update the comparisonObj
                    if (typeof comparisonObj.filter !== 'function') {
                        comparisonObj.filter.push(comp.filter);
                    }
                }
                // If cascadePanes is not active or if it is and the comparisonObj should be shown then add it to the pane
                if (!this.c.cascadePanes || (this.c.cascadePanes && comparisonObj.shown !== 0)) {
                    rows.push(this._addRow(comparisonObj.display, comparisonObj.filter, comparisonObj.shown, comparisonObj.total, comparisonObj.sort, comparisonObj.type, comparisonObj.className));
                }
            }
            return rows;
        };
        /**
         * Gets the options for the row for the customPanes
         * @returns {object} The options for the row extended to include the options from the user.
         */
        SearchPane.prototype._getOptions = function () {
            var table = this.s.dt;
            // We need to reset the thresholds as if they have a value in colOpts then that value will be used
            var defaultMutator = {
                emptyMessage: false,
                orthogonal: {
                    threshold: null
                },
                threshold: null
            };
            return $.extend(true, {}, SearchPane.defaults, defaultMutator, table.settings()[0].aoColumns[this.s.index].searchPanes);
        };
        /**
         * This method allows for changes to the panes and table to be made when a selection or a deselection occurs
         * @param select Denotes whether a selection has been made or not
         */
        SearchPane.prototype._makeSelection = function () {
            this.updateTable();
            this.s.updating = true;
            this.s.dt.draw();
            this.s.updating = false;
        };
        /**
         * Fill the array with the values that are currently being displayed in the table
         * @param last boolean to indicate whether this was the last pane a selection was made in
         */
        SearchPane.prototype._populatePane = function (last) {
            if (last === void 0) { last = false; }
            var table = this.s.dt;
            this.s.rowData.arrayFilter = [];
            this.s.rowData.bins = {};
            var settings = this.s.dt.settings()[0];
            // If cascadePanes or viewTotal are active it is necessary to get the data which is currently
            //  being displayed for their functionality. Also make sure that this was not the last pane to have a selection made
            if (!this.s.dt.page.info().serverSide) {
                var indexArray = (this.c.cascadePanes || this.c.viewTotal) && (!this.s.clearing && !last) ?
                    table.rows({ search: 'applied' }).indexes() :
                    table.rows().indexes();
                for (var _i = 0, _a = indexArray.toArray(); _i < _a.length; _i++) {
                    var index = _a[_i];
                    this._populatePaneArray(index, this.s.rowData.arrayFilter, settings);
                }
            }
        };
        /**
         * Populates an array with all of the data for the table
         * @param rowIdx The current row index to be compared
         * @param arrayFilter The array that is to be populated with row Details
         * @param bins The bins object that is to be populated with the row counts
         */
        SearchPane.prototype._populatePaneArray = function (rowIdx, arrayFilter, settings, bins) {
            if (bins === void 0) { bins = this.s.rowData.bins; }
            var colOpts = this.s.colOpts;
            // Retrieve the rendered data from the cell using the fnGetCellData function
            //  rather than the cell().render API method for optimisation
            if (typeof colOpts.orthogonal === 'string') {
                var rendered = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal);
                this.s.rowData.filterMap.set(rowIdx, rendered);
                this._addOption(rendered, rendered, rendered, rendered, arrayFilter, bins);
            }
            else {
                var filter = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.search);
                // Null and empty string are to be considered the same value
                if (filter === null) {
                    filter = '';
                }
                if (typeof filter === 'string') {
                    filter = filter.replace(/<[^>]*>/g, '');
                }
                this.s.rowData.filterMap.set(rowIdx, filter);
                if (!bins[filter]) {
                    bins[filter] = 1;
                    this._addOption(filter, settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.display), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.sort), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.type), arrayFilter, bins);
                    this.s.rowData.totalOptions++;
                }
                else {
                    bins[filter]++;
                    this.s.rowData.totalOptions++;
                    return;
                }
            }
        };
        /**
         * Reloads all of the previous selects into the panes
         * @param loadedFilter The loaded filters from a previous state
         */
        SearchPane.prototype._reloadSelect = function (loadedFilter) {
            // If the state was not saved don't selected any
            if (loadedFilter === undefined) {
                return;
            }
            var idx;
            // For each pane, check that the loadedFilter list exists and is not null,
            // find the id of each search item and set it to be selected.
            for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                    idx = i;
                    break;
                }
            }
            if (idx !== undefined) {
                var table = this.s.dtPane;
                var rows = table.rows({ order: 'index' }).data().map(function (item) { return item.filter !== null ?
                    item.filter.toString() :
                    null; }).toArray();
                for (var _i = 0, _a = loadedFilter.searchPanes.panes[idx].selected; _i < _a.length; _i++) {
                    var filter = _a[_i];
                    var id = -1;
                    if (filter !== null) {
                        id = rows.indexOf(filter.toString());
                    }
                    if (id > -1) {
                        this.s.serverSelecting = true;
                        table.row(id).select();
                        this.s.serverSelecting = false;
                    }
                }
            }
        };
        /**
         * This method decides whether a row should contribute to the pane or not
         * @param filter the value that the row is to be filtered on
         * @param dataIndex the row index
         */
        SearchPane.prototype._search = function (filter, dataIndex) {
            var colOpts = this.s.colOpts;
            var table = this.s.dt;
            // For each item selected in the pane, check if it is available in the cell
            for (var _i = 0, _a = this.selections; _i < _a.length; _i++) {
                var colSelect = _a[_i];
                if (typeof colSelect.filter === 'string') {
                    // The filter value will not have the &amp; in place but a &,
                    //  so we need to do a replace to make sure that they will match
                    colSelect.filter = colSelect.filter.replaceAll('&amp;', '&');
                }
                // if the filter is an array then is the column present in it
                if (Array.isArray(filter)) {
                    if (filter.indexOf(colSelect.filter) !== -1) {
                        return true;
                    }
                }
                // if the filter is a function then does it meet the criteria of that function or not
                else if (typeof colSelect.filter === 'function') {
                    if (colSelect.filter.call(table, table.row(dataIndex).data(), dataIndex)) {
                        if (colOpts.combiner === 'or') {
                            return true;
                        }
                    }
                    // If the combiner is an "and" then we need to check against all possible selections
                    //  so if it fails here then the and is not met and return false
                    else if (colOpts.combiner === 'and') {
                        return false;
                    }
                }
                // otherwise if the two filter values are equal then return true
                // Loose type checking incase number type in column comparing to a string
                else if ((filter === colSelect.filter) ||
                    (!(typeof filter === 'string' && filter.length === 0) && filter == colSelect.filter) ||
                    (colSelect.filter === null && typeof filter === 'string' && filter === '')) {
                    return true;
                }
            }
            // If the combiner is an and then we need to check against all possible selections
            //  so return true here if so because it would have returned false earlier if it had failed
            if (colOpts.combiner === 'and') {
                return true;
            }
            // Otherwise it hasn't matched with anything by this point so it must be false
            else {
                return false;
            }
        };
        /**
         * Creates the contents of the searchCont div
         *
         * NOTE This is overridden when semantic ui styling in order to integrate the search button into the text box.
         */
        SearchPane.prototype._searchContSetup = function () {
            if (this.c.controls && this.s.colOpts.controls) {
                $(this.dom.searchButton).appendTo(this.dom.searchLabelCont);
            }
            if (!(this.c.dtOpts.searching === false ||
                this.s.colOpts.dtOpts.searching === false ||
                (this.customPaneSettings !== null &&
                    this.customPaneSettings.dtOpts !== undefined &&
                    this.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.customPaneSettings.dtOpts.searching))) {
                $(this.dom.searchLabelCont).appendTo(this.dom.searchCont);
            }
        };
        /**
         * Adds outline to the pane when a selection has been made
         */
        SearchPane.prototype._searchExtras = function () {
            var updating = this.s.updating;
            this.s.updating = true;
            var filters = this.s.dtPane.rows({ selected: true }).data().pluck('filter').toArray();
            var nullIndex = filters.indexOf(this.s.colOpts.emptyMessage !== false ?
                this.s.colOpts.emptyMessage :
                this.c.emptyMessage);
            var container = $(this.s.dtPane.table().container());
            // If null index is found then search for empty cells as a filter.
            if (nullIndex > -1) {
                filters[nullIndex] = '';
            }
            // If a filter has been applied then outline the respective pane, remove it when it no longer is.
            if (filters.length > 0) {
                container.addClass(this.classes.selected);
            }
            else if (filters.length === 0) {
                container.removeClass(this.classes.selected);
            }
            this.s.updating = updating;
        };
        /**
         * Finds the ratio of the number of different options in the table to the number of rows
         * @param bins the number of different options in the table
         * @param rowCount the total number of rows in the table
         * @returns {number} returns the ratio
         */
        SearchPane.prototype._uniqueRatio = function (bins, rowCount) {
            if (rowCount > 0 &&
                ((this.s.rowData.totalOptions > 0 && !this.s.dt.page.info().serverSide) ||
                    (this.s.dt.page.info().serverSide && this.s.tableLength > 0))) {
                return bins / this.s.rowData.totalOptions;
            }
            else {
                return 1;
            }
        };
        /**
         * updates the options within the pane
         * @param draw a flag to define whether this has been called due to a draw event or not
         */
        SearchPane.prototype._updateCommon = function (draw) {
            if (draw === void 0) { draw = false; }
            // Update the panes if doing a deselect. if doing a select then
            // update all of the panes except for the one causing the change
            if (!this.s.dt.page.info().serverSide &&
                this.s.dtPane !== undefined &&
                (!this.s.filteringActive || this.c.cascadePanes || draw === true) &&
                (this.c.cascadePanes !== true || this.s.selectPresent !== true) && (!this.s.lastSelect || !this.s.lastCascade)) {
                var colOpts = this.s.colOpts;
                var selected = this.s.dtPane.rows({ selected: true }).data().toArray();
                var scrollTop = $(this.s.dtPane.table().node()).parent()[0].scrollTop;
                var rowData = this.s.rowData;
                // Clear the pane in preparation for adding the updated search options
                this.s.dtPane.clear();
                // If it is not a custom pane
                if (this.colExists) {
                    // Only run populatePane if the data has not been collected yet
                    if (rowData.arrayFilter.length === 0) {
                        this._populatePane();
                    }
                    // If cascadePanes is active and the table has returned to its default state then
                    //  there is a need to update certain parts ofthe rowData.
                    else if (this.c.cascadePanes
                        && this.s.dt.rows().data().toArray().length === this.s.dt.rows({ search: 'applied' }).data().toArray().length) {
                        rowData.arrayFilter = rowData.arrayOriginal;
                        rowData.bins = rowData.binsOriginal;
                    }
                    // Otherwise if viewTotal or cascadePanes is active then the data from the table must be read.
                    else if (this.c.viewTotal || this.c.cascadePanes) {
                        this._populatePane();
                    }
                    // If the viewTotal option is selected then find the totals for the table
                    if (this.c.viewTotal) {
                        this._detailsPane();
                    }
                    else {
                        rowData.binsTotal = rowData.bins;
                    }
                    if (this.c.viewTotal && !this.c.cascadePanes) {
                        rowData.arrayFilter = rowData.arrayTotals;
                    }
                    var _loop_1 = function (dataP) {
                        // If both view Total and cascadePanes have been selected and the count of the row is not 0 then add it to pane
                        // Do this also if the viewTotal option has been selected and cascadePanes has not
                        if (dataP && ((rowData.bins[dataP.filter] !== undefined && rowData.bins[dataP.filter] !== 0 && this_1.c.cascadePanes)
                            || !this_1.c.cascadePanes
                            || this_1.s.clearing)) {
                            var row = this_1._addRow(dataP.display, dataP.filter, !this_1.c.viewTotal
                                ? rowData.bins[dataP.filter]
                                : rowData.bins[dataP.filter] !== undefined
                                    ? rowData.bins[dataP.filter]
                                    : 0, this_1.c.viewTotal
                                ? String(rowData.binsTotal[dataP.filter])
                                : rowData.bins[dataP.filter], dataP.sort, dataP.type);
                            // Find out if the filter was selected in the previous search, if so select it and remove from array.
                            var selectIndex = selected.findIndex(function (element) {
                                return element.filter === dataP.filter;
                            });
                            if (selectIndex !== -1) {
                                row.select();
                                selected.splice(selectIndex, 1);
                            }
                        }
                    };
                    var this_1 = this;
                    for (var _i = 0, _a = rowData.arrayFilter; _i < _a.length; _i++) {
                        var dataP = _a[_i];
                        _loop_1(dataP);
                    }
                }
                if ((colOpts.searchPanes !== undefined && colOpts.searchPanes.options !== undefined) ||
                    colOpts.options !== undefined ||
                    (this.customPaneSettings !== null && this.customPaneSettings.options !== undefined)) {
                    var rows = this._getComparisonRows();
                    var _loop_2 = function (row) {
                        var selectIndex = selected.findIndex(function (element) {
                            if (element.display === row.data().display) {
                                return true;
                            }
                        });
                        if (selectIndex !== -1) {
                            row.select();
                            selected.splice(selectIndex, 1);
                        }
                    };
                    for (var _b = 0, rows_1 = rows; _b < rows_1.length; _b++) {
                        var row = rows_1[_b];
                        _loop_2(row);
                    }
                }
                // Add search options which were previously selected but whos results are no
                // longer present in the resulting data set.
                for (var _c = 0, selected_1 = selected; _c < selected_1.length; _c++) {
                    var selectedEl = selected_1[_c];
                    var row = this._addRow(selectedEl.display, selectedEl.filter, 0, this.c.viewTotal
                        ? selectedEl.total
                        : 0, selectedEl.display, selectedEl.display);
                    this.s.updating = true;
                    row.select();
                    this.s.updating = false;
                }
                this.s.dtPane.draw();
                this.s.dtPane.table().node().parentNode.scrollTop = scrollTop;
            }
        };
        SearchPane.version = '1.1.0';
        SearchPane.classes = {
            buttonGroup: 'dtsp-buttonGroup',
            buttonSub: 'dtsp-buttonSub',
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            clearButton: 'clearButton',
            container: 'dtsp-searchPane',
            countButton: 'dtsp-countButton',
            disabledButton: 'dtsp-disabledButton',
            dull: 'dtsp-dull',
            hidden: 'dtsp-hidden',
            hide: 'dtsp-hide',
            layout: 'dtsp-',
            name: 'dtsp-name',
            nameButton: 'dtsp-nameButton',
            nameCont: 'dtsp-nameCont',
            narrow: 'dtsp-narrow',
            paneButton: 'dtsp-paneButton',
            paneInputButton: 'dtsp-paneInputButton',
            pill: 'dtsp-pill',
            search: 'dtsp-search',
            searchCont: 'dtsp-searchCont',
            searchIcon: 'dtsp-searchIcon',
            searchLabelCont: 'dtsp-searchButtonCont',
            selected: 'dtsp-selected',
            smallGap: 'dtsp-smallGap',
            subRow1: 'dtsp-subRow1',
            subRow2: 'dtsp-subRow2',
            subRowsContainer: 'dtsp-subRowsContainer',
            title: 'dtsp-title',
            topRow: 'dtsp-topRow'
        };
        // Define SearchPanes default options
        SearchPane.defaults = {
            cascadePanes: false,
            clear: true,
            combiner: 'or',
            controls: true,
            container: function (dt) {
                return dt.table().container();
            },
            dtOpts: {},
            emptyMessage: '<i>No Data</i>',
            hideCount: false,
            layout: 'columns-3',
            name: undefined,
            orderable: true,
            orthogonal: {
                display: 'display',
                filter: 'filter',
                hideCount: false,
                search: 'filter',
                show: undefined,
                sort: 'sort',
                threshold: 0.6,
                type: 'type'
            },
            preSelect: [],
            threshold: 0.6,
            viewTotal: false
        };
        return SearchPane;
    }());
  
    var $$1;
    var DataTable$1;
    function setJQuery$1(jq) {
        $$1 = jq;
        DataTable$1 = jq.fn.dataTable;
    }
    var SearchPanes = /** @class */ (function () {
        function SearchPanes(paneSettings, opts, fromInit) {
            var _this = this;
            if (fromInit === void 0) { fromInit = false; }
            this.regenerating = false;
            // Check that the required version of DataTables is included
            if (!DataTable$1 || !DataTable$1.versionCheck || !DataTable$1.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            if (!DataTable$1.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new DataTable$1.Api(paneSettings);
            this.classes = $$1.extend(true, {}, SearchPanes.classes);
            // Get options from user
            this.c = $$1.extend(true, {}, SearchPanes.defaults, opts);
            // Add extra elements to DOM object including clear
            this.dom = {
                clearAll: $$1('<button type="button">Clear All</button>').addClass(this.classes.clearAll),
                container: $$1('<div/>').addClass(this.classes.panes).text(table.i18n('searchPanes.loadMessage', 'Loading Search Panes...')),
                emptyMessage: $$1('<div/>').addClass(this.classes.emptyMessage),
                options: $$1('<div/>').addClass(this.classes.container),
                panes: $$1('<div/>').addClass(this.classes.container),
                title: $$1('<div/>').addClass(this.classes.title),
                titleRow: $$1('<div/>').addClass(this.classes.titleRow),
                wrapper: $$1('<div/>')
            };
            this.s = {
                colOpts: [],
                dt: table,
                filterCount: 0,
                filterPane: -1,
                page: 0,
                panes: [],
                selectionList: [],
                serverData: {},
                stateRead: false,
                updating: false
            };
            if (table.settings()[0]._searchPanes !== undefined) {
                return;
            }
            this._getState();
            if (this.s.dt.page.info().serverSide) {
                table.on('preXhr.dt', function (e, settings, data) {
                    if (data.searchPanes === undefined) {
                        data.searchPanes = {};
                    }
                    for (var _i = 0, _a = _this.s.selectionList; _i < _a.length; _i++) {
                        var selection = _a[_i];
                        var src = _this.s.dt.column(selection.index).dataSrc();
                        if (data.searchPanes[src] === undefined) {
                            data.searchPanes[src] = {};
                        }
                        for (var i = 0; i < selection.rows.length; i++) {
                            data.searchPanes[src][i] = selection.rows[i].filter;
                        }
                    }
                });
            }
            // We are using the xhr event to rebuild the panes if required due to viewTotal being enabled
            // If viewTotal is not enabled then we simply update the data from the server
            table.on('xhr', function (e, settings, json, xhr) {
                if (json && json.searchPanes && json.searchPanes.options) {
                    _this.s.serverData = json;
                    _this.s.serverData.tableLength = json.recordsTotal;
                    _this._serverTotals();
                }
            });
            table.settings()[0]._searchPanes = this;
            this.dom.clearAll.text(table.i18n('searchPanes.clearMessage', 'Clear All'));
            if (this.s.dt.settings()[0]._bInitComplete || fromInit) {
                this._paneDeclare(table, paneSettings, opts);
            }
            else {
                table.one('preInit.dt', function (settings) {
                    _this._paneDeclare(table, paneSettings, opts);
                });
            }
            return this;
        }
        /**
         * Clear the selections of all of the panes
         */
        SearchPanes.prototype.clearSelections = function () {
            // Load in all of the searchBoxes in the documents
            var searches = this.dom.container.find(this.classes.search);
            // For each searchBox set the input text to be empty and then trigger
            //  an input on them so that they no longer filter the panes
            searches.each(function () {
                $$1(this).val('');
                $$1(this).trigger('input');
            });
            var returnArray = [];
            // For every pane, clear the selections in the pane
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    returnArray.push(pane.clearPane());
                }
            }
            this.s.dt.draw();
            return returnArray;
        };
        /**
         * returns the container node for the searchPanes
         */
        SearchPanes.prototype.getNode = function () {
            return this.dom.container;
        };
        /**
         * rebuilds all of the panes
         */
        SearchPanes.prototype.rebuild = function (targetIdx, maintainSelection) {
            if (targetIdx === void 0) { targetIdx = false; }
            if (maintainSelection === void 0) { maintainSelection = false; }
            $$1(this.dom.emptyMessage).remove();
            // As a rebuild from scratch is required, empty the searchpanes container.
            var returnArray = [];
            // Rebuild each pane individually, if a specific pane has been selected then only rebuild that one
            if (targetIdx === false) {
                $$1(this.dom.panes).empty();
            }
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (targetIdx !== false && pane.s.index !== targetIdx) {
                    continue;
                }
                pane.clearData();
                returnArray.push(
                // Pass a boolean to say whether this is the last choice made for maintaining selections when rebuilding
                pane.rebuildPane(this.s.selectionList[this.s.selectionList.length - 1] !== undefined ?
                    pane.s.index === this.s.selectionList[this.s.selectionList.length - 1].index :
                    false, this.s.dt.page.info().serverSide ?
                    this.s.serverData :
                    undefined, null, maintainSelection));
                $$1(this.dom.panes).append(pane.dom.container);
            }
            // Only need to trigger a search if it is not server side processing
            if (!this.s.dt.page.info().serverSide) {
                this.s.dt.draw();
            }
            if (this.c.cascadePanes || this.c.viewTotal) {
                this.redrawPanes(true);
            }
            else {
                this._updateSelection();
            }
            // Attach panes, clear buttons, and title bar to the document
            this._updateFilterCount();
            this._attachPaneContainer();
            this.s.dt.draw();
            // If a single pane has been rebuilt then return only that pane
            if (returnArray.length === 1) {
                return returnArray[0];
            }
            // Otherwise return all of the panes that have been rebuilt
            else {
                return returnArray;
            }
        };
        /**
         * Redraws all of the panes
         */
        SearchPanes.prototype.redrawPanes = function (rebuild) {
            if (rebuild === void 0) { rebuild = false; }
            var table = this.s.dt;
            // Only do this if the redraw isn't being triggered by the panes updating themselves
            if (!this.s.updating && !this.s.dt.page.info().serverSide) {
                var filterActive = true;
                var filterPane = this.s.filterPane;
                // If the number of rows currently visible is equal to the number of rows in the table
                //  then there can't be any filtering taking place
                if (table.rows({ search: 'applied' }).data().toArray().length === table.rows().data().toArray().length) {
                    filterActive = false;
                }
                // Otherwise if viewTotal is active then it is necessary to determine which panes a select is present in.
                //  If there is only one pane with a selection present then it should not show the filtered message as
                //  more selections may be made in that pane.
                else if (this.c.viewTotal) {
                    for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        if (pane.s.dtPane !== undefined) {
                            var selectLength = pane.s.dtPane.rows({ selected: true }).data().toArray().length;
                            if (selectLength === 0) {
                                for (var _b = 0, _c = this.s.selectionList; _b < _c.length; _b++) {
                                    var selection = _c[_b];
                                    if (selection.index === pane.s.index && selection.rows.length !== 0) {
                                        selectLength = selection.rows.length;
                                    }
                                }
                            }
                            // If filterPane === -1 then a pane with a selection has not been found yet, so set filterPane to that panes index
                            if (selectLength > 0 && filterPane === -1) {
                                filterPane = pane.s.index;
                            }
                            // Then if another pane is found with a selection then set filterPane to null to
                            //  show that multiple panes have selections present
                            else if (selectLength > 0) {
                                filterPane = null;
                            }
                        }
                    }
                }
                var deselectIdx = void 0;
                var newSelectionList = [];
                // Don't run this if it is due to the panes regenerating
                if (!this.regenerating) {
                    for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                        var pane = _e[_d];
                        // Identify the pane where a selection or deselection has been made and add it to the list.
                        if (pane.s.selectPresent) {
                            this.s.selectionList.push({ index: pane.s.index, rows: pane.s.dtPane.rows({ selected: true }).data().toArray(), protect: false });
                            table.state.save();
                            break;
                        }
                        else if (pane.s.deselect) {
                            deselectIdx = pane.s.index;
                            var selectedData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                            if (selectedData.length > 0) {
                                this.s.selectionList.push({ index: pane.s.index, rows: selectedData, protect: true });
                            }
                        }
                    }
                    if (this.s.selectionList.length > 0) {
                        var last = this.s.selectionList[this.s.selectionList.length - 1].index;
                        for (var _f = 0, _g = this.s.panes; _f < _g.length; _f++) {
                            var pane = _g[_f];
                            pane.s.lastSelect = (pane.s.index === last);
                        }
                    }
                    // Remove selections from the list from the pane where a deselect has taken place
                    for (var i = 0; i < this.s.selectionList.length; i++) {
                        if (this.s.selectionList[i].index !== deselectIdx || this.s.selectionList[i].protect === true) {
                            var further = false;
                            // Find out if this selection is the last one in the list for that pane
                            for (var j = i + 1; j < this.s.selectionList.length; j++) {
                                if (this.s.selectionList[j].index === this.s.selectionList[i].index) {
                                    further = true;
                                }
                            }
                            // If there are no selections for this pane in the list then just push this one
                            if (!further) {
                                newSelectionList.push(this.s.selectionList[i]);
                                this.s.selectionList[i].protect = false;
                            }
                        }
                    }
                    var solePane = -1;
                    if (newSelectionList.length === 1) {
                        solePane = newSelectionList[0].index;
                    }
                    // Update all of the panes to reflect the current state of the filters
                    for (var _h = 0, _j = this.s.panes; _h < _j.length; _h++) {
                        var pane = _j[_h];
                        if (pane.s.dtPane !== undefined) {
                            var tempFilter = true;
                            pane.s.filteringActive = true;
                            if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) ||
                                filterActive === false ||
                                pane.s.index === solePane) {
                                tempFilter = false;
                                pane.s.filteringActive = false;
                            }
                            pane.updatePane(!tempFilter ? false : filterActive);
                        }
                    }
                    // Update the label that shows how many filters are in place
                    this._updateFilterCount();
                    // If the length of the selections are different then some of them have been removed and a deselect has occured
                    if (newSelectionList.length > 0 && (newSelectionList.length < this.s.selectionList.length || rebuild)) {
                        this._cascadeRegen(newSelectionList);
                        var last = newSelectionList[newSelectionList.length - 1].index;
                        for (var _k = 0, _l = this.s.panes; _k < _l.length; _k++) {
                            var pane = _l[_k];
                            pane.s.lastSelect = (pane.s.index === last);
                        }
                    }
                    else if (newSelectionList.length > 0) {
                        // Update all of the other panes as you would just making a normal selection
                        for (var _m = 0, _o = this.s.panes; _m < _o.length; _m++) {
                            var paneUpdate = _o[_m];
                            if (paneUpdate.s.dtPane !== undefined) {
                                var tempFilter = true;
                                paneUpdate.s.filteringActive = true;
                                if ((filterPane !== -1 && filterPane !== null && filterPane === paneUpdate.s.index) || filterActive === false) {
                                    tempFilter = false;
                                    paneUpdate.s.filteringActive = false;
                                }
                                paneUpdate.updatePane(!tempFilter ? tempFilter : filterActive);
                            }
                        }
                    }
                }
                else {
                    var solePane = -1;
                    if (newSelectionList.length === 1) {
                        solePane = newSelectionList[0].index;
                    }
                    for (var _p = 0, _q = this.s.panes; _p < _q.length; _p++) {
                        var pane = _q[_p];
                        if (pane.s.dtPane !== undefined) {
                            var tempFilter = true;
                            pane.s.filteringActive = true;
                            if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) ||
                                filterActive === false ||
                                pane.s.index === solePane) {
                                tempFilter = false;
                                pane.s.filteringActive = false;
                            }
                            pane.updatePane(!tempFilter ? tempFilter : filterActive);
                        }
                    }
                    // Update the label that shows how many filters are in place
                    this._updateFilterCount();
                }
                if (!filterActive) {
                    this.s.selectionList = [];
                }
            }
        };
        /**
         * Attach the panes, buttons and title to the document
         */
        SearchPanes.prototype._attach = function () {
            var _this = this;
            $$1(this.dom.container).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).remove();
            $$1(this.dom.title).appendTo(this.dom.titleRow);
            // If the clear button is permitted attach it
            if (this.c.clear) {
                $$1(this.dom.clearAll).appendTo(this.dom.titleRow);
                $$1(this.dom.clearAll).on('click.dtsps', function () {
                    _this.clearSelections();
                });
            }
            $$1(this.dom.titleRow).appendTo(this.dom.container);
            // Attach the container for each individual pane to the overall container
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                $$1(pane.dom.container).appendTo(this.dom.panes);
            }
            // Attach everything to the document
            $$1(this.dom.panes).appendTo(this.dom.container);
            if ($$1('div.' + this.classes.container).length === 0) {
                $$1(this.dom.container).prependTo(this.s.dt);
            }
            return this.dom.container;
        };
        /**
         * Attach the top row containing the filter count and clear all button
         */
        SearchPanes.prototype._attachExtras = function () {
            $$1(this.dom.container).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).removeClass(this.classes.hide);
            $$1(this.dom.titleRow).remove();
            $$1(this.dom.title).appendTo(this.dom.titleRow);
            // If the clear button is permitted attach it
            if (this.c.clear) {
                $$1(this.dom.clearAll).appendTo(this.dom.titleRow);
            }
            $$1(this.dom.titleRow).appendTo(this.dom.container);
            return this.dom.container;
        };
        /**
         * If there are no panes to display then this method is called to either
         *   display a message in their place or hide them completely.
         */
        SearchPanes.prototype._attachMessage = function () {
            // Create a message to display on the screen
            var message;
            try {
                message = this.s.dt.i18n('searchPanes.emptyPanes', 'No SearchPanes');
            }
            catch (error) {
                message = null;
            }
            // If the message is an empty string then searchPanes.emptyPanes is undefined,
            //  therefore the pane container should be removed from the display
            if (message === null) {
                $$1(this.dom.container).addClass(this.classes.hide);
                $$1(this.dom.titleRow).removeClass(this.classes.hide);
                return;
            }
            else {
                $$1(this.dom.container).removeClass(this.classes.hide);
                $$1(this.dom.titleRow).addClass(this.classes.hide);
            }
            // Otherwise display the message
            $$1(this.dom.emptyMessage).text(message);
            this.dom.emptyMessage.appendTo(this.dom.container);
            return this.dom.container;
        };
        /**
         * Attaches the panes to the document and displays a message or hides if there are none
         */
        SearchPanes.prototype._attachPaneContainer = function () {
            // If a pane is to be displayed then attach the normal pane output
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    return this._attach();
                }
            }
            // Otherwise attach the custom message or remove the container from the display
            return this._attachMessage();
        };
        /**
         * Prepares the panes for selections to be made when cascade is active and a deselect has occured
         * @param newSelectionList the list of selections which are to be made
         */
        SearchPanes.prototype._cascadeRegen = function (newSelectionList) {
            // Set this to true so that the actions taken do not cause this to run until it is finished
            this.regenerating = true;
            // If only one pane has been selected then take note of its index
            var solePane = -1;
            if (newSelectionList.length === 1) {
                solePane = newSelectionList[0].index;
            }
            // Let the pane know that a cascadeRegen is taking place to avoid unexpected behaviour
            //  and clear all of the previous selections in the pane
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                pane.setCascadeRegen(true);
                pane.setClear(true);
                // If this is the same as the pane with the only selection then pass it as a parameter into clearPane
                if ((pane.s.dtPane !== undefined && pane.s.index === solePane) || pane.s.dtPane !== undefined) {
                    pane.clearPane();
                }
                pane.setClear(false);
            }
            // Remake Selections
            this._makeCascadeSelections(newSelectionList);
            // Set the selection list property to be the list without the selections from the deselect pane
            this.s.selectionList = newSelectionList;
            // The regeneration of selections is over so set it back to false
            for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                var pane = _c[_b];
                pane.setCascadeRegen(false);
            }
            this.regenerating = false;
        };
        /**
         * Attaches the message to the document but does not add any panes
         */
        SearchPanes.prototype._checkMessage = function () {
            // If a pane is to be displayed then attach the normal pane output
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    return;
                }
            }
            // Otherwise attach the custom message or remove the container from the display
            return this._attachMessage();
        };
        /**
         * Gets the selection list from the previous state and stores it in the selectionList Property
         */
        SearchPanes.prototype._getState = function () {
            var loadedFilter = this.s.dt.state.loaded();
            if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.selectionList !== undefined) {
                this.s.selectionList = loadedFilter.searchPanes.selectionList;
            }
        };
        /**
         * Makes all of the selections when cascade is active
         * @param newSelectionList the list of selections to be made, in the order they were originally selected
         */
        SearchPanes.prototype._makeCascadeSelections = function (newSelectionList) {
            // make selections in the order they were made previously, excluding those from the pane where a deselect was made
            for (var i = 0; i < newSelectionList.length; i++) {
                var _loop_1 = function (pane) {
                    if (pane.s.index === newSelectionList[i].index && pane.s.dtPane !== undefined) {
                        // When regenerating the cascade selections we need this flag so that the panes are only ignored if it
                        //  is the last selection and the pane for that selection
                        if (i === newSelectionList.length - 1) {
                            pane.s.lastCascade = true;
                        }
                        // if there are any selections currently in the pane then deselect them as we are about to make our new selections
                        if (pane.s.dtPane.rows({ selected: true }).data().toArray().length > 0 && pane.s.dtPane !== undefined) {
                            pane.setClear(true);
                            pane.clearPane();
                            pane.setClear(false);
                        }
                        var _loop_2 = function (row) {
                            pane.s.dtPane.rows().every(function (rowIdx) {
                                if (pane.s.dtPane.row(rowIdx).data() !== undefined &&
                                    row !== undefined &&
                                    pane.s.dtPane.row(rowIdx).data().filter === row.filter) {
                                    pane.s.dtPane.row(rowIdx).select();
                                }
                            });
                        };
                        // select every row in the pane that was selected previously
                        for (var _i = 0, _a = newSelectionList[i].rows; _i < _a.length; _i++) {
                            var row = _a[_i];
                            _loop_2(row);
                        }
                        // Update the label that shows how many filters are in place
                        this_1._updateFilterCount();
                        pane.s.lastCascade = false;
                    }
                };
                var this_1 = this;
                // As the selections may have been made across the panes in a different order to the pane index we must identify
                //  which pane has the index of the selection. This is also important for colreorder etc
                for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    _loop_1(pane);
                }
            }
            // Make sure that the state is saved after all of these selections
            this.s.dt.state.save();
        };
        /**
         * Declares the instances of individual searchpanes dependant on the number of columns.
         * It is necessary to run this once preInit has completed otherwise no panes will be
         *  created as the column count will be 0.
         * @param table the DataTable api for the parent table
         * @param paneSettings the settings passed into the constructor
         * @param opts the options passed into the constructor
         */
        SearchPanes.prototype._paneDeclare = function (table, paneSettings, opts) {
            var _this = this;
            // Create Panes
            table
                .columns(this.c.columns.length > 0 ? this.c.columns : undefined)
                .eq(0)
                .each(function (idx) {
                _this.s.panes.push(new SearchPane(paneSettings, opts, idx, _this.c.layout, _this.dom.panes));
            });
            // If there is any extra custom panes defined then create panes for them too
            var rowLength = table.columns().eq(0).toArray().length;
            var paneLength = this.c.panes.length;
            for (var i = 0; i < paneLength; i++) {
                var id = rowLength + i;
                this.s.panes.push(new SearchPane(paneSettings, opts, id, this.c.layout, this.dom.panes, this.c.panes[i]));
            }
            // If a custom ordering is being used
            if (this.c.order.length > 0) {
                // Make a new Array of panes based upon the order
                var newPanes = this.c.order.map(function (name, index, values) {
                    return _this._findPane(name);
                });
                // Remove the old panes from the dom
                this.dom.panes.empty();
                this.s.panes = newPanes;
                // Append the panes in the correct order
                for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    this.dom.panes.append(pane.dom.container);
                }
            }
            // If this internal property is true then the DataTable has been initialised already
            if (this.s.dt.settings()[0]._bInitComplete) {
                this._startup(table);
            }
            else {
                // Otherwise add the paneStartup function to the list of functions that are to be run when the table is initialised
                // This will garauntee that the panes are initialised before the init event and init Complete callback is fired
                this.s.dt.settings()[0].aoInitComplete.push({ fn: function () {
                        _this._startup(table);
                    } });
            }
        };
        /**
         * Finds a pane based upon the name of that pane
         * @param name string representing the name of the pane
         * @returns SearchPane The pane which has that name
         */
        SearchPanes.prototype._findPane = function (name) {
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (name === pane.s.name) {
                    return pane;
                }
            }
        };
        /**
         * Works out which panes to update when data is recieved from the server and viewTotal is active
         */
        SearchPanes.prototype._serverTotals = function () {
            var selectPresent = false;
            var deselectPresent = false;
            var table = this.s.dt;
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                // Identify the pane where a selection or deselection has been made and add it to the list.
                if (pane.s.selectPresent) {
                    this.s.selectionList.push({ index: pane.s.index, rows: pane.s.dtPane.rows({ selected: true }).data().toArray(), protect: false });
                    table.state.save();
                    pane.s.selectPresent = false;
                    selectPresent = true;
                    break;
                }
                else if (pane.s.deselect) {
                    var selectedData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                    if (selectedData.length > 0) {
                        this.s.selectionList.push({ index: pane.s.index, rows: selectedData, protect: true });
                    }
                    selectPresent = true;
                    deselectPresent = true;
                }
            }
            // Build an updated list based on any selections or deselections added
            if (!selectPresent) {
                this.s.selectionList = [];
            }
            else {
                var newSelectionList = [];
                for (var i = 0; i < this.s.selectionList.length; i++) {
                    var further = false;
                    // Find out if this selection is the last one in the list for that pane
                    for (var j = i + 1; j < this.s.selectionList.length; j++) {
                        if (this.s.selectionList[j].index === this.s.selectionList[i].index) {
                            further = true;
                        }
                    }
                    // If there are no selections for this pane in the list then just push this one
                    if (!further) {
                        var push = false;
                        for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                            var pane = _c[_b];
                            if (pane.s.index === this.s.selectionList[i].index &&
                                pane.s.dtPane.rows({ selected: true }).data().toArray().length > 0) {
                                push = true;
                            }
                        }
                        if (push) {
                            newSelectionList.push(this.s.selectionList[i]);
                        }
                    }
                }
                this.s.selectionList = newSelectionList;
            }
            var initIdx = -1;
            // If there has been a deselect and only one pane has a selection then update everything
            if (deselectPresent && this.s.selectionList.length === 1) {
                for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                    var pane = _e[_d];
                    pane.s.lastSelect = false;
                    pane.s.deselect = false;
                    if (pane.s.dtPane !== undefined && pane.s.dtPane.rows({ selected: true }).data().toArray().length > 0) {
                        initIdx = pane.s.index;
                    }
                }
            }
            // Otherwise if there are more 1 selections then find the last one and set it to not update that pane
            else if (this.s.selectionList.length > 0) {
                var last = this.s.selectionList[this.s.selectionList.length - 1].index;
                for (var _f = 0, _g = this.s.panes; _f < _g.length; _f++) {
                    var pane = _g[_f];
                    pane.s.lastSelect = (pane.s.index === last);
                    pane.s.deselect = false;
                }
            }
            // Otherwise if there are no selections then find where that took place and do not update to maintain scrolling
            else if (this.s.selectionList.length === 0) {
                for (var _h = 0, _j = this.s.panes; _h < _j.length; _h++) {
                    var pane = _j[_h];
                    // pane.s.lastSelect = (pane.s.deselect === true);
                    pane.s.lastSelect = false;
                    pane.s.deselect = false;
                }
            }
            $$1(this.dom.panes).empty();
            // Rebuild the desired panes
            for (var _k = 0, _l = this.s.panes; _k < _l.length; _k++) {
                var pane = _l[_k];
                if (!pane.s.lastSelect) {
                    pane.rebuildPane(undefined, this.s.dt.page.info().serverSide ? this.s.serverData : undefined, pane.s.index === initIdx ? true : null, true);
                }
                else {
                    pane._setListeners();
                }
                // append all of the panes and enable select
                $$1(this.dom.panes).append(pane.dom.container);
                if (pane.s.dtPane !== undefined) {
                    $$1(pane.s.dtPane.table().node()).parent()[0].scrollTop = pane.s.scrollTop;
                    $$1.fn.dataTable.select.init(pane.s.dtPane);
                }
            }
            // Only need to trigger a search if it is not server side processing
            if (!this.s.dt.page.info().serverSide) {
                this.s.dt.draw();
            }
        };
        /**
         * Initialises the tables previous/preset selections and initialises callbacks for events
         * @param table the parent table for which the searchPanes are being created
         */
        SearchPanes.prototype._startup = function (table) {
            var _this = this;
            $$1(this.dom.container).text('');
            // Attach clear button and title bar to the document
            this._attachExtras();
            $$1(this.dom.container).append(this.dom.panes);
            $$1(this.dom.panes).empty();
            var loadedFilter = this.s.dt.state.loaded();
            if (this.c.viewTotal && !this.c.cascadePanes) {
                if (loadedFilter !== null &&
                    loadedFilter !== undefined &&
                    loadedFilter.searchPanes !== undefined &&
                    loadedFilter.searchPanes.panes !== undefined) {
                    var filterActive = false;
                    for (var _i = 0, _a = loadedFilter.searchPanes.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        if (pane.selected.length > 0) {
                            filterActive = true;
                            break;
                        }
                    }
                    if (filterActive) {
                        for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                            var pane = _c[_b];
                            pane.s.showFiltered = true;
                        }
                    }
                }
            }
            for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                var pane = _e[_d];
                pane.rebuildPane(undefined, Object.keys(this.s.serverData).length > 0 ? this.s.serverData : undefined);
                $$1(this.dom.panes).append(pane.dom.container);
            }
            // Only need to trigger a search if it is not server side processing
            if (!this.s.dt.page.info().serverSide) {
                this.s.dt.draw();
            }
            // Reset the paging if that has been saved in the state
            if (!this.s.stateRead && loadedFilter !== null && loadedFilter !== undefined) {
                this.s.dt.page((loadedFilter.start / this.s.dt.page.len()));
                this.s.dt.draw('page');
            }
            this.s.stateRead = true;
            if (this.c.viewTotal && !this.c.cascadePanes) {
                for (var _f = 0, _g = this.s.panes; _f < _g.length; _f++) {
                    var pane = _g[_f];
                    pane.updatePane();
                }
            }
            this._updateFilterCount();
            this._checkMessage();
            // When a draw is called on the DataTable, update all of the panes incase the data in the DataTable has changed
            table.on('preDraw.dtsps', function () {
                _this._updateFilterCount();
                if ((_this.c.cascadePanes || _this.c.viewTotal) && !_this.s.dt.page.info().serverSide) {
                    _this.redrawPanes();
                }
                else {
                    _this._updateSelection();
                }
                _this.s.filterPane = -1;
            });
            // Whenever a state save occurs store the selection list in the state object
            this.s.dt.on('stateSaveParams.dtsp', function (e, settings, data) {
                if (data.searchPanes === undefined) {
                    data.searchPanes = {};
                }
                data.searchPanes.selectionList = _this.s.selectionList;
            });
            if (this.s.dt.page.info().serverSide) {
                table.off('page');
                table.on('page', function () {
                    _this.s.page = _this.s.dt.page();
                });
                table.off('preXhr.dt');
                table.on('preXhr.dt', function (e, settings, data) {
                    if (data.searchPanes === undefined) {
                        data.searchPanes = {};
                    }
                    // Count how many filters are being applied
                    var filterCount = 0;
                    for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        var src = _this.s.dt.column(pane.s.index).dataSrc();
                        if (data.searchPanes[src] === undefined) {
                            data.searchPanes[src] = {};
                        }
                        if (pane.s.dtPane !== undefined) {
                            var rowData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                            for (var i = 0; i < rowData.length; i++) {
                                data.searchPanes[src][i] = rowData[i].filter;
                                filterCount++;
                            }
                        }
                    }
                    if (_this.c.viewTotal) {
                        _this._prepViewTotal();
                    }
                    // If there is a filter to be applied, then we need to read from the start of the result set
                    //  and set the paging to 0. This matches the behaviour of client side processing
                    if (filterCount > 0) {
                        // If the number of filters has changed we need to read from the start of the result set and reset the paging
                        if (filterCount !== _this.s.filterCount) {
                            data.start = 0;
                            _this.s.page = 0;
                        }
                        // Otherwise it is a paging request and we need to read from whatever the paging has been set to
                        else {
                            data.start = _this.s.page * _this.s.dt.page.len();
                        }
                        _this.s.dt.page(_this.s.page);
                        _this.s.filterCount = filterCount;
                    }
                });
            }
            else {
                table.on('preXhr.dt', function (e, settings, data) {
                    for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        pane.clearData();
                    }
                });
            }
            // If the data is reloaded from the server then it is possible that it has changed completely,
            // so we need to rebuild the panes
            this.s.dt.on('xhr', function (e, settings, json, xhr) {
                var processing = false;
                if (!_this.s.dt.page.info().serverSide) {
                    _this.s.dt.one('preDraw', function () {
                        if (processing) {
                            return;
                        }
                        var page = _this.s.dt.page();
                        processing = true;
                        $$1(_this.dom.panes).empty();
                        for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                            var pane = _a[_i];
                            pane.clearData(); // Clears all of the bins and will mean that the data has to be re-read
                            // Pass a boolean to say whether this is the last choice made for maintaining selections when rebuilding
                            pane.rebuildPane(_this.s.selectionList[_this.s.selectionList.length - 1] !== undefined ?
                                pane.s.index === _this.s.selectionList[_this.s.selectionList.length - 1].index :
                                false, undefined, undefined, true);
                            $$1(_this.dom.panes).append(pane.dom.container);
                        }
                        if (!_this.s.dt.page.info().serverSide) {
                            _this.s.dt.draw();
                        }
                        if (_this.c.cascadePanes || _this.c.viewTotal) {
                            _this.redrawPanes(_this.c.cascadePanes);
                        }
                        else {
                            _this._updateSelection();
                        }
                        _this._checkMessage();
                        _this.s.dt.one('draw', function () {
                            _this.s.dt.page(page).draw(false);
                        });
                    });
                }
            });
            // PreSelect any selections which have been defined using the preSelect option
            for (var _h = 0, _j = this.s.panes; _h < _j.length; _h++) {
                var pane = _j[_h];
                if (pane !== undefined &&
                    pane.s.dtPane !== undefined &&
                    ((pane.s.colOpts.preSelect !== undefined && pane.s.colOpts.preSelect.length > 0) ||
                        (pane.customPaneSettings !== null &&
                            pane.customPaneSettings.preSelect !== undefined &&
                            pane.customPaneSettings.preSelect.length > 0))) {
                    var tableLength = pane.s.dtPane.rows().data().toArray().length;
                    for (var i = 0; i < tableLength; i++) {
                        if (pane.s.colOpts.preSelect.indexOf(pane.s.dtPane.cell(i, 0).data()) !== -1 ||
                            (pane.customPaneSettings !== null &&
                                pane.customPaneSettings.preSelect !== undefined &&
                                pane.customPaneSettings.preSelect.indexOf(pane.s.dtPane.cell(i, 0).data()) !== -1)) {
                            pane.s.dtPane.row(i).select();
                        }
                    }
                    pane.updateTable();
                }
            }
            if (this.s.selectionList !== undefined && this.s.selectionList.length > 0) {
                var last = this.s.selectionList[this.s.selectionList.length - 1].index;
                for (var _k = 0, _l = this.s.panes; _k < _l.length; _k++) {
                    var pane = _l[_k];
                    pane.s.lastSelect = (pane.s.index === last);
                }
            }
            // If cascadePanes is active then make the previous selections in the order they were previously
            if (this.s.selectionList.length > 0 && this.c.cascadePanes) {
                this._cascadeRegen(this.s.selectionList);
            }
            // Update the title bar to show how many filters have been selected
            this._updateFilterCount();
            // If the table is destroyed and restarted then clear the selections so that they do not persist.
            table.on('destroy.dtsps', function () {
                for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    pane.destroy();
                }
                table.off('.dtsps');
                $$1(_this.dom.clearAll).off('.dtsps');
                $$1(_this.dom.container).remove();
                _this.clearSelections();
            });
            // When the clear All button has been pressed clear all of the selections in the panes
            if (this.c.clear) {
                $$1(this.dom.clearAll).on('click.dtsps', function () {
                    _this.clearSelections();
                });
            }
            table.settings()[0]._searchPanes = this;
        };
        SearchPanes.prototype._prepViewTotal = function () {
            var filterPane = this.s.filterPane;
            var filterActive = false;
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    var selectLength = pane.s.dtPane.rows({ selected: true }).data().toArray().length;
                    // If filterPane === -1 then a pane with a selection has not been found yet, so set filterPane to that panes index
                    if (selectLength > 0 && filterPane === -1) {
                        filterPane = pane.s.index;
                        filterActive = true;
                    }
                    // Then if another pane is found with a selection then set filterPane to null to
                    //  show that multiple panes have selections present
                    else if (selectLength > 0) {
                        filterPane = null;
                    }
                }
            }
            // Update all of the panes to reflect the current state of the filters
            for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                var pane = _c[_b];
                if (pane.s.dtPane !== undefined) {
                    pane.s.filteringActive = true;
                    if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) || filterActive === false) {
                        pane.s.filteringActive = false;
                    }
                }
            }
        };
        /**
         * Updates the number of filters that have been applied in the title
         */
        SearchPanes.prototype._updateFilterCount = function () {
            var filterCount = 0;
            // Add the number of all of the filters throughout the panes
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    filterCount += pane.getPaneCount();
                }
            }
            // Run the message through the internationalisation method to improve readability
            var message = this.s.dt.i18n('searchPanes.title', 'Filters Active - %d', filterCount);
            $$1(this.dom.title).text(message);
            if (this.c.filterChanged !== undefined && typeof this.c.filterChanged === 'function') {
                this.c.filterChanged.call(this.s.dt, filterCount);
            }
        };
        /**
         * Updates the selectionList when cascade is not in place
         */
        SearchPanes.prototype._updateSelection = function () {
            this.s.selectionList = [];
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    this.s.selectionList.push({ index: pane.s.index, rows: pane.s.dtPane.rows({ selected: true }).data().toArray(), protect: false });
                }
            }
            this.s.dt.state.save();
        };
        SearchPanes.version = '1.2.2';
        SearchPanes.classes = {
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            container: 'dtsp-searchPanes',
            emptyMessage: 'dtsp-emptyMessage',
            hide: 'dtsp-hidden',
            panes: 'dtsp-panesContainer',
            search: 'dtsp-search',
            title: 'dtsp-title',
            titleRow: 'dtsp-titleRow'
        };
        // Define SearchPanes default options
        SearchPanes.defaults = {
            cascadePanes: false,
            clear: true,
            container: function (dt) {
                return dt.table().container();
            },
            columns: [],
            filterChanged: undefined,
            layout: 'columns-3',
            order: [],
            panes: [],
            viewTotal: false
        };
        return SearchPanes;
    }());
  
    /*! SearchPanes 1.2.2
     * 2019-2020 SpryMedia Ltd - datatables.net/license
     */
    // DataTables extensions common UMD. Note that this allows for AMD, CommonJS
    // (with window and jQuery being allowed as parameters to the returned
    // function) or just default browser loading.
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD
            define(['jquery', 'datatables.net'], function ($) {
                return factory($, window, document);
            });
        }
        else if (typeof exports === 'object') {
            // CommonJS
            module.exports = function (root, $) {
                if (!root) {
                    root = window;
                }
                if (!$ || !$.fn.dataTable) {
                    $ = require('datatables.net')(root, $).$;
                }
                return factory($, root, root.document);
            };
        }
        else {
            // Browser - assume jQuery has already been loaded
            factory(window.jQuery, window, document);
        }
    }(function ($, window, document) {
        setJQuery($);
        setJQuery$1($);
        var DataTable = $.fn.dataTable;
        $.fn.dataTable.SearchPanes = SearchPanes;
        $.fn.DataTable.SearchPanes = SearchPanes;
        $.fn.dataTable.SearchPane = SearchPane;
        $.fn.DataTable.SearchPane = SearchPane;
        var apiRegister = $.fn.dataTable.Api.register;
        apiRegister('searchPanes()', function () {
            return this;
        });
        apiRegister('searchPanes.clearSelections()', function () {
            return this.iterator('table', function (ctx) {
                if (ctx._searchPanes) {
                    ctx._searchPanes.clearSelections();
                }
            });
        });
        apiRegister('searchPanes.rebuildPane()', function (targetIdx, maintainSelections) {
            return this.iterator('table', function (ctx) {
                if (ctx._searchPanes) {
                    ctx._searchPanes.rebuild(targetIdx, maintainSelections);
                }
            });
        });
        apiRegister('searchPanes.container()', function () {
            var ctx = this.context[0];
            return ctx._searchPanes
                ? ctx._searchPanes.getNode()
                : null;
        });
        $.fn.dataTable.ext.buttons.searchPanesClear = {
            text: 'Clear Panes',
            action: function (e, dt, node, config) {
                dt.searchPanes.clearSelections();
            }
        };
        $.fn.dataTable.ext.buttons.searchPanes = {
            action: function (e, dt, node, config) {
                e.stopPropagation();
                this.popover(config._panes.getNode(), {
                    align: 'dt-container'
                });
                config._panes.rebuild(undefined, true);
            },
            config: {},
            init: function (dt, node, config) {
                var panes = new $.fn.dataTable.SearchPanes(dt, $.extend({
                    filterChanged: function (count) {
                        dt.button(node).text(dt.i18n('searchPanes.collapse', { 0: 'SearchPanes', _: 'SearchPanes (%d)' }, count));
                    }
                }, config.config));
                var message = dt.i18n('searchPanes.collapse', 'SearchPanes', 0);
                dt.button(node).text(message);
                config._panes = panes;
            },
            text: 'Search Panes'
        };
        function _init(settings, fromPre) {
            if (fromPre === void 0) { fromPre = false; }
            var api = new DataTable.Api(settings);
            var opts = api.init().searchPanes || DataTable.defaults.searchPanes;
            var searchPanes = new SearchPanes(api, opts, fromPre);
            var node = searchPanes.getNode();
            return node;
        }
        // Attach a listener to the document which listens for DataTables initialisation
        // events so we can automatically initialise
        $(document).on('preInit.dt.dtsp', function (e, settings, json) {
            if (e.namespace !== 'dt') {
                return;
            }
            if (settings.oInit.searchPanes ||
                DataTable.defaults.searchPanes) {
                if (!settings._searchPanes) {
                    _init(settings, true);
                }
            }
        });
        // DataTables `dom` feature option
        DataTable.ext.feature.push({
            cFeature: 'P',
            fnInit: _init
        });
        // DataTables 2 layout feature
        if (DataTable.ext.features) {
            DataTable.ext.features.register('searchPanes', _init);
        }
    }));
  
  }());
  
  
  (function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'datatables.net-dt', 'datatables.net-searchpanes'], function ($) {
            return factory($, window, document);
        });
    }
    else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }
            if (!$ || !$.fn.dataTable) {
                $ = require('datatables.net-dt')(root, $).$;
            }
            if (!$.fn.dataTable.SearchPanes) {
                require('datatables.net-searchpanes')(root, $);
            }
            return factory($, root, root.document);
        };
    }
    else {
        // Browser
        factory(jQuery, window, document);
    }
  }(function ($, window, document) {
    'use strict';
    var DataTable = $.fn.dataTable;
    return DataTable.searchPanes;
  }));
  
  // dataTables.searchPanes
  /*!
   SearchPanes 1.2.2
   2019-2020 SpryMedia Ltd - datatables.net/license
  */
  var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.getGlobal=function(m){m=["object"==typeof globalThis&&globalThis,m,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var t=0;t<m.length;++t){var h=m[t];if(h&&h.Math==Math)return h}throw Error("Cannot find global object");};$jscomp.global=$jscomp.getGlobal(this);
  $jscomp.checkEs6ConformanceViaProxy=function(){try{var m={},t=Object.create(new $jscomp.global.Proxy(m,{get:function(h,r,v){return h==m&&"q"==r&&v==t}}));return!0===t.q}catch(h){return!1}};$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS=!1;$jscomp.ES6_CONFORMANCE=$jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS&&$jscomp.checkEs6ConformanceViaProxy();$jscomp.arrayIteratorImpl=function(m){var t=0;return function(){return t<m.length?{done:!1,value:m[t++]}:{done:!0}}};$jscomp.arrayIterator=function(m){return{next:$jscomp.arrayIteratorImpl(m)}};
  $jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.SIMPLE_FROUND_POLYFILL=!1;$jscomp.ISOLATE_POLYFILLS=!1;$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(m,t,h){if(m==Array.prototype||m==Object.prototype)return m;m[t]=h.value;return m};$jscomp.IS_SYMBOL_NATIVE="function"===typeof Symbol&&"symbol"===typeof Symbol("x");$jscomp.TRUST_ES6_POLYFILLS=!$jscomp.ISOLATE_POLYFILLS||$jscomp.IS_SYMBOL_NATIVE;
  $jscomp.polyfills={};$jscomp.propertyToPolyfillSymbol={};$jscomp.POLYFILL_PREFIX="$jscp$";var $jscomp$lookupPolyfilledValue=function(m,t){var h=$jscomp.propertyToPolyfillSymbol[t];if(null==h)return m[t];h=m[h];return void 0!==h?h:m[t]};$jscomp.polyfill=function(m,t,h,r){t&&($jscomp.ISOLATE_POLYFILLS?$jscomp.polyfillIsolated(m,t,h,r):$jscomp.polyfillUnisolated(m,t,h,r))};
  $jscomp.polyfillUnisolated=function(m,t,h,r){h=$jscomp.global;m=m.split(".");for(r=0;r<m.length-1;r++){var v=m[r];if(!(v in h))return;h=h[v]}m=m[m.length-1];r=h[m];t=t(r);t!=r&&null!=t&&$jscomp.defineProperty(h,m,{configurable:!0,writable:!0,value:t})};
  $jscomp.polyfillIsolated=function(m,t,h,r){var v=m.split(".");m=1===v.length;r=v[0];r=!m&&r in $jscomp.polyfills?$jscomp.polyfills:$jscomp.global;for(var q=0;q<v.length-1;q++){var A=v[q];if(!(A in r))return;r=r[A]}v=v[v.length-1];h=$jscomp.IS_SYMBOL_NATIVE&&"es6"===h?r[v]:null;t=t(h);null!=t&&(m?$jscomp.defineProperty($jscomp.polyfills,v,{configurable:!0,writable:!0,value:t}):t!==h&&($jscomp.propertyToPolyfillSymbol[v]=$jscomp.IS_SYMBOL_NATIVE?$jscomp.global.Symbol(v):$jscomp.POLYFILL_PREFIX+v,v=
  $jscomp.propertyToPolyfillSymbol[v],$jscomp.defineProperty(r,v,{configurable:!0,writable:!0,value:t})))};$jscomp.initSymbol=function(){};
  $jscomp.polyfill("Symbol",function(m){if(m)return m;var t=function(v,q){this.$jscomp$symbol$id_=v;$jscomp.defineProperty(this,"description",{configurable:!0,writable:!0,value:q})};t.prototype.toString=function(){return this.$jscomp$symbol$id_};var h=0,r=function(v){if(this instanceof r)throw new TypeError("Symbol is not a constructor");return new t("jscomp_symbol_"+(v||"")+"_"+h++,v)};return r},"es6","es3");$jscomp.initSymbolIterator=function(){};
  $jscomp.polyfill("Symbol.iterator",function(m){if(m)return m;m=Symbol("Symbol.iterator");for(var t="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),h=0;h<t.length;h++){var r=$jscomp.global[t[h]];"function"===typeof r&&"function"!=typeof r.prototype[m]&&$jscomp.defineProperty(r.prototype,m,{configurable:!0,writable:!0,value:function(){return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this))}})}return m},"es6",
  "es3");$jscomp.initSymbolAsyncIterator=function(){};$jscomp.iteratorPrototype=function(m){m={next:m};m[Symbol.iterator]=function(){return this};return m};$jscomp.makeIterator=function(m){var t="undefined"!=typeof Symbol&&Symbol.iterator&&m[Symbol.iterator];return t?t.call(m):$jscomp.arrayIterator(m)};$jscomp.owns=function(m,t){return Object.prototype.hasOwnProperty.call(m,t)};
  $jscomp.polyfill("WeakMap",function(m){function t(){if(!m||!Object.seal)return!1;try{var a=Object.seal({}),b=Object.seal({}),c=new m([[a,2],[b,3]]);if(2!=c.get(a)||3!=c.get(b))return!1;c.delete(a);c.set(b,4);return!c.has(a)&&4==c.get(b)}catch(d){return!1}}function h(){}function r(a){var b=typeof a;return"object"===b&&null!==a||"function"===b}function v(a){if(!$jscomp.owns(a,A)){var b=new h;$jscomp.defineProperty(a,A,{value:b})}}function q(a){if(!$jscomp.ISOLATE_POLYFILLS){var b=Object[a];b&&(Object[a]=
  function(c){if(c instanceof h)return c;Object.isExtensible(c)&&v(c);return b(c)})}}if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(m&&$jscomp.ES6_CONFORMANCE)return m}else if(t())return m;var A="$jscomp_hidden_"+Math.random();q("freeze");q("preventExtensions");q("seal");var G=0,k=function(a){this.id_=(G+=Math.random()+1).toString();if(a){a=$jscomp.makeIterator(a);for(var b;!(b=a.next()).done;)b=b.value,this.set(b[0],b[1])}};k.prototype.set=function(a,b){if(!r(a))throw Error("Invalid WeakMap key");
  v(a);if(!$jscomp.owns(a,A))throw Error("WeakMap key fail: "+a);a[A][this.id_]=b;return this};k.prototype.get=function(a){return r(a)&&$jscomp.owns(a,A)?a[A][this.id_]:void 0};k.prototype.has=function(a){return r(a)&&$jscomp.owns(a,A)&&$jscomp.owns(a[A],this.id_)};k.prototype.delete=function(a){return r(a)&&$jscomp.owns(a,A)&&$jscomp.owns(a[A],this.id_)?delete a[A][this.id_]:!1};return k},"es6","es3");$jscomp.MapEntry=function(){};
  $jscomp.polyfill("Map",function(m){function t(){if($jscomp.ASSUME_NO_NATIVE_MAP||!m||"function"!=typeof m||!m.prototype.entries||"function"!=typeof Object.seal)return!1;try{var k=Object.seal({x:4}),a=new m($jscomp.makeIterator([[k,"s"]]));if("s"!=a.get(k)||1!=a.size||a.get({x:4})||a.set({x:4},"t")!=a||2!=a.size)return!1;var b=a.entries(),c=b.next();if(c.done||c.value[0]!=k||"s"!=c.value[1])return!1;c=b.next();return c.done||4!=c.value[0].x||"t"!=c.value[1]||!b.next().done?!1:!0}catch(d){return!1}}
  if($jscomp.USE_PROXY_FOR_ES6_CONFORMANCE_CHECKS){if(m&&$jscomp.ES6_CONFORMANCE)return m}else if(t())return m;var h=new WeakMap,r=function(k){this.data_={};this.head_=A();this.size=0;if(k){k=$jscomp.makeIterator(k);for(var a;!(a=k.next()).done;)a=a.value,this.set(a[0],a[1])}};r.prototype.set=function(k,a){k=0===k?0:k;var b=v(this,k);b.list||(b.list=this.data_[b.id]=[]);b.entry?b.entry.value=a:(b.entry={next:this.head_,previous:this.head_.previous,head:this.head_,key:k,value:a},b.list.push(b.entry),
  this.head_.previous.next=b.entry,this.head_.previous=b.entry,this.size++);return this};r.prototype.delete=function(k){k=v(this,k);return k.entry&&k.list?(k.list.splice(k.index,1),k.list.length||delete this.data_[k.id],k.entry.previous.next=k.entry.next,k.entry.next.previous=k.entry.previous,k.entry.head=null,this.size--,!0):!1};r.prototype.clear=function(){this.data_={};this.head_=this.head_.previous=A();this.size=0};r.prototype.has=function(k){return!!v(this,k).entry};r.prototype.get=function(k){return(k=
  v(this,k).entry)&&k.value};r.prototype.entries=function(){return q(this,function(k){return[k.key,k.value]})};r.prototype.keys=function(){return q(this,function(k){return k.key})};r.prototype.values=function(){return q(this,function(k){return k.value})};r.prototype.forEach=function(k,a){for(var b=this.entries(),c;!(c=b.next()).done;)c=c.value,k.call(a,c[1],c[0],this)};r.prototype[Symbol.iterator]=r.prototype.entries;var v=function(k,a){var b=a&&typeof a;"object"==b||"function"==b?h.has(a)?b=h.get(a):
  (b=""+ ++G,h.set(a,b)):b="p_"+a;var c=k.data_[b];if(c&&$jscomp.owns(k.data_,b))for(k=0;k<c.length;k++){var d=c[k];if(a!==a&&d.key!==d.key||a===d.key)return{id:b,list:c,index:k,entry:d}}return{id:b,list:c,index:-1,entry:void 0}},q=function(k,a){var b=k.head_;return $jscomp.iteratorPrototype(function(){if(b){for(;b.head!=k.head_;)b=b.previous;for(;b.next!=b.head;)return b=b.next,{done:!1,value:a(b)};b=null}return{done:!0,value:void 0}})},A=function(){var k={};return k.previous=k.next=k.head=k},G=0;
  return r},"es6","es3");$jscomp.findInternal=function(m,t,h){m instanceof String&&(m=String(m));for(var r=m.length,v=0;v<r;v++){var q=m[v];if(t.call(h,q,v,m))return{i:v,v:q}}return{i:-1,v:void 0}};$jscomp.polyfill("Array.prototype.find",function(m){return m?m:function(t,h){return $jscomp.findInternal(this,t,h).v}},"es6","es3");
  $jscomp.iteratorFromArray=function(m,t){m instanceof String&&(m+="");var h=0,r={next:function(){if(h<m.length){var v=h++;return{value:t(v,m[v]),done:!1}}r.next=function(){return{done:!0,value:void 0}};return r.next()}};r[Symbol.iterator]=function(){return r};return r};$jscomp.polyfill("Array.prototype.keys",function(m){return m?m:function(){return $jscomp.iteratorFromArray(this,function(t){return t})}},"es6","es3");
  $jscomp.polyfill("Array.prototype.findIndex",function(m){return m?m:function(t,h){return $jscomp.findInternal(this,t,h).i}},"es6","es3");
  (function(){function m(k){h=k;r=k.fn.dataTable}function t(k){q=k;A=k.fn.dataTable}var h,r,v=function(){function k(a,b,c,d,e,g){var f=this;void 0===g&&(g=null);if(!r||!r.versionCheck||!r.versionCheck("1.10.0"))throw Error("SearchPane requires DataTables 1.10 or newer");if(!r.select)throw Error("SearchPane requires Select");a=new r.Api(a);this.classes=h.extend(!0,{},k.classes);this.c=h.extend(!0,{},k.defaults,b);this.customPaneSettings=g;this.s={cascadeRegen:!1,clearing:!1,colOpts:[],deselect:!1,displayed:!1,
  dt:a,dtPane:void 0,filteringActive:!1,index:c,indexes:[],lastCascade:!1,lastSelect:!1,listSet:!1,name:void 0,redraw:!1,rowData:{arrayFilter:[],arrayOriginal:[],arrayTotals:[],bins:{},binsOriginal:{},binsTotal:{},filterMap:new Map,totalOptions:0},scrollTop:0,searchFunction:void 0,selectPresent:!1,serverSelect:[],serverSelecting:!1,showFiltered:!1,tableLength:null,updating:!1};b=a.columns().eq(0).toArray().length;this.colExists=this.s.index<b;this.c.layout=d;b=parseInt(d.split("-")[1],10);this.dom=
  {buttonGroup:h("<div/>").addClass(this.classes.buttonGroup),clear:h('<button type="button">&#215;</button>').addClass(this.classes.dull).addClass(this.classes.paneButton).addClass(this.classes.clearButton),container:h("<div/>").addClass(this.classes.container).addClass(this.classes.layout+(10>b?d:d.split("-")[0]+"-9")),countButton:h('<button type="button"></button>').addClass(this.classes.paneButton).addClass(this.classes.countButton),dtP:h("<table><thead><tr><th>"+(this.colExists?h(a.column(this.colExists?
  this.s.index:0).header()).text():this.customPaneSettings.header||"Custom Pane")+"</th><th/></tr></thead></table>"),lower:h("<div/>").addClass(this.classes.subRow2).addClass(this.classes.narrowButton),nameButton:h('<button type="button"></button>').addClass(this.classes.paneButton).addClass(this.classes.nameButton),panesContainer:e,searchBox:h("<input/>").addClass(this.classes.paneInputButton).addClass(this.classes.search),searchButton:h('<button type = "button" class="'+this.classes.searchIcon+'"></button>').addClass(this.classes.paneButton),
  searchCont:h("<div/>").addClass(this.classes.searchCont),searchLabelCont:h("<div/>").addClass(this.classes.searchLabelCont),topRow:h("<div/>").addClass(this.classes.topRow),upper:h("<div/>").addClass(this.classes.subRow1).addClass(this.classes.narrowSearch)};this.s.displayed=!1;a=this.s.dt;this.selections=[];this.s.colOpts=this.colExists?this._getOptions():this._getBonusOptions();var l=this.s.colOpts;d=h('<button type="button">X</button>').addClass(this.classes.paneButton);h(d).text(a.i18n("searchPanes.clearPane",
  "X"));this.dom.container.addClass(l.className);this.dom.container.addClass(null!==this.customPaneSettings&&void 0!==this.customPaneSettings.className?this.customPaneSettings.className:"");this.s.name=void 0!==this.s.colOpts.name?this.s.colOpts.name:null!==this.customPaneSettings&&void 0!==this.customPaneSettings.name?this.customPaneSettings.name:this.colExists?h(a.column(this.s.index).header()).text():this.customPaneSettings.header||"Custom Pane";h(e).append(this.dom.container);var p=a.table(0).node();
  this.s.searchFunction=function(n,x,z,y){if(0===f.selections.length||n.nTable!==p)return!0;n=null;f.colExists&&(n=x[f.s.index],"filter"!==l.orthogonal.filter&&(n=f.s.rowData.filterMap.get(z),n instanceof h.fn.dataTable.Api&&(n=n.toArray())));return f._search(n,z)};h.fn.dataTable.ext.search.push(this.s.searchFunction);if(this.c.clear)h(d).on("click",function(){f.dom.container.find(f.classes.search).each(function(){h(this).val("");h(this).trigger("input")});f.clearPane()});a.on("draw.dtsp",function(){f._adjustTopRow()});
  a.on("buttons-action",function(){f._adjustTopRow()});h(window).on("resize.dtsp",r.util.throttle(function(){f._adjustTopRow()}));a.on("column-reorder.dtsp",function(n,x,z){f.s.index=z.mapping[f.s.index]});return this}k.prototype.clearData=function(){this.s.rowData={arrayFilter:[],arrayOriginal:[],arrayTotals:[],bins:{},binsOriginal:{},binsTotal:{},filterMap:new Map,totalOptions:0}};k.prototype.clearPane=function(){this.s.dtPane.rows({selected:!0}).deselect();this.updateTable();return this};k.prototype.destroy=
  function(){h(this.s.dtPane).off(".dtsp");h(this.s.dt).off(".dtsp");h(this.dom.nameButton).off(".dtsp");h(this.dom.countButton).off(".dtsp");h(this.dom.clear).off(".dtsp");h(this.dom.searchButton).off(".dtsp");h(this.dom.container).remove();for(var a=h.fn.dataTable.ext.search.indexOf(this.s.searchFunction);-1!==a;)h.fn.dataTable.ext.search.splice(a,1),a=h.fn.dataTable.ext.search.indexOf(this.s.searchFunction);void 0!==this.s.dtPane&&this.s.dtPane.destroy();this.s.listSet=!1};k.prototype.getPaneCount=
  function(){return void 0!==this.s.dtPane?this.s.dtPane.rows({selected:!0}).data().toArray().length:0};k.prototype.rebuildPane=function(a,b,c,d){void 0===a&&(a=!1);void 0===b&&(b=null);void 0===c&&(c=null);void 0===d&&(d=!1);this.clearData();var e=[];this.s.serverSelect=[];var g=null;void 0!==this.s.dtPane&&(d&&(this.s.dt.page.info().serverSide?this.s.serverSelect=this.s.dtPane.rows({selected:!0}).data().toArray():e=this.s.dtPane.rows({selected:!0}).data().toArray()),this.s.dtPane.clear().destroy(),
  g=h(this.dom.container).prev(),this.destroy(),this.s.dtPane=void 0,h.fn.dataTable.ext.search.push(this.s.searchFunction));this.dom.container.removeClass(this.classes.hidden);this.s.displayed=!1;this._buildPane(this.s.dt.page.info().serverSide?this.s.serverSelect:e,a,b,c,g);return this};k.prototype.removePane=function(){this.s.displayed=!1;h(this.dom.container).hide()};k.prototype.setCascadeRegen=function(a){this.s.cascadeRegen=a};k.prototype.setClear=function(a){this.s.clearing=a};k.prototype.updatePane=
  function(a){void 0===a&&(a=!1);this.s.updating=!0;this._updateCommon(a);this.s.updating=!1};k.prototype.updateTable=function(){this.selections=this.s.dtPane.rows({selected:!0}).data().toArray();this._searchExtras();(this.c.cascadePanes||this.c.viewTotal)&&this.updatePane()};k.prototype._setListeners=function(){var a=this,b=this.s.rowData,c;this.s.dtPane.on("select.dtsp",function(){clearTimeout(c);a.s.dt.page.info().serverSide&&!a.s.updating?a.s.serverSelecting||(a.s.serverSelect=a.s.dtPane.rows({selected:!0}).data().toArray(),
  a.s.scrollTop=h(a.s.dtPane.table().node()).parent()[0].scrollTop,a.s.selectPresent=!0,a.s.dt.draw(!1)):(h(a.dom.clear).removeClass(a.classes.dull),a.s.selectPresent=!0,a.s.updating||a._makeSelection(),a.s.selectPresent=!1)});this.s.dtPane.on("deselect.dtsp",function(){c=setTimeout(function(){a.s.dt.page.info().serverSide&&!a.s.updating?a.s.serverSelecting||(a.s.serverSelect=a.s.dtPane.rows({selected:!0}).data().toArray(),a.s.deselect=!0,a.s.dt.draw(!1)):(a.s.deselect=!0,0===a.s.dtPane.rows({selected:!0}).data().toArray().length&&
  h(a.dom.clear).addClass(a.classes.dull),a._makeSelection(),a.s.deselect=!1,a.s.dt.state.save())},50)});this.s.dt.on("stateSaveParams.dtsp",function(d,e,g){if(h.isEmptyObject(g))a.s.dtPane.state.clear();else{d=[];if(void 0!==a.s.dtPane){d=a.s.dtPane.rows({selected:!0}).data().map(function(x){return x.filter.toString()}).toArray();var f=h(a.dom.searchBox).val();var l=a.s.dtPane.order();var p=b.binsOriginal;var n=b.arrayOriginal}void 0===g.searchPanes&&(g.searchPanes={});void 0===g.searchPanes.panes&&
  (g.searchPanes.panes=[]);for(e=0;e<g.searchPanes.panes.length;e++)g.searchPanes.panes[e].id===a.s.index&&(g.searchPanes.panes.splice(e,1),e--);g.searchPanes.panes.push({arrayFilter:n,bins:p,id:a.s.index,order:l,searchTerm:f,selected:d})}});this.s.dtPane.on("user-select.dtsp",function(d,e,g,f,l){l.stopPropagation()});this.s.dtPane.on("draw.dtsp",function(){a._adjustTopRow()});h(this.dom.nameButton).on("click.dtsp",function(){var d=a.s.dtPane.order()[0][1];a.s.dtPane.order([0,"asc"===d?"desc":"asc"]).draw();
  a.s.dt.state.save()});h(this.dom.countButton).on("click.dtsp",function(){var d=a.s.dtPane.order()[0][1];a.s.dtPane.order([1,"asc"===d?"desc":"asc"]).draw();a.s.dt.state.save()});h(this.dom.clear).on("click.dtsp",function(){a.dom.container.find("."+a.classes.search).each(function(){h(this).val("");h(this).trigger("input")});a.clearPane()});h(this.dom.searchButton).on("click.dtsp",function(){h(a.dom.searchBox).focus()});h(this.dom.searchBox).on("input.dtsp",function(){a.s.dtPane.search(h(a.dom.searchBox).val()).draw();
  a.s.dt.state.save()});this.s.dt.state.save();return!0};k.prototype._addOption=function(a,b,c,d,e,g){if(Array.isArray(a)||a instanceof r.Api)if(a instanceof r.Api&&(a=a.toArray(),b=b.toArray()),a.length===b.length)for(var f=0;f<a.length;f++)g[a[f]]?g[a[f]]++:(g[a[f]]=1,e.push({display:b[f],filter:a[f],sort:c[f],type:d[f]})),this.s.rowData.totalOptions++;else throw Error("display and filter not the same length");else"string"===typeof this.s.colOpts.orthogonal?(g[a]?g[a]++:(g[a]=1,e.push({display:b,
  filter:a,sort:c,type:d})),this.s.rowData.totalOptions++):e.push({display:b,filter:a,sort:c,type:d})};k.prototype._addRow=function(a,b,c,d,e,g,f){for(var l,p=0,n=this.s.indexes;p<n.length;p++){var x=n[p];x.filter===b&&(l=x.index)}void 0===l&&(l=this.s.indexes.length,this.s.indexes.push({filter:b,index:l}));return this.s.dtPane.row.add({className:f,display:""!==a?a:!1!==this.s.colOpts.emptyMessage?this.s.colOpts.emptyMessage:this.c.emptyMessage,filter:b,index:l,shown:c,sort:""!==e?e:!1!==this.s.colOpts.emptyMessage?
  this.s.colOpts.emptyMessage:this.c.emptyMessage,total:d,type:g})};k.prototype._adjustTopRow=function(){var a=this.dom.container.find("."+this.classes.subRowsContainer),b=this.dom.container.find(".dtsp-subRow1"),c=this.dom.container.find(".dtsp-subRow2"),d=this.dom.container.find("."+this.classes.topRow);(252>h(a[0]).width()||252>h(d[0]).width())&&0!==h(a[0]).width()?(h(a[0]).addClass(this.classes.narrow),h(b[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowSearch),h(c[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowButton)):
  (h(a[0]).removeClass(this.classes.narrow),h(b[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowSearch),h(c[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowButton))};k.prototype._buildPane=function(a,b,c,d,e){var g=this;void 0===a&&(a=[]);void 0===b&&(b=!1);void 0===c&&(c=null);void 0===d&&(d=null);void 0===e&&(e=null);this.selections=[];var f=this.s.dt,l=f.column(this.colExists?this.s.index:0),p=this.s.colOpts,n=this.s.rowData,x=f.i18n("searchPanes.count","{total}"),
  z=f.i18n("searchPanes.countFiltered","{shown} ({total})"),y=f.state.loaded();this.s.listSet&&(y=f.state());if(this.colExists){var w=-1;if(y&&y.searchPanes&&y.searchPanes.panes)for(var u=0;u<y.searchPanes.panes.length;u++)if(y.searchPanes.panes[u].id===this.s.index){w=u;break}if((!1===p.show||void 0!==p.show&&!0!==p.show)&&-1===w)return this.dom.container.addClass(this.classes.hidden),this.s.displayed=!1;if(!0===p.show||-1!==w)this.s.displayed=!0;if(!this.s.dt.page.info().serverSide&&(null===c||null===
  c.searchPanes||null===c.searchPanes.options)){if(0===n.arrayFilter.length){this._populatePane(b);this.s.rowData.totalOptions=0;this._detailsPane();if(y&&y.searchPanes&&y.searchPanes.panes&&-1===w){this.dom.container.addClass(this.classes.hidden);this.s.displayed=!1;return}n.arrayOriginal=n.arrayTotals;n.binsOriginal=n.binsTotal}u=Object.keys(n.binsOriginal).length;b=this._uniqueRatio(u,f.rows()[0].length);if(!1===this.s.displayed&&((void 0===p.show&&null===p.threshold?b>this.c.threshold:b>p.threshold)||
  !0!==p.show&&1>=u)){this.dom.container.addClass(this.classes.hidden);this.s.displayed=!1;return}this.c.viewTotal&&0===n.arrayTotals.length?(this.s.rowData.totalOptions=0,this._detailsPane()):n.binsTotal=n.bins;this.dom.container.addClass(this.classes.show);this.s.displayed=!0}else if(null!==c&&null!==c.searchPanes&&null!==c.searchPanes.options){if(void 0!==c.tableLength)this.s.tableLength=c.tableLength,this.s.rowData.totalOptions=this.s.tableLength;else if(null===this.s.tableLength||f.rows()[0].length>
  this.s.tableLength)this.s.tableLength=f.rows()[0].length,this.s.rowData.totalOptions=this.s.tableLength;b=f.column(this.s.index).dataSrc();if(void 0!==c.searchPanes.options[b])for(u=0,b=c.searchPanes.options[b];u<b.length;u++)w=b[u],this.s.rowData.arrayFilter.push({display:w.label,filter:w.value,sort:w.label,type:w.label}),this.s.rowData.bins[w.value]=this.c.viewTotal||this.c.cascadePanes?w.count:w.total,this.s.rowData.binsTotal[w.value]=w.total;u=Object.keys(n.binsTotal).length;b=this._uniqueRatio(u,
  this.s.tableLength);if(!1===this.s.displayed&&((void 0===p.show&&null===p.threshold?b>this.c.threshold:b>p.threshold)||!0!==p.show&&1>=u)){this.dom.container.addClass(this.classes.hidden);this.s.displayed=!1;return}this.s.rowData.arrayOriginal=this.s.rowData.arrayFilter;this.s.rowData.binsOriginal=this.s.rowData.bins;this.s.displayed=!0}}else this.s.displayed=!0;this._displayPane();if(!this.s.listSet)this.dom.dtP.on("stateLoadParams.dt",function(E,F,D){h.isEmptyObject(f.state.loaded())&&h.each(D,
  function(C,I){delete D[C]})});null!==e&&0<h(this.dom.panesContainer).has(e).length?h(this.dom.container).insertAfter(e):h(this.dom.panesContainer).prepend(this.dom.container);u=h.fn.dataTable.ext.errMode;h.fn.dataTable.ext.errMode="none";e=r.Scroller;this.s.dtPane=h(this.dom.dtP).DataTable(h.extend(!0,{columnDefs:[{className:"dtsp-nameColumn",data:"display",render:function(E,F,D){if("sort"===F)return D.sort;if("type"===F)return D.type;var C;(g.s.filteringActive||g.s.showFiltered)&&g.c.viewTotal?C=
  z.replace(/{total}/,D.total):C=x.replace(/{total}/,D.total);for(C=C.replace(/{shown}/,D.shown);-1!==C.indexOf("{total}");)C=C.replace(/{total}/,D.total);for(;-1!==C.indexOf("{shown}");)C=C.replace(/{shown}/,D.shown);F='<span class="'+g.classes.pill+'">'+C+"</span>";if(g.c.hideCount||p.hideCount)F="";return'<div class="'+g.classes.nameCont+'"><span title="'+("string"===typeof E&&null!==E.match(/<[^>]*>/)?E.replace(/<[^>]*>/g,""):E)+'" class="'+g.classes.name+'">'+E+"</span>"+F+"</div>"},targets:0,
  type:void 0!==f.settings()[0].aoColumns[this.s.index]?f.settings()[0].aoColumns[this.s.index]._sManualType:null},{className:"dtsp-countColumn "+this.classes.badgePill,data:"shown",orderData:[1,2],targets:1,visible:!1},{data:"total",targets:2,visible:!1}],deferRender:!0,dom:"t",info:!1,language:this.s.dt.settings()[0].oLanguage,paging:e?!0:!1,scrollX:!1,scrollY:"200px",scroller:e?!0:!1,select:!0,stateSave:f.settings()[0].oFeatures.bStateSave?!0:!1},this.c.dtOpts,void 0!==p?p.dtOpts:{},void 0===this.s.colOpts.options&&
  this.colExists?void 0:{createdRow:function(E,F,D){h(E).addClass(F.className)}},null!==this.customPaneSettings&&void 0!==this.customPaneSettings.dtOpts?this.customPaneSettings.dtOpts:{}));h(this.dom.dtP).addClass(this.classes.table);h(this.dom.searchBox).attr("placeholder",void 0!==p.header?p.header:this.colExists?f.settings()[0].aoColumns[this.s.index].sTitle:this.customPaneSettings.header||"Custom Pane");h.fn.dataTable.select.init(this.s.dtPane);h.fn.dataTable.ext.errMode=u;if(this.colExists){l=
  (l=l.search())?l.substr(1,l.length-2).split("|"):[];var B=0;n.arrayFilter.forEach(function(E){""===E.filter&&B++});u=0;for(e=n.arrayFilter.length;u<e;u++){l=!1;w=0;for(var H=this.s.serverSelect;w<H.length;w++)b=H[w],b.filter===n.arrayFilter[u].filter&&(l=!0);if(this.s.dt.page.info().serverSide&&(!this.c.cascadePanes||this.c.cascadePanes&&0!==n.bins[n.arrayFilter[u].filter]||this.c.cascadePanes&&null!==d||l))for(l=this._addRow(n.arrayFilter[u].display,n.arrayFilter[u].filter,d?n.binsTotal[n.arrayFilter[u].filter]:
  n.bins[n.arrayFilter[u].filter],this.c.viewTotal||d?String(n.binsTotal[n.arrayFilter[u].filter]):n.bins[n.arrayFilter[u].filter],n.arrayFilter[u].sort,n.arrayFilter[u].type),w=0,H=this.s.serverSelect;w<H.length;w++)b=H[w],b.filter===n.arrayFilter[u].filter&&(this.s.serverSelecting=!0,l.select(),this.s.serverSelecting=!1);else this.s.dt.page.info().serverSide||!n.arrayFilter[u]||void 0===n.bins[n.arrayFilter[u].filter]&&this.c.cascadePanes?this.s.dt.page.info().serverSide||this._addRow("",B,B,"","",
  ""):this._addRow(n.arrayFilter[u].display,n.arrayFilter[u].filter,n.bins[n.arrayFilter[u].filter],n.binsTotal[n.arrayFilter[u].filter],n.arrayFilter[u].sort,n.arrayFilter[u].type)}}r.select.init(this.s.dtPane);(void 0!==p.options||null!==this.customPaneSettings&&void 0!==this.customPaneSettings.options)&&this._getComparisonRows();this.s.dtPane.draw();this._adjustTopRow();this.s.listSet||(this._setListeners(),this.s.listSet=!0);for(d=0;d<a.length;d++)if(n=a[d],void 0!==n)for(u=0,e=this.s.dtPane.rows().indexes().toArray();u<
  e.length;u++)l=e[u],void 0!==this.s.dtPane.row(l).data()&&n.filter===this.s.dtPane.row(l).data().filter&&(this.s.dt.page.info().serverSide?(this.s.serverSelecting=!0,this.s.dtPane.row(l).select(),this.s.serverSelecting=!1):this.s.dtPane.row(l).select());this.s.dt.page.info().serverSide&&this.s.dtPane.search(h(this.dom.searchBox).val()).draw();if(y&&y.searchPanes&&y.searchPanes.panes&&(null===c||1===c.draw))for(this.c.cascadePanes||this._reloadSelect(y),c=0,y=y.searchPanes.panes;c<y.length;c++)a=y[c],
  a.id===this.s.index&&(h(this.dom.searchBox).val(a.searchTerm),h(this.dom.searchBox).trigger("input"),this.s.dtPane.order(a.order).draw());this.s.dt.state.save();return!0};k.prototype._detailsPane=function(){var a=this.s.dt;this.s.rowData.arrayTotals=[];this.s.rowData.binsTotal={};var b=this.s.dt.settings()[0];a=a.rows().indexes();if(!this.s.dt.page.info().serverSide)for(var c=0;c<a.length;c++)this._populatePaneArray(a[c],this.s.rowData.arrayTotals,b,this.s.rowData.binsTotal)};k.prototype._displayPane=
  function(){var a=this.dom.container,b=this.s.colOpts,c=parseInt(this.c.layout.split("-")[1],10);h(this.dom.topRow).empty();h(this.dom.dtP).empty();h(this.dom.topRow).addClass(this.classes.topRow);3<c&&h(this.dom.container).addClass(this.classes.smallGap);h(this.dom.topRow).addClass(this.classes.subRowsContainer);h(this.dom.upper).appendTo(this.dom.topRow);h(this.dom.lower).appendTo(this.dom.topRow);h(this.dom.searchCont).appendTo(this.dom.upper);h(this.dom.buttonGroup).appendTo(this.dom.lower);(!1===
  this.c.dtOpts.searching||void 0!==b.dtOpts&&!1===b.dtOpts.searching||!this.c.controls||!b.controls||null!==this.customPaneSettings&&void 0!==this.customPaneSettings.dtOpts&&void 0!==this.customPaneSettings.dtOpts.searching&&!this.customPaneSettings.dtOpts.searching)&&h(this.dom.searchBox).attr("disabled","disabled").removeClass(this.classes.paneInputButton).addClass(this.classes.disabledButton);h(this.dom.searchBox).appendTo(this.dom.searchCont);this._searchContSetup();this.c.clear&&this.c.controls&&
  b.controls&&h(this.dom.clear).appendTo(this.dom.buttonGroup);this.c.orderable&&b.orderable&&this.c.controls&&b.controls&&h(this.dom.nameButton).appendTo(this.dom.buttonGroup);!this.c.hideCount&&!b.hideCount&&this.c.orderable&&b.orderable&&this.c.controls&&b.controls&&h(this.dom.countButton).appendTo(this.dom.buttonGroup);h(this.dom.topRow).prependTo(this.dom.container);h(a).append(this.dom.dtP);h(a).show()};k.prototype._getBonusOptions=function(){return h.extend(!0,{},k.defaults,{orthogonal:{threshold:null},
  threshold:null},void 0!==this.c?this.c:{})};k.prototype._getComparisonRows=function(){var a=this.s.colOpts;a=void 0!==a.options?a.options:null!==this.customPaneSettings&&void 0!==this.customPaneSettings.options?this.customPaneSettings.options:void 0;if(void 0!==a){var b=this.s.dt.rows({search:"applied"}).data().toArray(),c=this.s.dt.rows({search:"applied"}),d=this.s.dt.rows().data().toArray(),e=this.s.dt.rows(),g=[];this.s.dtPane.clear();for(var f=0;f<a.length;f++){var l=a[f],p=""!==l.label?l.label:
  this.c.emptyMessage,n=l.className,x=p,z="function"===typeof l.value?l.value:[],y=0,w=p,u=0;if("function"===typeof l.value){for(var B=0;B<b.length;B++)l.value.call(this.s.dt,b[B],c[0][B])&&y++;for(B=0;B<d.length;B++)l.value.call(this.s.dt,d[B],e[0][B])&&u++;"function"!==typeof z&&z.push(l.filter)}(!this.c.cascadePanes||this.c.cascadePanes&&0!==y)&&g.push(this._addRow(x,z,y,u,w,p,n))}return g}};k.prototype._getOptions=function(){return h.extend(!0,{},k.defaults,{emptyMessage:!1,orthogonal:{threshold:null},
  threshold:null},this.s.dt.settings()[0].aoColumns[this.s.index].searchPanes)};k.prototype._makeSelection=function(){this.updateTable();this.s.updating=!0;this.s.dt.draw();this.s.updating=!1};k.prototype._populatePane=function(a){void 0===a&&(a=!1);var b=this.s.dt;this.s.rowData.arrayFilter=[];this.s.rowData.bins={};var c=this.s.dt.settings()[0];if(!this.s.dt.page.info().serverSide){var d=0;for(a=(!this.c.cascadePanes&&!this.c.viewTotal||this.s.clearing||a?b.rows().indexes():b.rows({search:"applied"}).indexes()).toArray();d<
  a.length;d++)this._populatePaneArray(a[d],this.s.rowData.arrayFilter,c)}};k.prototype._populatePaneArray=function(a,b,c,d){void 0===d&&(d=this.s.rowData.bins);var e=this.s.colOpts;if("string"===typeof e.orthogonal)c=c.oApi._fnGetCellData(c,a,this.s.index,e.orthogonal),this.s.rowData.filterMap.set(a,c),this._addOption(c,c,c,c,b,d);else{var g=c.oApi._fnGetCellData(c,a,this.s.index,e.orthogonal.search);null===g&&(g="");"string"===typeof g&&(g=g.replace(/<[^>]*>/g,""));this.s.rowData.filterMap.set(a,
  g);d[g]?d[g]++:(d[g]=1,this._addOption(g,c.oApi._fnGetCellData(c,a,this.s.index,e.orthogonal.display),c.oApi._fnGetCellData(c,a,this.s.index,e.orthogonal.sort),c.oApi._fnGetCellData(c,a,this.s.index,e.orthogonal.type),b,d));this.s.rowData.totalOptions++}};k.prototype._reloadSelect=function(a){if(void 0!==a){for(var b,c=0;c<a.searchPanes.panes.length;c++)if(a.searchPanes.panes[c].id===this.s.index){b=c;break}if(void 0!==b){c=this.s.dtPane;var d=c.rows({order:"index"}).data().map(function(f){return null!==
  f.filter?f.filter.toString():null}).toArray(),e=0;for(a=a.searchPanes.panes[b].selected;e<a.length;e++){b=a[e];var g=-1;null!==b&&(g=d.indexOf(b.toString()));-1<g&&(this.s.serverSelecting=!0,c.row(g).select(),this.s.serverSelecting=!1)}}}};k.prototype._search=function(a,b){for(var c=this.s.colOpts,d=this.s.dt,e=0,g=this.selections;e<g.length;e++){var f=g[e];"string"===typeof f.filter&&(f.filter=f.filter.replaceAll("&amp;","&"));if(Array.isArray(a)){if(-1!==a.indexOf(f.filter))return!0}else if("function"===
  typeof f.filter)if(f.filter.call(d,d.row(b).data(),b)){if("or"===c.combiner)return!0}else{if("and"===c.combiner)return!1}else if(a===f.filter||("string"!==typeof a||0!==a.length)&&a==f.filter||null===f.filter&&"string"===typeof a&&""===a)return!0}return"and"===c.combiner?!0:!1};k.prototype._searchContSetup=function(){this.c.controls&&this.s.colOpts.controls&&h(this.dom.searchButton).appendTo(this.dom.searchLabelCont);!1===this.c.dtOpts.searching||!1===this.s.colOpts.dtOpts.searching||null!==this.customPaneSettings&&
  void 0!==this.customPaneSettings.dtOpts&&void 0!==this.customPaneSettings.dtOpts.searching&&!this.customPaneSettings.dtOpts.searching||h(this.dom.searchLabelCont).appendTo(this.dom.searchCont)};k.prototype._searchExtras=function(){var a=this.s.updating;this.s.updating=!0;var b=this.s.dtPane.rows({selected:!0}).data().pluck("filter").toArray(),c=b.indexOf(!1!==this.s.colOpts.emptyMessage?this.s.colOpts.emptyMessage:this.c.emptyMessage),d=h(this.s.dtPane.table().container());-1<c&&(b[c]="");0<b.length?
  d.addClass(this.classes.selected):0===b.length&&d.removeClass(this.classes.selected);this.s.updating=a};k.prototype._uniqueRatio=function(a,b){return 0<b&&(0<this.s.rowData.totalOptions&&!this.s.dt.page.info().serverSide||this.s.dt.page.info().serverSide&&0<this.s.tableLength)?a/this.s.rowData.totalOptions:1};k.prototype._updateCommon=function(a){void 0===a&&(a=!1);if(!(this.s.dt.page.info().serverSide||void 0===this.s.dtPane||this.s.filteringActive&&!this.c.cascadePanes&&!0!==a||!0===this.c.cascadePanes&&
  !0===this.s.selectPresent||this.s.lastSelect&&this.s.lastCascade)){var b=this.s.colOpts,c=this.s.dtPane.rows({selected:!0}).data().toArray();a=h(this.s.dtPane.table().node()).parent()[0].scrollTop;var d=this.s.rowData;this.s.dtPane.clear();if(this.colExists){0===d.arrayFilter.length?this._populatePane():this.c.cascadePanes&&this.s.dt.rows().data().toArray().length===this.s.dt.rows({search:"applied"}).data().toArray().length?(d.arrayFilter=d.arrayOriginal,d.bins=d.binsOriginal):(this.c.viewTotal||
  this.c.cascadePanes)&&this._populatePane();this.c.viewTotal?this._detailsPane():d.binsTotal=d.bins;this.c.viewTotal&&!this.c.cascadePanes&&(d.arrayFilter=d.arrayTotals);for(var e=function(p){if(p&&(void 0!==d.bins[p.filter]&&0!==d.bins[p.filter]&&g.c.cascadePanes||!g.c.cascadePanes||g.s.clearing)){var n=g._addRow(p.display,p.filter,g.c.viewTotal?void 0!==d.bins[p.filter]?d.bins[p.filter]:0:d.bins[p.filter],g.c.viewTotal?String(d.binsTotal[p.filter]):d.bins[p.filter],p.sort,p.type),x=c.findIndex(function(z){return z.filter===
  p.filter});-1!==x&&(n.select(),c.splice(x,1))}},g=this,f=0,l=d.arrayFilter;f<l.length;f++)e(l[f])}if(void 0!==b.searchPanes&&void 0!==b.searchPanes.options||void 0!==b.options||null!==this.customPaneSettings&&void 0!==this.customPaneSettings.options)for(e=function(p){var n=c.findIndex(function(x){if(x.display===p.data().display)return!0});-1!==n&&(p.select(),c.splice(n,1))},f=0,l=this._getComparisonRows();f<l.length;f++)b=l[f],e(b);for(e=0;e<c.length;e++)b=c[e],b=this._addRow(b.display,b.filter,0,
  this.c.viewTotal?b.total:0,b.display,b.display),this.s.updating=!0,b.select(),this.s.updating=!1;this.s.dtPane.draw();this.s.dtPane.table().node().parentNode.scrollTop=a}};k.version="1.1.0";k.classes={buttonGroup:"dtsp-buttonGroup",buttonSub:"dtsp-buttonSub",clear:"dtsp-clear",clearAll:"dtsp-clearAll",clearButton:"clearButton",container:"dtsp-searchPane",countButton:"dtsp-countButton",disabledButton:"dtsp-disabledButton",dull:"dtsp-dull",hidden:"dtsp-hidden",hide:"dtsp-hide",layout:"dtsp-",name:"dtsp-name",
  nameButton:"dtsp-nameButton",nameCont:"dtsp-nameCont",narrow:"dtsp-narrow",paneButton:"dtsp-paneButton",paneInputButton:"dtsp-paneInputButton",pill:"dtsp-pill",search:"dtsp-search",searchCont:"dtsp-searchCont",searchIcon:"dtsp-searchIcon",searchLabelCont:"dtsp-searchButtonCont",selected:"dtsp-selected",smallGap:"dtsp-smallGap",subRow1:"dtsp-subRow1",subRow2:"dtsp-subRow2",subRowsContainer:"dtsp-subRowsContainer",title:"dtsp-title",topRow:"dtsp-topRow"};k.defaults={cascadePanes:!1,clear:!0,combiner:"or",
  controls:!0,container:function(a){return a.table().container()},dtOpts:{},emptyMessage:"<i>No Data</i>",hideCount:!1,layout:"columns-3",name:void 0,orderable:!0,orthogonal:{display:"display",filter:"filter",hideCount:!1,search:"filter",show:void 0,sort:"sort",threshold:.6,type:"type"},preSelect:[],threshold:.6,viewTotal:!1};return k}(),q,A,G=function(){function k(a,b,c){var d=this;void 0===c&&(c=!1);this.regenerating=!1;if(!A||!A.versionCheck||!A.versionCheck("1.10.0"))throw Error("SearchPane requires DataTables 1.10 or newer");
  if(!A.select)throw Error("SearchPane requires Select");var e=new A.Api(a);this.classes=q.extend(!0,{},k.classes);this.c=q.extend(!0,{},k.defaults,b);this.dom={clearAll:q('<button type="button">Clear All</button>').addClass(this.classes.clearAll),container:q("<div/>").addClass(this.classes.panes).text(e.i18n("searchPanes.loadMessage","Loading Search Panes...")),emptyMessage:q("<div/>").addClass(this.classes.emptyMessage),options:q("<div/>").addClass(this.classes.container),panes:q("<div/>").addClass(this.classes.container),
  title:q("<div/>").addClass(this.classes.title),titleRow:q("<div/>").addClass(this.classes.titleRow),wrapper:q("<div/>")};this.s={colOpts:[],dt:e,filterCount:0,filterPane:-1,page:0,panes:[],selectionList:[],serverData:{},stateRead:!1,updating:!1};if(void 0===e.settings()[0]._searchPanes){this._getState();if(this.s.dt.page.info().serverSide)e.on("preXhr.dt",function(g,f,l){void 0===l.searchPanes&&(l.searchPanes={});g=0;for(f=d.s.selectionList;g<f.length;g++){var p=f[g],n=d.s.dt.column(p.index).dataSrc();
  void 0===l.searchPanes[n]&&(l.searchPanes[n]={});for(var x=0;x<p.rows.length;x++)l.searchPanes[n][x]=p.rows[x].filter}});e.on("xhr",function(g,f,l,p){l&&l.searchPanes&&l.searchPanes.options&&(d.s.serverData=l,d.s.serverData.tableLength=l.recordsTotal,d._serverTotals())});e.settings()[0]._searchPanes=this;this.dom.clearAll.text(e.i18n("searchPanes.clearMessage","Clear All"));if(this.s.dt.settings()[0]._bInitComplete||c)this._paneDeclare(e,a,b);else e.one("preInit.dt",function(g){d._paneDeclare(e,a,
  b)});return this}}k.prototype.clearSelections=function(){this.dom.container.find(this.classes.search).each(function(){q(this).val("");q(this).trigger("input")});for(var a=[],b=0,c=this.s.panes;b<c.length;b++){var d=c[b];void 0!==d.s.dtPane&&a.push(d.clearPane())}this.s.dt.draw();return a};k.prototype.getNode=function(){return this.dom.container};k.prototype.rebuild=function(a,b){void 0===a&&(a=!1);void 0===b&&(b=!1);q(this.dom.emptyMessage).remove();var c=[];!1===a&&q(this.dom.panes).empty();for(var d=
  0,e=this.s.panes;d<e.length;d++){var g=e[d];if(!1===a||g.s.index===a)g.clearData(),c.push(g.rebuildPane(void 0!==this.s.selectionList[this.s.selectionList.length-1]?g.s.index===this.s.selectionList[this.s.selectionList.length-1].index:!1,this.s.dt.page.info().serverSide?this.s.serverData:void 0,null,b)),q(this.dom.panes).append(g.dom.container)}this.s.dt.page.info().serverSide||this.s.dt.draw();this.c.cascadePanes||this.c.viewTotal?this.redrawPanes(!0):this._updateSelection();this._updateFilterCount();
  this._attachPaneContainer();this.s.dt.draw();return 1===c.length?c[0]:c};k.prototype.redrawPanes=function(a){void 0===a&&(a=!1);var b=this.s.dt;if(!this.s.updating&&!this.s.dt.page.info().serverSide){var c=!0,d=this.s.filterPane;if(b.rows({search:"applied"}).data().toArray().length===b.rows().data().toArray().length)c=!1;else if(this.c.viewTotal)for(var e=0,g=this.s.panes;e<g.length;e++){var f=g[e];if(void 0!==f.s.dtPane){var l=f.s.dtPane.rows({selected:!0}).data().toArray().length;if(0===l)for(var p=
  0,n=this.s.selectionList;p<n.length;p++){var x=n[p];x.index===f.s.index&&0!==x.rows.length&&(l=x.rows.length)}0<l&&-1===d?d=f.s.index:0<l&&(d=null)}}g=void 0;e=[];if(this.regenerating){g=-1;1===e.length&&(g=e[0].index);a=0;for(e=this.s.panes;a<e.length;a++)if(f=e[a],void 0!==f.s.dtPane){b=!0;f.s.filteringActive=!0;if(-1!==d&&null!==d&&d===f.s.index||!1===c||f.s.index===g)b=!1,f.s.filteringActive=!1;f.updatePane(b?c:b)}this._updateFilterCount()}else{l=0;for(p=this.s.panes;l<p.length;l++)if(f=p[l],
  f.s.selectPresent){this.s.selectionList.push({index:f.s.index,rows:f.s.dtPane.rows({selected:!0}).data().toArray(),protect:!1});b.state.save();break}else f.s.deselect&&(g=f.s.index,n=f.s.dtPane.rows({selected:!0}).data().toArray(),0<n.length&&this.s.selectionList.push({index:f.s.index,rows:n,protect:!0}));if(0<this.s.selectionList.length)for(b=this.s.selectionList[this.s.selectionList.length-1].index,l=0,p=this.s.panes;l<p.length;l++)f=p[l],f.s.lastSelect=f.s.index===b;for(f=0;f<this.s.selectionList.length;f++)if(this.s.selectionList[f].index!==
  g||!0===this.s.selectionList[f].protect){b=!1;for(l=f+1;l<this.s.selectionList.length;l++)this.s.selectionList[l].index===this.s.selectionList[f].index&&(b=!0);b||(e.push(this.s.selectionList[f]),this.s.selectionList[f].protect=!1)}g=-1;1===e.length&&(g=e[0].index);l=0;for(p=this.s.panes;l<p.length;l++)if(f=p[l],void 0!==f.s.dtPane){b=!0;f.s.filteringActive=!0;if(-1!==d&&null!==d&&d===f.s.index||!1===c||f.s.index===g)b=!1,f.s.filteringActive=!1;f.updatePane(b?c:!1)}this._updateFilterCount();if(0<
  e.length&&(e.length<this.s.selectionList.length||a))for(this._cascadeRegen(e),b=e[e.length-1].index,d=0,a=this.s.panes;d<a.length;d++)f=a[d],f.s.lastSelect=f.s.index===b;else if(0<e.length)for(f=0,a=this.s.panes;f<a.length;f++)if(e=a[f],void 0!==e.s.dtPane){b=!0;e.s.filteringActive=!0;if(-1!==d&&null!==d&&d===e.s.index||!1===c)b=!1,e.s.filteringActive=!1;e.updatePane(b?c:b)}}c||(this.s.selectionList=[])}};k.prototype._attach=function(){var a=this;q(this.dom.container).removeClass(this.classes.hide);
  q(this.dom.titleRow).removeClass(this.classes.hide);q(this.dom.titleRow).remove();q(this.dom.title).appendTo(this.dom.titleRow);this.c.clear&&(q(this.dom.clearAll).appendTo(this.dom.titleRow),q(this.dom.clearAll).on("click.dtsps",function(){a.clearSelections()}));q(this.dom.titleRow).appendTo(this.dom.container);for(var b=0,c=this.s.panes;b<c.length;b++)q(c[b].dom.container).appendTo(this.dom.panes);q(this.dom.panes).appendTo(this.dom.container);0===q("div."+this.classes.container).length&&q(this.dom.container).prependTo(this.s.dt);
  return this.dom.container};k.prototype._attachExtras=function(){q(this.dom.container).removeClass(this.classes.hide);q(this.dom.titleRow).removeClass(this.classes.hide);q(this.dom.titleRow).remove();q(this.dom.title).appendTo(this.dom.titleRow);this.c.clear&&q(this.dom.clearAll).appendTo(this.dom.titleRow);q(this.dom.titleRow).appendTo(this.dom.container);return this.dom.container};k.prototype._attachMessage=function(){try{var a=this.s.dt.i18n("searchPanes.emptyPanes","No SearchPanes")}catch(b){a=
  null}if(null===a)q(this.dom.container).addClass(this.classes.hide),q(this.dom.titleRow).removeClass(this.classes.hide);else return q(this.dom.container).removeClass(this.classes.hide),q(this.dom.titleRow).addClass(this.classes.hide),q(this.dom.emptyMessage).text(a),this.dom.emptyMessage.appendTo(this.dom.container),this.dom.container};k.prototype._attachPaneContainer=function(){for(var a=0,b=this.s.panes;a<b.length;a++)if(!0===b[a].s.displayed)return this._attach();return this._attachMessage()};k.prototype._cascadeRegen=
  function(a){this.regenerating=!0;var b=-1;1===a.length&&(b=a[0].index);for(var c=0,d=this.s.panes;c<d.length;c++){var e=d[c];e.setCascadeRegen(!0);e.setClear(!0);(void 0!==e.s.dtPane&&e.s.index===b||void 0!==e.s.dtPane)&&e.clearPane();e.setClear(!1)}this._makeCascadeSelections(a);this.s.selectionList=a;a=0;for(b=this.s.panes;a<b.length;a++)e=b[a],e.setCascadeRegen(!1);this.regenerating=!1};k.prototype._checkMessage=function(){for(var a=0,b=this.s.panes;a<b.length;a++)if(!0===b[a].s.displayed)return;
  return this._attachMessage()};k.prototype._getState=function(){var a=this.s.dt.state.loaded();a&&a.searchPanes&&void 0!==a.searchPanes.selectionList&&(this.s.selectionList=a.searchPanes.selectionList)};k.prototype._makeCascadeSelections=function(a){for(var b=0;b<a.length;b++)for(var c=function(f){if(f.s.index===a[b].index&&void 0!==f.s.dtPane){b===a.length-1&&(f.s.lastCascade=!0);0<f.s.dtPane.rows({selected:!0}).data().toArray().length&&void 0!==f.s.dtPane&&(f.setClear(!0),f.clearPane(),f.setClear(!1));
  for(var l=function(x){f.s.dtPane.rows().every(function(z){void 0!==f.s.dtPane.row(z).data()&&void 0!==x&&f.s.dtPane.row(z).data().filter===x.filter&&f.s.dtPane.row(z).select()})},p=0,n=a[b].rows;p<n.length;p++)l(n[p]);d._updateFilterCount();f.s.lastCascade=!1}},d=this,e=0,g=this.s.panes;e<g.length;e++)c(g[e]);this.s.dt.state.save()};k.prototype._paneDeclare=function(a,b,c){var d=this;a.columns(0<this.c.columns.length?this.c.columns:void 0).eq(0).each(function(l){d.s.panes.push(new v(b,c,l,d.c.layout,
  d.dom.panes))});for(var e=a.columns().eq(0).toArray().length,g=this.c.panes.length,f=0;f<g;f++)this.s.panes.push(new v(b,c,e+f,this.c.layout,this.dom.panes,this.c.panes[f]));if(0<this.c.order.length)for(e=this.c.order.map(function(l,p,n){return d._findPane(l)}),this.dom.panes.empty(),this.s.panes=e,e=0,g=this.s.panes;e<g.length;e++)this.dom.panes.append(g[e].dom.container);this.s.dt.settings()[0]._bInitComplete?this._startup(a):this.s.dt.settings()[0].aoInitComplete.push({fn:function(){d._startup(a)}})};
  k.prototype._findPane=function(a){for(var b=0,c=this.s.panes;b<c.length;b++){var d=c[b];if(a===d.s.name)return d}};k.prototype._serverTotals=function(){for(var a=!1,b=!1,c=this.s.dt,d=0,e=this.s.panes;d<e.length;d++){var g=e[d];if(g.s.selectPresent){this.s.selectionList.push({index:g.s.index,rows:g.s.dtPane.rows({selected:!0}).data().toArray(),protect:!1});c.state.save();g.s.selectPresent=!1;a=!0;break}else g.s.deselect&&(b=g.s.dtPane.rows({selected:!0}).data().toArray(),0<b.length&&this.s.selectionList.push({index:g.s.index,
  rows:b,protect:!0}),b=a=!0)}if(a){c=[];for(d=0;d<this.s.selectionList.length;d++){g=!1;for(e=d+1;e<this.s.selectionList.length;e++)this.s.selectionList[e].index===this.s.selectionList[d].index&&(g=!0);if(!g){e=!1;a=0;for(var f=this.s.panes;a<f.length;a++)g=f[a],g.s.index===this.s.selectionList[d].index&&0<g.s.dtPane.rows({selected:!0}).data().toArray().length&&(e=!0);e&&c.push(this.s.selectionList[d])}}this.s.selectionList=c}else this.s.selectionList=[];c=-1;if(b&&1===this.s.selectionList.length)for(b=
  0,d=this.s.panes;b<d.length;b++)g=d[b],g.s.lastSelect=!1,g.s.deselect=!1,void 0!==g.s.dtPane&&0<g.s.dtPane.rows({selected:!0}).data().toArray().length&&(c=g.s.index);else if(0<this.s.selectionList.length)for(b=this.s.selectionList[this.s.selectionList.length-1].index,d=0,e=this.s.panes;d<e.length;d++)g=e[d],g.s.lastSelect=g.s.index===b,g.s.deselect=!1;else if(0===this.s.selectionList.length)for(b=0,d=this.s.panes;b<d.length;b++)g=d[b],g.s.lastSelect=!1,g.s.deselect=!1;q(this.dom.panes).empty();b=
  0;for(d=this.s.panes;b<d.length;b++)g=d[b],g.s.lastSelect?g._setListeners():g.rebuildPane(void 0,this.s.dt.page.info().serverSide?this.s.serverData:void 0,g.s.index===c?!0:null,!0),q(this.dom.panes).append(g.dom.container),void 0!==g.s.dtPane&&(q(g.s.dtPane.table().node()).parent()[0].scrollTop=g.s.scrollTop,q.fn.dataTable.select.init(g.s.dtPane));this.s.dt.page.info().serverSide||this.s.dt.draw()};k.prototype._startup=function(a){var b=this;q(this.dom.container).text("");this._attachExtras();q(this.dom.container).append(this.dom.panes);
  q(this.dom.panes).empty();var c=this.s.dt.state.loaded();if(this.c.viewTotal&&!this.c.cascadePanes&&null!==c&&void 0!==c&&void 0!==c.searchPanes&&void 0!==c.searchPanes.panes){for(var d=!1,e=0,g=c.searchPanes.panes;e<g.length;e++){var f=g[e];if(0<f.selected.length){d=!0;break}}if(d)for(d=0,e=this.s.panes;d<e.length;d++)f=e[d],f.s.showFiltered=!0}d=0;for(e=this.s.panes;d<e.length;d++)f=e[d],f.rebuildPane(void 0,0<Object.keys(this.s.serverData).length?this.s.serverData:void 0),q(this.dom.panes).append(f.dom.container);
  this.s.dt.page.info().serverSide||this.s.dt.draw();this.s.stateRead||null===c||void 0===c||(this.s.dt.page(c.start/this.s.dt.page.len()),this.s.dt.draw("page"));this.s.stateRead=!0;if(this.c.viewTotal&&!this.c.cascadePanes)for(c=0,d=this.s.panes;c<d.length;c++)f=d[c],f.updatePane();this._updateFilterCount();this._checkMessage();a.on("preDraw.dtsps",function(){b._updateFilterCount();!b.c.cascadePanes&&!b.c.viewTotal||b.s.dt.page.info().serverSide?b._updateSelection():b.redrawPanes();b.s.filterPane=
  -1});this.s.dt.on("stateSaveParams.dtsp",function(l,p,n){void 0===n.searchPanes&&(n.searchPanes={});n.searchPanes.selectionList=b.s.selectionList});if(this.s.dt.page.info().serverSide)a.off("page"),a.on("page",function(){b.s.page=b.s.dt.page()}),a.off("preXhr.dt"),a.on("preXhr.dt",function(l,p,n){void 0===n.searchPanes&&(n.searchPanes={});p=l=0;for(var x=b.s.panes;p<x.length;p++){var z=x[p],y=b.s.dt.column(z.s.index).dataSrc();void 0===n.searchPanes[y]&&(n.searchPanes[y]={});if(void 0!==z.s.dtPane){z=
  z.s.dtPane.rows({selected:!0}).data().toArray();for(var w=0;w<z.length;w++)n.searchPanes[y][w]=z[w].filter,l++}}b.c.viewTotal&&b._prepViewTotal();0<l&&(l!==b.s.filterCount?(n.start=0,b.s.page=0):n.start=b.s.page*b.s.dt.page.len(),b.s.dt.page(b.s.page),b.s.filterCount=l)});else a.on("preXhr.dt",function(l,p,n){l=0;for(p=b.s.panes;l<p.length;l++)p[l].clearData()});this.s.dt.on("xhr",function(l,p,n,x){var z=!1;if(!b.s.dt.page.info().serverSide)b.s.dt.one("preDraw",function(){if(!z){var y=b.s.dt.page();
  z=!0;q(b.dom.panes).empty();for(var w=0,u=b.s.panes;w<u.length;w++){var B=u[w];B.clearData();B.rebuildPane(void 0!==b.s.selectionList[b.s.selectionList.length-1]?B.s.index===b.s.selectionList[b.s.selectionList.length-1].index:!1,void 0,void 0,!0);q(b.dom.panes).append(B.dom.container)}b.s.dt.page.info().serverSide||b.s.dt.draw();b.c.cascadePanes||b.c.viewTotal?b.redrawPanes(b.c.cascadePanes):b._updateSelection();b._checkMessage();b.s.dt.one("draw",function(){b.s.dt.page(y).draw(!1)})}})});c=0;for(d=
  this.s.panes;c<d.length;c++)if(f=d[c],void 0!==f&&void 0!==f.s.dtPane&&(void 0!==f.s.colOpts.preSelect&&0<f.s.colOpts.preSelect.length||null!==f.customPaneSettings&&void 0!==f.customPaneSettings.preSelect&&0<f.customPaneSettings.preSelect.length)){e=f.s.dtPane.rows().data().toArray().length;for(g=0;g<e;g++)(-1!==f.s.colOpts.preSelect.indexOf(f.s.dtPane.cell(g,0).data())||null!==f.customPaneSettings&&void 0!==f.customPaneSettings.preSelect&&-1!==f.customPaneSettings.preSelect.indexOf(f.s.dtPane.cell(g,
  0).data()))&&f.s.dtPane.row(g).select();f.updateTable()}if(void 0!==this.s.selectionList&&0<this.s.selectionList.length)for(c=this.s.selectionList[this.s.selectionList.length-1].index,d=0,e=this.s.panes;d<e.length;d++)f=e[d],f.s.lastSelect=f.s.index===c;0<this.s.selectionList.length&&this.c.cascadePanes&&this._cascadeRegen(this.s.selectionList);this._updateFilterCount();a.on("destroy.dtsps",function(){for(var l=0,p=b.s.panes;l<p.length;l++)p[l].destroy();a.off(".dtsps");q(b.dom.clearAll).off(".dtsps");
  q(b.dom.container).remove();b.clearSelections()});if(this.c.clear)q(this.dom.clearAll).on("click.dtsps",function(){b.clearSelections()});a.settings()[0]._searchPanes=this};k.prototype._prepViewTotal=function(){for(var a=this.s.filterPane,b=!1,c=0,d=this.s.panes;c<d.length;c++){var e=d[c];if(void 0!==e.s.dtPane){var g=e.s.dtPane.rows({selected:!0}).data().toArray().length;0<g&&-1===a?(a=e.s.index,b=!0):0<g&&(a=null)}}c=0;for(d=this.s.panes;c<d.length;c++)if(e=d[c],void 0!==e.s.dtPane&&(e.s.filteringActive=
  !0,-1!==a&&null!==a&&a===e.s.index||!1===b))e.s.filteringActive=!1};k.prototype._updateFilterCount=function(){for(var a=0,b=0,c=this.s.panes;b<c.length;b++){var d=c[b];void 0!==d.s.dtPane&&(a+=d.getPaneCount())}b=this.s.dt.i18n("searchPanes.title","Filters Active - %d",a);q(this.dom.title).text(b);void 0!==this.c.filterChanged&&"function"===typeof this.c.filterChanged&&this.c.filterChanged.call(this.s.dt,a)};k.prototype._updateSelection=function(){this.s.selectionList=[];for(var a=0,b=this.s.panes;a<
  b.length;a++){var c=b[a];void 0!==c.s.dtPane&&this.s.selectionList.push({index:c.s.index,rows:c.s.dtPane.rows({selected:!0}).data().toArray(),protect:!1})}this.s.dt.state.save()};k.version="1.2.2";k.classes={clear:"dtsp-clear",clearAll:"dtsp-clearAll",container:"dtsp-searchPanes",emptyMessage:"dtsp-emptyMessage",hide:"dtsp-hidden",panes:"dtsp-panesContainer",search:"dtsp-search",title:"dtsp-title",titleRow:"dtsp-titleRow"};k.defaults={cascadePanes:!1,clear:!0,container:function(a){return a.table().container()},
  columns:[],filterChanged:void 0,layout:"columns-3",order:[],panes:[],viewTotal:!1};return k}();(function(k){"function"===typeof define&&define.amd?define(["jquery","datatables.net"],function(a){return k(a,window,document)}):"object"===typeof exports?module.exports=function(a,b){a||(a=window);b&&b.fn.dataTable||(b=require("datatables.net")(a,b).$);return k(b,a,a.document)}:k(window.jQuery,window,document)})(function(k,a,b){function c(e,g){void 0===g&&(g=!1);e=new d.Api(e);var f=e.init().searchPanes||
  d.defaults.searchPanes;return(new G(e,f,g)).getNode()}m(k);t(k);var d=k.fn.dataTable;k.fn.dataTable.SearchPanes=G;k.fn.DataTable.SearchPanes=G;k.fn.dataTable.SearchPane=v;k.fn.DataTable.SearchPane=v;a=k.fn.dataTable.Api.register;a("searchPanes()",function(){return this});a("searchPanes.clearSelections()",function(){return this.iterator("table",function(e){e._searchPanes&&e._searchPanes.clearSelections()})});a("searchPanes.rebuildPane()",function(e,g){return this.iterator("table",function(f){f._searchPanes&&
  f._searchPanes.rebuild(e,g)})});a("searchPanes.container()",function(){var e=this.context[0];return e._searchPanes?e._searchPanes.getNode():null});k.fn.dataTable.ext.buttons.searchPanesClear={text:"Clear Panes",action:function(e,g,f,l){g.searchPanes.clearSelections()}};k.fn.dataTable.ext.buttons.searchPanes={action:function(e,g,f,l){e.stopPropagation();this.popover(l._panes.getNode(),{align:"dt-container"});l._panes.rebuild(void 0,!0)},config:{},init:function(e,g,f){var l=new k.fn.dataTable.SearchPanes(e,
  k.extend({filterChanged:function(n){e.button(g).text(e.i18n("searchPanes.collapse",{0:"SearchPanes",_:"SearchPanes (%d)"},n))}},f.config)),p=e.i18n("searchPanes.collapse","SearchPanes",0);e.button(g).text(p);f._panes=l},text:"Search Panes"};k(b).on("preInit.dt.dtsp",function(e,g,f){"dt"===e.namespace&&(g.oInit.searchPanes||d.defaults.searchPanes)&&(g._searchPanes||c(g,!0))});d.ext.feature.push({cFeature:"P",fnInit:c});d.ext.features&&d.ext.features.register("searchPanes",c)})})();
  
  // dataTables.select
  /*!
     Copyright 2015-2019 SpryMedia Ltd.
  
   This source file is free software, available under the following license:
     MIT license - http://datatables.net/license/mit
  
   This source file is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
   or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
  
   For details please refer to: http://www.datatables.net/extensions/select
   Select for DataTables 1.3.1
   2015-2019 SpryMedia Ltd - datatables.net/license/mit
  */
  (function(f){"function"===typeof define&&define.amd?define(["jquery","datatables.net"],function(k){return f(k,window,document)}):"object"===typeof exports?module.exports=function(k,p){k||(k=window);p&&p.fn.dataTable||(p=require("datatables.net")(k,p).$);return f(p,k,k.document)}:f(jQuery,window,document)})(function(f,k,p,h){function z(a,b,c){var d=function(c,b){if(c>b){var d=b;b=c;c=d}var e=!1;return a.columns(":visible").indexes().filter(function(a){a===c&&(e=!0);return a===b?(e=!1,!0):e})};var e=
  function(c,b){var d=a.rows({search:"applied"}).indexes();if(d.indexOf(c)>d.indexOf(b)){var e=b;b=c;c=e}var f=!1;return d.filter(function(a){a===c&&(f=!0);return a===b?(f=!1,!0):f})};a.cells({selected:!0}).any()||c?(d=d(c.column,b.column),c=e(c.row,b.row)):(d=d(0,b.column),c=e(0,b.row));c=a.cells(c,d).flatten();a.cells(b,{selected:!0}).any()?a.cells(c).deselect():a.cells(c).select()}function v(a){var b=a.settings()[0]._select.selector;f(a.table().container()).off("mousedown.dtSelect",b).off("mouseup.dtSelect",
  b).off("click.dtSelect",b);f("body").off("click.dtSelect"+a.table().node().id.replace(/[^a-zA-Z0-9\-_]/g,"-"))}function A(a){var b=f(a.table().container()),c=a.settings()[0],d=c._select.selector,e;b.on("mousedown.dtSelect",d,function(a){if(a.shiftKey||a.metaKey||a.ctrlKey)b.css("-moz-user-select","none").one("selectstart.dtSelect",d,function(){return!1});k.getSelection&&(e=k.getSelection())}).on("mouseup.dtSelect",d,function(){b.css("-moz-user-select","")}).on("click.dtSelect",d,function(c){var b=
  a.select.items();if(e){var d=k.getSelection();if((!d.anchorNode||f(d.anchorNode).closest("table")[0]===a.table().node())&&d!==e)return}d=a.settings()[0];var l=f.trim(a.settings()[0].oClasses.sWrapper).replace(/ +/g,".");if(f(c.target).closest("div."+l)[0]==a.table().container()&&(l=a.cell(f(c.target).closest("td, th")),l.any())){var g=f.Event("user-select.dt");m(a,g,[b,l,c]);g.isDefaultPrevented()||(g=l.index(),"row"===b?(b=g.row,w(c,a,d,"row",b)):"column"===b?(b=l.index().column,w(c,a,d,"column",
  b)):"cell"===b&&(b=l.index(),w(c,a,d,"cell",b)),d._select_lastCell=g)}});f("body").on("click.dtSelect"+a.table().node().id.replace(/[^a-zA-Z0-9\-_]/g,"-"),function(b){!c._select.blurable||f(b.target).parents().filter(a.table().container()).length||0===f(b.target).parents("html").length||f(b.target).parents("div.DTE").length||r(c,!0)})}function m(a,b,c,d){if(!d||a.flatten().length)"string"===typeof b&&(b+=".dt"),c.unshift(a),f(a.table().node()).trigger(b,c)}function B(a){var b=a.settings()[0];if(b._select.info&&
  b.aanFeatures.i&&"api"!==a.select.style()){var c=a.rows({selected:!0}).flatten().length,d=a.columns({selected:!0}).flatten().length,e=a.cells({selected:!0}).flatten().length,l=function(b,c,d){b.append(f('<span class="select-item"/>').append(a.i18n("select."+c+"s",{_:"%d "+c+"s selected",0:"",1:"1 "+c+" selected"},d)))};f.each(b.aanFeatures.i,function(b,a){a=f(a);b=f('<span class="select-info"/>');l(b,"row",c);l(b,"column",d);l(b,"cell",e);var g=a.children("span.select-info");g.length&&g.remove();
  ""!==b.text()&&a.append(b)})}}function D(a){var b=new g.Api(a);a.aoRowCreatedCallback.push({fn:function(b,d,e){d=a.aoData[e];d._select_selected&&f(b).addClass(a._select.className);b=0;for(e=a.aoColumns.length;b<e;b++)(a.aoColumns[b]._select_selected||d._selected_cells&&d._selected_cells[b])&&f(d.anCells[b]).addClass(a._select.className)},sName:"select-deferRender"});b.on("preXhr.dt.dtSelect",function(){var a=b.rows({selected:!0}).ids(!0).filter(function(b){return b!==h}),d=b.cells({selected:!0}).eq(0).map(function(a){var c=
  b.row(a.row).id(!0);return c?{row:c,column:a.column}:h}).filter(function(b){return b!==h});b.one("draw.dt.dtSelect",function(){b.rows(a).select();d.any()&&d.each(function(a){b.cells(a.row,a.column).select()})})});b.on("draw.dtSelect.dt select.dtSelect.dt deselect.dtSelect.dt info.dt",function(){B(b)});b.on("destroy.dtSelect",function(){v(b);b.off(".dtSelect")})}function C(a,b,c,d){var e=a[b+"s"]({search:"applied"}).indexes();d=f.inArray(d,e);var g=f.inArray(c,e);if(a[b+"s"]({selected:!0}).any()||
  -1!==d){if(d>g){var u=g;g=d;d=u}e.splice(g+1,e.length);e.splice(0,d)}else e.splice(f.inArray(c,e)+1,e.length);a[b](c,{selected:!0}).any()?(e.splice(f.inArray(c,e),1),a[b+"s"](e).deselect()):a[b+"s"](e).select()}function r(a,b){if(b||"single"===a._select.style)a=new g.Api(a),a.rows({selected:!0}).deselect(),a.columns({selected:!0}).deselect(),a.cells({selected:!0}).deselect()}function w(a,b,c,d,e){var f=b.select.style(),g=b.select.toggleable(),h=b[d](e,{selected:!0}).any();if(!h||g)"os"===f?a.ctrlKey||
  a.metaKey?b[d](e).select(!h):a.shiftKey?"cell"===d?z(b,e,c._select_lastCell||null):C(b,d,e,c._select_lastCell?c._select_lastCell[d]:null):(a=b[d+"s"]({selected:!0}),h&&1===a.flatten().length?b[d](e).deselect():(a.deselect(),b[d](e).select())):"multi+shift"==f?a.shiftKey?"cell"===d?z(b,e,c._select_lastCell||null):C(b,d,e,c._select_lastCell?c._select_lastCell[d]:null):b[d](e).select(!h):b[d](e).select(!h)}function t(a,b){return function(c){return c.i18n("buttons."+a,b)}}function x(a){a=a._eventNamespace;
  return"draw.dt.DT"+a+" select.dt.DT"+a+" deselect.dt.DT"+a}function E(a,b){return-1!==f.inArray("rows",b.limitTo)&&a.rows({selected:!0}).any()||-1!==f.inArray("columns",b.limitTo)&&a.columns({selected:!0}).any()||-1!==f.inArray("cells",b.limitTo)&&a.cells({selected:!0}).any()?!0:!1}var g=f.fn.dataTable;g.select={};g.select.version="1.3.1";g.select.init=function(a){var b=a.settings()[0],c=b.oInit.select,d=g.defaults.select;c=c===h?d:c;d="row";var e="api",l=!1,u=!0,k=!0,m="td, th",p="selected",n=!1;
  b._select={};!0===c?(e="os",n=!0):"string"===typeof c?(e=c,n=!0):f.isPlainObject(c)&&(c.blurable!==h&&(l=c.blurable),c.toggleable!==h&&(u=c.toggleable),c.info!==h&&(k=c.info),c.items!==h&&(d=c.items),e=c.style!==h?c.style:"os",n=!0,c.selector!==h&&(m=c.selector),c.className!==h&&(p=c.className));a.select.selector(m);a.select.items(d);a.select.style(e);a.select.blurable(l);a.select.toggleable(u);a.select.info(k);b._select.className=p;f.fn.dataTable.ext.order["select-checkbox"]=function(b,a){return this.api().column(a,
  {order:"index"}).nodes().map(function(a){return"row"===b._select.items?f(a).parent().hasClass(b._select.className):"cell"===b._select.items?f(a).hasClass(b._select.className):!1})};!n&&f(a.table().node()).hasClass("selectable")&&a.select.style("os")};f.each([{type:"row",prop:"aoData"},{type:"column",prop:"aoColumns"}],function(a,b){g.ext.selector[b.type].push(function(a,d,e){d=d.selected;var c=[];if(!0!==d&&!1!==d)return e;for(var f=0,g=e.length;f<g;f++){var h=a[b.prop][e[f]];(!0===d&&!0===h._select_selected||
  !1===d&&!h._select_selected)&&c.push(e[f])}return c})});g.ext.selector.cell.push(function(a,b,c){b=b.selected;var d=[];if(b===h)return c;for(var e=0,f=c.length;e<f;e++){var g=a.aoData[c[e].row];(!0===b&&g._selected_cells&&!0===g._selected_cells[c[e].column]||!(!1!==b||g._selected_cells&&g._selected_cells[c[e].column]))&&d.push(c[e])}return d});var n=g.Api.register,q=g.Api.registerPlural;n("select()",function(){return this.iterator("table",function(a){g.select.init(new g.Api(a))})});n("select.blurable()",
  function(a){return a===h?this.context[0]._select.blurable:this.iterator("table",function(b){b._select.blurable=a})});n("select.toggleable()",function(a){return a===h?this.context[0]._select.toggleable:this.iterator("table",function(b){b._select.toggleable=a})});n("select.info()",function(a){return B===h?this.context[0]._select.info:this.iterator("table",function(b){b._select.info=a})});n("select.items()",function(a){return a===h?this.context[0]._select.items:this.iterator("table",function(b){b._select.items=
  a;m(new g.Api(b),"selectItems",[a])})});n("select.style()",function(a){return a===h?this.context[0]._select.style:this.iterator("table",function(b){b._select.style=a;b._select_init||D(b);var c=new g.Api(b);v(c);"api"!==a&&A(c);m(new g.Api(b),"selectStyle",[a])})});n("select.selector()",function(a){return a===h?this.context[0]._select.selector:this.iterator("table",function(b){v(new g.Api(b));b._select.selector=a;"api"!==b._select.style&&A(new g.Api(b))})});q("rows().select()","row().select()",function(a){var b=
  this;if(!1===a)return this.deselect();this.iterator("row",function(b,a){r(b);b.aoData[a]._select_selected=!0;f(b.aoData[a].nTr).addClass(b._select.className)});this.iterator("table",function(a,d){m(b,"select",["row",b[d]],!0)});return this});q("columns().select()","column().select()",function(a){var b=this;if(!1===a)return this.deselect();this.iterator("column",function(b,a){r(b);b.aoColumns[a]._select_selected=!0;a=(new g.Api(b)).column(a);f(a.header()).addClass(b._select.className);f(a.footer()).addClass(b._select.className);
  a.nodes().to$().addClass(b._select.className)});this.iterator("table",function(a,d){m(b,"select",["column",b[d]],!0)});return this});q("cells().select()","cell().select()",function(a){var b=this;if(!1===a)return this.deselect();this.iterator("cell",function(b,a,e){r(b);a=b.aoData[a];a._selected_cells===h&&(a._selected_cells=[]);a._selected_cells[e]=!0;a.anCells&&f(a.anCells[e]).addClass(b._select.className)});this.iterator("table",function(a,d){m(b,"select",["cell",b[d]],!0)});return this});q("rows().deselect()",
  "row().deselect()",function(){var a=this;this.iterator("row",function(a,c){a.aoData[c]._select_selected=!1;f(a.aoData[c].nTr).removeClass(a._select.className)});this.iterator("table",function(b,c){m(a,"deselect",["row",a[c]],!0)});return this});q("columns().deselect()","column().deselect()",function(){var a=this;this.iterator("column",function(a,c){a.aoColumns[c]._select_selected=!1;var b=new g.Api(a),e=b.column(c);f(e.header()).removeClass(a._select.className);f(e.footer()).removeClass(a._select.className);
  b.cells(null,c).indexes().each(function(b){var c=a.aoData[b.row],d=c._selected_cells;!c.anCells||d&&d[b.column]||f(c.anCells[b.column]).removeClass(a._select.className)})});this.iterator("table",function(b,c){m(a,"deselect",["column",a[c]],!0)});return this});q("cells().deselect()","cell().deselect()",function(){var a=this;this.iterator("cell",function(a,c,d){c=a.aoData[c];c._selected_cells[d]=!1;c.anCells&&!a.aoColumns[d]._select_selected&&f(c.anCells[d]).removeClass(a._select.className)});this.iterator("table",
  function(b,c){m(a,"deselect",["cell",a[c]],!0)});return this});var y=0;f.extend(g.ext.buttons,{selected:{text:t("selected","Selected"),className:"buttons-selected",limitTo:["rows","columns","cells"],init:function(a,b,c){var d=this;c._eventNamespace=".select"+y++;a.on(x(c),function(){d.enable(E(a,c))});this.disable()},destroy:function(a,b,c){a.off(c._eventNamespace)}},selectedSingle:{text:t("selectedSingle","Selected single"),className:"buttons-selected-single",init:function(a,b,c){var d=this;c._eventNamespace=
  ".select"+y++;a.on(x(c),function(){var b=a.rows({selected:!0}).flatten().length+a.columns({selected:!0}).flatten().length+a.cells({selected:!0}).flatten().length;d.enable(1===b)});this.disable()},destroy:function(a,b,c){a.off(c._eventNamespace)}},selectAll:{text:t("selectAll","Select all"),className:"buttons-select-all",action:function(){this[this.select.items()+"s"]().select()}},selectNone:{text:t("selectNone","Deselect all"),className:"buttons-select-none",action:function(){r(this.settings()[0],
  !0)},init:function(a,b,c){var d=this;c._eventNamespace=".select"+y++;a.on(x(c),function(){var b=a.rows({selected:!0}).flatten().length+a.columns({selected:!0}).flatten().length+a.cells({selected:!0}).flatten().length;d.enable(0<b)});this.disable()},destroy:function(a,b,c){a.off(c._eventNamespace)}}});f.each(["Row","Column","Cell"],function(a,b){var c=b.toLowerCase();g.ext.buttons["select"+b+"s"]={text:t("select"+b+"s","Select "+c+"s"),className:"buttons-select-"+c+"s",action:function(){this.select.items(c)},
  init:function(a){var b=this;a.on("selectItems.dt.DT",function(a,d,e){b.active(e===c)})}}});f(p).on("preInit.dt.dtSelect",function(a,b){"dt"===a.namespace&&g.select.init(new g.Api(b))});return g.select});
  
  // datatables.print
  /*
   * This combined file was created by the DataTables downloader builder:
   *   https://datatables.net/download
   *
   * To rebuild or modify this file with the latest versions of the included
   * software please visit:
   *   https://datatables.net/download/#dt/jszip-2.5.0/b-1.7.0/b-html5-1.7.0/b-print-1.7.0
   *
   * Included libraries:
   *  JSZip 2.5.0, Buttons 1.7.0, HTML5 export 1.7.0, Print view 1.7.0
   */
  
  /*!
  
  JSZip - A Javascript class for generating and reading zip files
  <http://stuartk.com/jszip>
  
  (c) 2009-2014 Stuart Knightley <stuart [at] stuartk.com>
  Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.
  
  JSZip uses the library pako released under the MIT license :
  https://github.com/nodeca/pako/blob/master/LICENSE
  */
  !function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;"undefined"!=typeof window?b=window:"undefined"!=typeof global?b=global:"undefined"!=typeof self&&(b=self),b.JSZip=a()}}(function(){return function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);throw new Error("Cannot find module '"+g+"'")}var j=c[g]={exports:{}};b[g][0].call(j.exports,function(a){var c=b[g][1][a];return e(c?c:a)},j,j.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){"use strict";var d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";c.encode=function(a){for(var b,c,e,f,g,h,i,j="",k=0;k<a.length;)b=a.charCodeAt(k++),c=a.charCodeAt(k++),e=a.charCodeAt(k++),f=b>>2,g=(3&b)<<4|c>>4,h=(15&c)<<2|e>>6,i=63&e,isNaN(c)?h=i=64:isNaN(e)&&(i=64),j=j+d.charAt(f)+d.charAt(g)+d.charAt(h)+d.charAt(i);return j},c.decode=function(a){var b,c,e,f,g,h,i,j="",k=0;for(a=a.replace(/[^A-Za-z0-9\+\/\=]/g,"");k<a.length;)f=d.indexOf(a.charAt(k++)),g=d.indexOf(a.charAt(k++)),h=d.indexOf(a.charAt(k++)),i=d.indexOf(a.charAt(k++)),b=f<<2|g>>4,c=(15&g)<<4|h>>2,e=(3&h)<<6|i,j+=String.fromCharCode(b),64!=h&&(j+=String.fromCharCode(c)),64!=i&&(j+=String.fromCharCode(e));return j}},{}],2:[function(a,b){"use strict";function c(){this.compressedSize=0,this.uncompressedSize=0,this.crc32=0,this.compressionMethod=null,this.compressedContent=null}c.prototype={getContent:function(){return null},getCompressedContent:function(){return null}},b.exports=c},{}],3:[function(a,b,c){"use strict";c.STORE={magic:"\x00\x00",compress:function(a){return a},uncompress:function(a){return a},compressInputType:null,uncompressInputType:null},c.DEFLATE=a("./flate")},{"./flate":8}],4:[function(a,b){"use strict";var c=a("./utils"),d=[0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,853044451,1172266101,3705015759,2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,4240017532,1658658271,366619977,2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,225274430,2053790376,3826175755,2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,2998733608,733239954,1555261956,3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,2932959818,3654703836,1088359270,936918e3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117];b.exports=function(a,b){if("undefined"==typeof a||!a.length)return 0;var e="string"!==c.getTypeOf(a);"undefined"==typeof b&&(b=0);var f=0,g=0,h=0;b=-1^b;for(var i=0,j=a.length;j>i;i++)h=e?a[i]:a.charCodeAt(i),g=255&(b^h),f=d[g],b=b>>>8^f;return-1^b}},{"./utils":21}],5:[function(a,b){"use strict";function c(){this.data=null,this.length=0,this.index=0}var d=a("./utils");c.prototype={checkOffset:function(a){this.checkIndex(this.index+a)},checkIndex:function(a){if(this.length<a||0>a)throw new Error("End of data reached (data length = "+this.length+", asked index = "+a+"). Corrupted zip ?")},setIndex:function(a){this.checkIndex(a),this.index=a},skip:function(a){this.setIndex(this.index+a)},byteAt:function(){},readInt:function(a){var b,c=0;for(this.checkOffset(a),b=this.index+a-1;b>=this.index;b--)c=(c<<8)+this.byteAt(b);return this.index+=a,c},readString:function(a){return d.transformTo("string",this.readData(a))},readData:function(){},lastIndexOfSignature:function(){},readDate:function(){var a=this.readInt(4);return new Date((a>>25&127)+1980,(a>>21&15)-1,a>>16&31,a>>11&31,a>>5&63,(31&a)<<1)}},b.exports=c},{"./utils":21}],6:[function(a,b,c){"use strict";c.base64=!1,c.binary=!1,c.dir=!1,c.createFolders=!1,c.date=null,c.compression=null,c.compressionOptions=null,c.comment=null,c.unixPermissions=null,c.dosPermissions=null},{}],7:[function(a,b,c){"use strict";var d=a("./utils");c.string2binary=function(a){return d.string2binary(a)},c.string2Uint8Array=function(a){return d.transformTo("uint8array",a)},c.uint8Array2String=function(a){return d.transformTo("string",a)},c.string2Blob=function(a){var b=d.transformTo("arraybuffer",a);return d.arrayBuffer2Blob(b)},c.arrayBuffer2Blob=function(a){return d.arrayBuffer2Blob(a)},c.transformTo=function(a,b){return d.transformTo(a,b)},c.getTypeOf=function(a){return d.getTypeOf(a)},c.checkSupport=function(a){return d.checkSupport(a)},c.MAX_VALUE_16BITS=d.MAX_VALUE_16BITS,c.MAX_VALUE_32BITS=d.MAX_VALUE_32BITS,c.pretty=function(a){return d.pretty(a)},c.findCompression=function(a){return d.findCompression(a)},c.isRegExp=function(a){return d.isRegExp(a)}},{"./utils":21}],8:[function(a,b,c){"use strict";var d="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,e=a("pako");c.uncompressInputType=d?"uint8array":"array",c.compressInputType=d?"uint8array":"array",c.magic="\b\x00",c.compress=function(a,b){return e.deflateRaw(a,{level:b.level||-1})},c.uncompress=function(a){return e.inflateRaw(a)}},{pako:24}],9:[function(a,b){"use strict";function c(a,b){return this instanceof c?(this.files={},this.comment=null,this.root="",a&&this.load(a,b),void(this.clone=function(){var a=new c;for(var b in this)"function"!=typeof this[b]&&(a[b]=this[b]);return a})):new c(a,b)}var d=a("./base64");c.prototype=a("./object"),c.prototype.load=a("./load"),c.support=a("./support"),c.defaults=a("./defaults"),c.utils=a("./deprecatedPublicUtils"),c.base64={encode:function(a){return d.encode(a)},decode:function(a){return d.decode(a)}},c.compressions=a("./compressions"),b.exports=c},{"./base64":1,"./compressions":3,"./defaults":6,"./deprecatedPublicUtils":7,"./load":10,"./object":13,"./support":17}],10:[function(a,b){"use strict";var c=a("./base64"),d=a("./zipEntries");b.exports=function(a,b){var e,f,g,h;for(b=b||{},b.base64&&(a=c.decode(a)),f=new d(a,b),e=f.files,g=0;g<e.length;g++)h=e[g],this.file(h.fileName,h.decompressed,{binary:!0,optimizedBinaryString:!0,date:h.date,dir:h.dir,comment:h.fileComment.length?h.fileComment:null,unixPermissions:h.unixPermissions,dosPermissions:h.dosPermissions,createFolders:b.createFolders});return f.zipComment.length&&(this.comment=f.zipComment),this}},{"./base64":1,"./zipEntries":22}],11:[function(a,b){(function(a){"use strict";b.exports=function(b,c){return new a(b,c)},b.exports.test=function(b){return a.isBuffer(b)}}).call(this,"undefined"!=typeof Buffer?Buffer:void 0)},{}],12:[function(a,b){"use strict";function c(a){this.data=a,this.length=this.data.length,this.index=0}var d=a("./uint8ArrayReader");c.prototype=new d,c.prototype.readData=function(a){this.checkOffset(a);var b=this.data.slice(this.index,this.index+a);return this.index+=a,b},b.exports=c},{"./uint8ArrayReader":18}],13:[function(a,b){"use strict";var c=a("./support"),d=a("./utils"),e=a("./crc32"),f=a("./signature"),g=a("./defaults"),h=a("./base64"),i=a("./compressions"),j=a("./compressedObject"),k=a("./nodeBuffer"),l=a("./utf8"),m=a("./stringWriter"),n=a("./uint8ArrayWriter"),o=function(a){if(a._data instanceof j&&(a._data=a._data.getContent(),a.options.binary=!0,a.options.base64=!1,"uint8array"===d.getTypeOf(a._data))){var b=a._data;a._data=new Uint8Array(b.length),0!==b.length&&a._data.set(b,0)}return a._data},p=function(a){var b=o(a),e=d.getTypeOf(b);return"string"===e?!a.options.binary&&c.nodebuffer?k(b,"utf-8"):a.asBinary():b},q=function(a){var b=o(this);return null===b||"undefined"==typeof b?"":(this.options.base64&&(b=h.decode(b)),b=a&&this.options.binary?D.utf8decode(b):d.transformTo("string",b),a||this.options.binary||(b=d.transformTo("string",D.utf8encode(b))),b)},r=function(a,b,c){this.name=a,this.dir=c.dir,this.date=c.date,this.comment=c.comment,this.unixPermissions=c.unixPermissions,this.dosPermissions=c.dosPermissions,this._data=b,this.options=c,this._initialMetadata={dir:c.dir,date:c.date}};r.prototype={asText:function(){return q.call(this,!0)},asBinary:function(){return q.call(this,!1)},asNodeBuffer:function(){var a=p(this);return d.transformTo("nodebuffer",a)},asUint8Array:function(){var a=p(this);return d.transformTo("uint8array",a)},asArrayBuffer:function(){return this.asUint8Array().buffer}};var s=function(a,b){var c,d="";for(c=0;b>c;c++)d+=String.fromCharCode(255&a),a>>>=8;return d},t=function(){var a,b,c={};for(a=0;a<arguments.length;a++)for(b in arguments[a])arguments[a].hasOwnProperty(b)&&"undefined"==typeof c[b]&&(c[b]=arguments[a][b]);return c},u=function(a){return a=a||{},a.base64!==!0||null!==a.binary&&void 0!==a.binary||(a.binary=!0),a=t(a,g),a.date=a.date||new Date,null!==a.compression&&(a.compression=a.compression.toUpperCase()),a},v=function(a,b,c){var e,f=d.getTypeOf(b);if(c=u(c),"string"==typeof c.unixPermissions&&(c.unixPermissions=parseInt(c.unixPermissions,8)),c.unixPermissions&&16384&c.unixPermissions&&(c.dir=!0),c.dosPermissions&&16&c.dosPermissions&&(c.dir=!0),c.dir&&(a=x(a)),c.createFolders&&(e=w(a))&&y.call(this,e,!0),c.dir||null===b||"undefined"==typeof b)c.base64=!1,c.binary=!1,b=null,f=null;else if("string"===f)c.binary&&!c.base64&&c.optimizedBinaryString!==!0&&(b=d.string2binary(b));else{if(c.base64=!1,c.binary=!0,!(f||b instanceof j))throw new Error("The data of '"+a+"' is in an unsupported format !");"arraybuffer"===f&&(b=d.transformTo("uint8array",b))}var g=new r(a,b,c);return this.files[a]=g,g},w=function(a){"/"==a.slice(-1)&&(a=a.substring(0,a.length-1));var b=a.lastIndexOf("/");return b>0?a.substring(0,b):""},x=function(a){return"/"!=a.slice(-1)&&(a+="/"),a},y=function(a,b){return b="undefined"!=typeof b?b:!1,a=x(a),this.files[a]||v.call(this,a,null,{dir:!0,createFolders:b}),this.files[a]},z=function(a,b,c){var f,g=new j;return a._data instanceof j?(g.uncompressedSize=a._data.uncompressedSize,g.crc32=a._data.crc32,0===g.uncompressedSize||a.dir?(b=i.STORE,g.compressedContent="",g.crc32=0):a._data.compressionMethod===b.magic?g.compressedContent=a._data.getCompressedContent():(f=a._data.getContent(),g.compressedContent=b.compress(d.transformTo(b.compressInputType,f),c))):(f=p(a),(!f||0===f.length||a.dir)&&(b=i.STORE,f=""),g.uncompressedSize=f.length,g.crc32=e(f),g.compressedContent=b.compress(d.transformTo(b.compressInputType,f),c)),g.compressedSize=g.compressedContent.length,g.compressionMethod=b.magic,g},A=function(a,b){var c=a;return a||(c=b?16893:33204),(65535&c)<<16},B=function(a){return 63&(a||0)},C=function(a,b,c,g,h){var i,j,k,m,n=(c.compressedContent,d.transformTo("string",l.utf8encode(b.name))),o=b.comment||"",p=d.transformTo("string",l.utf8encode(o)),q=n.length!==b.name.length,r=p.length!==o.length,t=b.options,u="",v="",w="";k=b._initialMetadata.dir!==b.dir?b.dir:t.dir,m=b._initialMetadata.date!==b.date?b.date:t.date;var x=0,y=0;k&&(x|=16),"UNIX"===h?(y=798,x|=A(b.unixPermissions,k)):(y=20,x|=B(b.dosPermissions,k)),i=m.getHours(),i<<=6,i|=m.getMinutes(),i<<=5,i|=m.getSeconds()/2,j=m.getFullYear()-1980,j<<=4,j|=m.getMonth()+1,j<<=5,j|=m.getDate(),q&&(v=s(1,1)+s(e(n),4)+n,u+="up"+s(v.length,2)+v),r&&(w=s(1,1)+s(this.crc32(p),4)+p,u+="uc"+s(w.length,2)+w);var z="";z+="\n\x00",z+=q||r?"\x00\b":"\x00\x00",z+=c.compressionMethod,z+=s(i,2),z+=s(j,2),z+=s(c.crc32,4),z+=s(c.compressedSize,4),z+=s(c.uncompressedSize,4),z+=s(n.length,2),z+=s(u.length,2);var C=f.LOCAL_FILE_HEADER+z+n+u,D=f.CENTRAL_FILE_HEADER+s(y,2)+z+s(p.length,2)+"\x00\x00\x00\x00"+s(x,4)+s(g,4)+n+u+p;return{fileRecord:C,dirRecord:D,compressedObject:c}},D={load:function(){throw new Error("Load method is not defined. Is the file jszip-load.js included ?")},filter:function(a){var b,c,d,e,f=[];for(b in this.files)this.files.hasOwnProperty(b)&&(d=this.files[b],e=new r(d.name,d._data,t(d.options)),c=b.slice(this.root.length,b.length),b.slice(0,this.root.length)===this.root&&a(c,e)&&f.push(e));return f},file:function(a,b,c){if(1===arguments.length){if(d.isRegExp(a)){var e=a;return this.filter(function(a,b){return!b.dir&&e.test(a)})}return this.filter(function(b,c){return!c.dir&&b===a})[0]||null}return a=this.root+a,v.call(this,a,b,c),this},folder:function(a){if(!a)return this;if(d.isRegExp(a))return this.filter(function(b,c){return c.dir&&a.test(b)});var b=this.root+a,c=y.call(this,b),e=this.clone();return e.root=c.name,e},remove:function(a){a=this.root+a;var b=this.files[a];if(b||("/"!=a.slice(-1)&&(a+="/"),b=this.files[a]),b&&!b.dir)delete this.files[a];else for(var c=this.filter(function(b,c){return c.name.slice(0,a.length)===a}),d=0;d<c.length;d++)delete this.files[c[d].name];return this},generate:function(a){a=t(a||{},{base64:!0,compression:"STORE",compressionOptions:null,type:"base64",platform:"DOS",comment:null,mimeType:"application/zip"}),d.checkSupport(a.type),("darwin"===a.platform||"freebsd"===a.platform||"linux"===a.platform||"sunos"===a.platform)&&(a.platform="UNIX"),"win32"===a.platform&&(a.platform="DOS");var b,c,e=[],g=0,j=0,k=d.transformTo("string",this.utf8encode(a.comment||this.comment||""));for(var l in this.files)if(this.files.hasOwnProperty(l)){var o=this.files[l],p=o.options.compression||a.compression.toUpperCase(),q=i[p];if(!q)throw new Error(p+" is not a valid compression method !");var r=o.options.compressionOptions||a.compressionOptions||{},u=z.call(this,o,q,r),v=C.call(this,l,o,u,g,a.platform);g+=v.fileRecord.length+u.compressedSize,j+=v.dirRecord.length,e.push(v)}var w="";w=f.CENTRAL_DIRECTORY_END+"\x00\x00\x00\x00"+s(e.length,2)+s(e.length,2)+s(j,4)+s(g,4)+s(k.length,2)+k;var x=a.type.toLowerCase();for(b="uint8array"===x||"arraybuffer"===x||"blob"===x||"nodebuffer"===x?new n(g+j+w.length):new m(g+j+w.length),c=0;c<e.length;c++)b.append(e[c].fileRecord),b.append(e[c].compressedObject.compressedContent);for(c=0;c<e.length;c++)b.append(e[c].dirRecord);b.append(w);var y=b.finalize();switch(a.type.toLowerCase()){case"uint8array":case"arraybuffer":case"nodebuffer":return d.transformTo(a.type.toLowerCase(),y);case"blob":return d.arrayBuffer2Blob(d.transformTo("arraybuffer",y),a.mimeType);case"base64":return a.base64?h.encode(y):y;default:return y}},crc32:function(a,b){return e(a,b)},utf8encode:function(a){return d.transformTo("string",l.utf8encode(a))},utf8decode:function(a){return l.utf8decode(a)}};b.exports=D},{"./base64":1,"./compressedObject":2,"./compressions":3,"./crc32":4,"./defaults":6,"./nodeBuffer":11,"./signature":14,"./stringWriter":16,"./support":17,"./uint8ArrayWriter":19,"./utf8":20,"./utils":21}],14:[function(a,b,c){"use strict";c.LOCAL_FILE_HEADER="PK",c.CENTRAL_FILE_HEADER="PK",c.CENTRAL_DIRECTORY_END="PK",c.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",c.ZIP64_CENTRAL_DIRECTORY_END="PK",c.DATA_DESCRIPTOR="PK\b"},{}],15:[function(a,b){"use strict";function c(a,b){this.data=a,b||(this.data=e.string2binary(this.data)),this.length=this.data.length,this.index=0}var d=a("./dataReader"),e=a("./utils");c.prototype=new d,c.prototype.byteAt=function(a){return this.data.charCodeAt(a)},c.prototype.lastIndexOfSignature=function(a){return this.data.lastIndexOf(a)},c.prototype.readData=function(a){this.checkOffset(a);var b=this.data.slice(this.index,this.index+a);return this.index+=a,b},b.exports=c},{"./dataReader":5,"./utils":21}],16:[function(a,b){"use strict";var c=a("./utils"),d=function(){this.data=[]};d.prototype={append:function(a){a=c.transformTo("string",a),this.data.push(a)},finalize:function(){return this.data.join("")}},b.exports=d},{"./utils":21}],17:[function(a,b,c){(function(a){"use strict";if(c.base64=!0,c.array=!0,c.string=!0,c.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,c.nodebuffer="undefined"!=typeof a,c.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)c.blob=!1;else{var b=new ArrayBuffer(0);try{c.blob=0===new Blob([b],{type:"application/zip"}).size}catch(d){try{var e=window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder,f=new e;f.append(b),c.blob=0===f.getBlob("application/zip").size}catch(d){c.blob=!1}}}}).call(this,"undefined"!=typeof Buffer?Buffer:void 0)},{}],18:[function(a,b){"use strict";function c(a){a&&(this.data=a,this.length=this.data.length,this.index=0)}var d=a("./dataReader");c.prototype=new d,c.prototype.byteAt=function(a){return this.data[a]},c.prototype.lastIndexOfSignature=function(a){for(var b=a.charCodeAt(0),c=a.charCodeAt(1),d=a.charCodeAt(2),e=a.charCodeAt(3),f=this.length-4;f>=0;--f)if(this.data[f]===b&&this.data[f+1]===c&&this.data[f+2]===d&&this.data[f+3]===e)return f;return-1},c.prototype.readData=function(a){if(this.checkOffset(a),0===a)return new Uint8Array(0);var b=this.data.subarray(this.index,this.index+a);return this.index+=a,b},b.exports=c},{"./dataReader":5}],19:[function(a,b){"use strict";var c=a("./utils"),d=function(a){this.data=new Uint8Array(a),this.index=0};d.prototype={append:function(a){0!==a.length&&(a=c.transformTo("uint8array",a),this.data.set(a,this.index),this.index+=a.length)},finalize:function(){return this.data}},b.exports=d},{"./utils":21}],20:[function(a,b,c){"use strict";for(var d=a("./utils"),e=a("./support"),f=a("./nodeBuffer"),g=new Array(256),h=0;256>h;h++)g[h]=h>=252?6:h>=248?5:h>=240?4:h>=224?3:h>=192?2:1;g[254]=g[254]=1;var i=function(a){var b,c,d,f,g,h=a.length,i=0;for(f=0;h>f;f++)c=a.charCodeAt(f),55296===(64512&c)&&h>f+1&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),i+=128>c?1:2048>c?2:65536>c?3:4;for(b=e.uint8array?new Uint8Array(i):new Array(i),g=0,f=0;i>g;f++)c=a.charCodeAt(f),55296===(64512&c)&&h>f+1&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),128>c?b[g++]=c:2048>c?(b[g++]=192|c>>>6,b[g++]=128|63&c):65536>c?(b[g++]=224|c>>>12,b[g++]=128|c>>>6&63,b[g++]=128|63&c):(b[g++]=240|c>>>18,b[g++]=128|c>>>12&63,b[g++]=128|c>>>6&63,b[g++]=128|63&c);return b},j=function(a,b){var c;for(b=b||a.length,b>a.length&&(b=a.length),c=b-1;c>=0&&128===(192&a[c]);)c--;return 0>c?b:0===c?b:c+g[a[c]]>b?c:b},k=function(a){var b,c,e,f,h=a.length,i=new Array(2*h);for(c=0,b=0;h>b;)if(e=a[b++],128>e)i[c++]=e;else if(f=g[e],f>4)i[c++]=65533,b+=f-1;else{for(e&=2===f?31:3===f?15:7;f>1&&h>b;)e=e<<6|63&a[b++],f--;f>1?i[c++]=65533:65536>e?i[c++]=e:(e-=65536,i[c++]=55296|e>>10&1023,i[c++]=56320|1023&e)}return i.length!==c&&(i.subarray?i=i.subarray(0,c):i.length=c),d.applyFromCharCode(i)};c.utf8encode=function(a){return e.nodebuffer?f(a,"utf-8"):i(a)},c.utf8decode=function(a){if(e.nodebuffer)return d.transformTo("nodebuffer",a).toString("utf-8");a=d.transformTo(e.uint8array?"uint8array":"array",a);for(var b=[],c=0,f=a.length,g=65536;f>c;){var h=j(a,Math.min(c+g,f));b.push(e.uint8array?k(a.subarray(c,h)):k(a.slice(c,h))),c=h}return b.join("")}},{"./nodeBuffer":11,"./support":17,"./utils":21}],21:[function(a,b,c){"use strict";function d(a){return a}function e(a,b){for(var c=0;c<a.length;++c)b[c]=255&a.charCodeAt(c);return b}function f(a){var b=65536,d=[],e=a.length,f=c.getTypeOf(a),g=0,h=!0;try{switch(f){case"uint8array":String.fromCharCode.apply(null,new Uint8Array(0));break;case"nodebuffer":String.fromCharCode.apply(null,j(0))}}catch(i){h=!1}if(!h){for(var k="",l=0;l<a.length;l++)k+=String.fromCharCode(a[l]);return k}for(;e>g&&b>1;)try{d.push("array"===f||"nodebuffer"===f?String.fromCharCode.apply(null,a.slice(g,Math.min(g+b,e))):String.fromCharCode.apply(null,a.subarray(g,Math.min(g+b,e)))),g+=b}catch(i){b=Math.floor(b/2)}return d.join("")}function g(a,b){for(var c=0;c<a.length;c++)b[c]=a[c];return b}var h=a("./support"),i=a("./compressions"),j=a("./nodeBuffer");c.string2binary=function(a){for(var b="",c=0;c<a.length;c++)b+=String.fromCharCode(255&a.charCodeAt(c));return b},c.arrayBuffer2Blob=function(a,b){c.checkSupport("blob"),b=b||"application/zip";try{return new Blob([a],{type:b})}catch(d){try{var e=window.BlobBuilder||window.WebKitBlobBuilder||window.MozBlobBuilder||window.MSBlobBuilder,f=new e;return f.append(a),f.getBlob(b)}catch(d){throw new Error("Bug : can't construct the Blob.")}}},c.applyFromCharCode=f;var k={};k.string={string:d,array:function(a){return e(a,new Array(a.length))},arraybuffer:function(a){return k.string.uint8array(a).buffer},uint8array:function(a){return e(a,new Uint8Array(a.length))},nodebuffer:function(a){return e(a,j(a.length))}},k.array={string:f,array:d,arraybuffer:function(a){return new Uint8Array(a).buffer},uint8array:function(a){return new Uint8Array(a)},nodebuffer:function(a){return j(a)}},k.arraybuffer={string:function(a){return f(new Uint8Array(a))},array:function(a){return g(new Uint8Array(a),new Array(a.byteLength))},arraybuffer:d,uint8array:function(a){return new Uint8Array(a)},nodebuffer:function(a){return j(new Uint8Array(a))}},k.uint8array={string:f,array:function(a){return g(a,new Array(a.length))},arraybuffer:function(a){return a.buffer},uint8array:d,nodebuffer:function(a){return j(a)}},k.nodebuffer={string:f,array:function(a){return g(a,new Array(a.length))},arraybuffer:function(a){return k.nodebuffer.uint8array(a).buffer},uint8array:function(a){return g(a,new Uint8Array(a.length))},nodebuffer:d},c.transformTo=function(a,b){if(b||(b=""),!a)return b;c.checkSupport(a);var d=c.getTypeOf(b),e=k[d][a](b);return e},c.getTypeOf=function(a){return"string"==typeof a?"string":"[object Array]"===Object.prototype.toString.call(a)?"array":h.nodebuffer&&j.test(a)?"nodebuffer":h.uint8array&&a instanceof Uint8Array?"uint8array":h.arraybuffer&&a instanceof ArrayBuffer?"arraybuffer":void 0},c.checkSupport=function(a){var b=h[a.toLowerCase()];if(!b)throw new Error(a+" is not supported by this browser")},c.MAX_VALUE_16BITS=65535,c.MAX_VALUE_32BITS=-1,c.pretty=function(a){var b,c,d="";for(c=0;c<(a||"").length;c++)b=a.charCodeAt(c),d+="\\x"+(16>b?"0":"")+b.toString(16).toUpperCase();return d},c.findCompression=function(a){for(var b in i)if(i.hasOwnProperty(b)&&i[b].magic===a)return i[b];return null},c.isRegExp=function(a){return"[object RegExp]"===Object.prototype.toString.call(a)}},{"./compressions":3,"./nodeBuffer":11,"./support":17}],22:[function(a,b){"use strict";function c(a,b){this.files=[],this.loadOptions=b,a&&this.load(a)}var d=a("./stringReader"),e=a("./nodeBufferReader"),f=a("./uint8ArrayReader"),g=a("./utils"),h=a("./signature"),i=a("./zipEntry"),j=a("./support"),k=a("./object");c.prototype={checkSignature:function(a){var b=this.reader.readString(4);if(b!==a)throw new Error("Corrupted zip or bug : unexpected signature ("+g.pretty(b)+", expected "+g.pretty(a)+")")},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2),this.zipComment=this.reader.readString(this.zipCommentLength),this.zipComment=k.utf8decode(this.zipComment)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.versionMadeBy=this.reader.readString(2),this.versionNeeded=this.reader.readInt(2),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var a,b,c,d=this.zip64EndOfCentralSize-44,e=0;d>e;)a=this.reader.readInt(2),b=this.reader.readInt(4),c=this.reader.readString(b),this.zip64ExtensibleData[a]={id:a,length:b,value:c}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),this.disksCount>1)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var a,b;for(a=0;a<this.files.length;a++)b=this.files[a],this.reader.setIndex(b.localHeaderOffset),this.checkSignature(h.LOCAL_FILE_HEADER),b.readLocalPart(this.reader),b.handleUTF8(),b.processAttributes()},readCentralDir:function(){var a;for(this.reader.setIndex(this.centralDirOffset);this.reader.readString(4)===h.CENTRAL_FILE_HEADER;)a=new i({zip64:this.zip64},this.loadOptions),a.readCentralPart(this.reader),this.files.push(a)},readEndOfCentral:function(){var a=this.reader.lastIndexOfSignature(h.CENTRAL_DIRECTORY_END);if(-1===a){var b=!0;try{this.reader.setIndex(0),this.checkSignature(h.LOCAL_FILE_HEADER),b=!1}catch(c){}throw new Error(b?"Can't find end of central directory : is this a zip file ? If it is, see http://stuk.github.io/jszip/documentation/howto/read_zip.html":"Corrupted zip : can't find end of central directory")}if(this.reader.setIndex(a),this.checkSignature(h.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===g.MAX_VALUE_16BITS||this.diskWithCentralDirStart===g.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===g.MAX_VALUE_16BITS||this.centralDirRecords===g.MAX_VALUE_16BITS||this.centralDirSize===g.MAX_VALUE_32BITS||this.centralDirOffset===g.MAX_VALUE_32BITS){if(this.zip64=!0,a=this.reader.lastIndexOfSignature(h.ZIP64_CENTRAL_DIRECTORY_LOCATOR),-1===a)throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");this.reader.setIndex(a),this.checkSignature(h.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(h.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}},prepareReader:function(a){var b=g.getTypeOf(a);this.reader="string"!==b||j.uint8array?"nodebuffer"===b?new e(a):new f(g.transformTo("uint8array",a)):new d(a,this.loadOptions.optimizedBinaryString)},load:function(a){this.prepareReader(a),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},b.exports=c},{"./nodeBufferReader":12,"./object":13,"./signature":14,"./stringReader":15,"./support":17,"./uint8ArrayReader":18,"./utils":21,"./zipEntry":23}],23:[function(a,b){"use strict";function c(a,b){this.options=a,this.loadOptions=b}var d=a("./stringReader"),e=a("./utils"),f=a("./compressedObject"),g=a("./object"),h=0,i=3;c.prototype={isEncrypted:function(){return 1===(1&this.bitFlag)},useUTF8:function(){return 2048===(2048&this.bitFlag)},prepareCompressedContent:function(a,b,c){return function(){var d=a.index;a.setIndex(b);var e=a.readData(c);return a.setIndex(d),e}},prepareContent:function(a,b,c,d,f){return function(){var a=e.transformTo(d.uncompressInputType,this.getCompressedContent()),b=d.uncompress(a);if(b.length!==f)throw new Error("Bug : uncompressed data size mismatch");return b}},readLocalPart:function(a){var b,c;if(a.skip(22),this.fileNameLength=a.readInt(2),c=a.readInt(2),this.fileName=a.readString(this.fileNameLength),a.skip(c),-1==this.compressedSize||-1==this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory (compressedSize == -1 || uncompressedSize == -1)");if(b=e.findCompression(this.compressionMethod),null===b)throw new Error("Corrupted zip : compression "+e.pretty(this.compressionMethod)+" unknown (inner file : "+this.fileName+")");if(this.decompressed=new f,this.decompressed.compressedSize=this.compressedSize,this.decompressed.uncompressedSize=this.uncompressedSize,this.decompressed.crc32=this.crc32,this.decompressed.compressionMethod=this.compressionMethod,this.decompressed.getCompressedContent=this.prepareCompressedContent(a,a.index,this.compressedSize,b),this.decompressed.getContent=this.prepareContent(a,a.index,this.compressedSize,b,this.uncompressedSize),this.loadOptions.checkCRC32&&(this.decompressed=e.transformTo("string",this.decompressed.getContent()),g.crc32(this.decompressed)!==this.crc32))throw new Error("Corrupted zip : CRC32 mismatch")},readCentralPart:function(a){if(this.versionMadeBy=a.readInt(2),this.versionNeeded=a.readInt(2),this.bitFlag=a.readInt(2),this.compressionMethod=a.readString(2),this.date=a.readDate(),this.crc32=a.readInt(4),this.compressedSize=a.readInt(4),this.uncompressedSize=a.readInt(4),this.fileNameLength=a.readInt(2),this.extraFieldsLength=a.readInt(2),this.fileCommentLength=a.readInt(2),this.diskNumberStart=a.readInt(2),this.internalFileAttributes=a.readInt(2),this.externalFileAttributes=a.readInt(4),this.localHeaderOffset=a.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");this.fileName=a.readString(this.fileNameLength),this.readExtraFields(a),this.parseZIP64ExtraField(a),this.fileComment=a.readString(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var a=this.versionMadeBy>>8;this.dir=16&this.externalFileAttributes?!0:!1,a===h&&(this.dosPermissions=63&this.externalFileAttributes),a===i&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileName.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(){if(this.extraFields[1]){var a=new d(this.extraFields[1].value);this.uncompressedSize===e.MAX_VALUE_32BITS&&(this.uncompressedSize=a.readInt(8)),this.compressedSize===e.MAX_VALUE_32BITS&&(this.compressedSize=a.readInt(8)),this.localHeaderOffset===e.MAX_VALUE_32BITS&&(this.localHeaderOffset=a.readInt(8)),this.diskNumberStart===e.MAX_VALUE_32BITS&&(this.diskNumberStart=a.readInt(4))}},readExtraFields:function(a){var b,c,d,e=a.index;for(this.extraFields=this.extraFields||{};a.index<e+this.extraFieldsLength;)b=a.readInt(2),c=a.readInt(2),d=a.readString(c),this.extraFields[b]={id:b,length:c,value:d}},handleUTF8:function(){if(this.useUTF8())this.fileName=g.utf8decode(this.fileName),this.fileComment=g.utf8decode(this.fileComment);else{var a=this.findExtraFieldUnicodePath();null!==a&&(this.fileName=a);var b=this.findExtraFieldUnicodeComment();null!==b&&(this.fileComment=b)}},findExtraFieldUnicodePath:function(){var a=this.extraFields[28789];if(a){var b=new d(a.value);return 1!==b.readInt(1)?null:g.crc32(this.fileName)!==b.readInt(4)?null:g.utf8decode(b.readString(a.length-5))
  }return null},findExtraFieldUnicodeComment:function(){var a=this.extraFields[25461];if(a){var b=new d(a.value);return 1!==b.readInt(1)?null:g.crc32(this.fileComment)!==b.readInt(4)?null:g.utf8decode(b.readString(a.length-5))}return null}},b.exports=c},{"./compressedObject":2,"./object":13,"./stringReader":15,"./utils":21}],24:[function(a,b){"use strict";var c=a("./lib/utils/common").assign,d=a("./lib/deflate"),e=a("./lib/inflate"),f=a("./lib/zlib/constants"),g={};c(g,d,e,f),b.exports=g},{"./lib/deflate":25,"./lib/inflate":26,"./lib/utils/common":27,"./lib/zlib/constants":30}],25:[function(a,b,c){"use strict";function d(a,b){var c=new s(b);if(c.push(a,!0),c.err)throw c.msg;return c.result}function e(a,b){return b=b||{},b.raw=!0,d(a,b)}function f(a,b){return b=b||{},b.gzip=!0,d(a,b)}var g=a("./zlib/deflate.js"),h=a("./utils/common"),i=a("./utils/strings"),j=a("./zlib/messages"),k=a("./zlib/zstream"),l=0,m=4,n=0,o=1,p=-1,q=0,r=8,s=function(a){this.options=h.assign({level:p,method:r,chunkSize:16384,windowBits:15,memLevel:8,strategy:q,to:""},a||{});var b=this.options;b.raw&&b.windowBits>0?b.windowBits=-b.windowBits:b.gzip&&b.windowBits>0&&b.windowBits<16&&(b.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new k,this.strm.avail_out=0;var c=g.deflateInit2(this.strm,b.level,b.method,b.windowBits,b.memLevel,b.strategy);if(c!==n)throw new Error(j[c]);b.header&&g.deflateSetHeader(this.strm,b.header)};s.prototype.push=function(a,b){var c,d,e=this.strm,f=this.options.chunkSize;if(this.ended)return!1;d=b===~~b?b:b===!0?m:l,e.input="string"==typeof a?i.string2buf(a):a,e.next_in=0,e.avail_in=e.input.length;do{if(0===e.avail_out&&(e.output=new h.Buf8(f),e.next_out=0,e.avail_out=f),c=g.deflate(e,d),c!==o&&c!==n)return this.onEnd(c),this.ended=!0,!1;(0===e.avail_out||0===e.avail_in&&d===m)&&this.onData("string"===this.options.to?i.buf2binstring(h.shrinkBuf(e.output,e.next_out)):h.shrinkBuf(e.output,e.next_out))}while((e.avail_in>0||0===e.avail_out)&&c!==o);return d===m?(c=g.deflateEnd(this.strm),this.onEnd(c),this.ended=!0,c===n):!0},s.prototype.onData=function(a){this.chunks.push(a)},s.prototype.onEnd=function(a){a===n&&(this.result="string"===this.options.to?this.chunks.join(""):h.flattenChunks(this.chunks)),this.chunks=[],this.err=a,this.msg=this.strm.msg},c.Deflate=s,c.deflate=d,c.deflateRaw=e,c.gzip=f},{"./utils/common":27,"./utils/strings":28,"./zlib/deflate.js":32,"./zlib/messages":37,"./zlib/zstream":39}],26:[function(a,b,c){"use strict";function d(a,b){var c=new m(b);if(c.push(a,!0),c.err)throw c.msg;return c.result}function e(a,b){return b=b||{},b.raw=!0,d(a,b)}var f=a("./zlib/inflate.js"),g=a("./utils/common"),h=a("./utils/strings"),i=a("./zlib/constants"),j=a("./zlib/messages"),k=a("./zlib/zstream"),l=a("./zlib/gzheader"),m=function(a){this.options=g.assign({chunkSize:16384,windowBits:0,to:""},a||{});var b=this.options;b.raw&&b.windowBits>=0&&b.windowBits<16&&(b.windowBits=-b.windowBits,0===b.windowBits&&(b.windowBits=-15)),!(b.windowBits>=0&&b.windowBits<16)||a&&a.windowBits||(b.windowBits+=32),b.windowBits>15&&b.windowBits<48&&0===(15&b.windowBits)&&(b.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new k,this.strm.avail_out=0;var c=f.inflateInit2(this.strm,b.windowBits);if(c!==i.Z_OK)throw new Error(j[c]);this.header=new l,f.inflateGetHeader(this.strm,this.header)};m.prototype.push=function(a,b){var c,d,e,j,k,l=this.strm,m=this.options.chunkSize;if(this.ended)return!1;d=b===~~b?b:b===!0?i.Z_FINISH:i.Z_NO_FLUSH,l.input="string"==typeof a?h.binstring2buf(a):a,l.next_in=0,l.avail_in=l.input.length;do{if(0===l.avail_out&&(l.output=new g.Buf8(m),l.next_out=0,l.avail_out=m),c=f.inflate(l,i.Z_NO_FLUSH),c!==i.Z_STREAM_END&&c!==i.Z_OK)return this.onEnd(c),this.ended=!0,!1;l.next_out&&(0===l.avail_out||c===i.Z_STREAM_END||0===l.avail_in&&d===i.Z_FINISH)&&("string"===this.options.to?(e=h.utf8border(l.output,l.next_out),j=l.next_out-e,k=h.buf2string(l.output,e),l.next_out=j,l.avail_out=m-j,j&&g.arraySet(l.output,l.output,e,j,0),this.onData(k)):this.onData(g.shrinkBuf(l.output,l.next_out)))}while(l.avail_in>0&&c!==i.Z_STREAM_END);return c===i.Z_STREAM_END&&(d=i.Z_FINISH),d===i.Z_FINISH?(c=f.inflateEnd(this.strm),this.onEnd(c),this.ended=!0,c===i.Z_OK):!0},m.prototype.onData=function(a){this.chunks.push(a)},m.prototype.onEnd=function(a){a===i.Z_OK&&(this.result="string"===this.options.to?this.chunks.join(""):g.flattenChunks(this.chunks)),this.chunks=[],this.err=a,this.msg=this.strm.msg},c.Inflate=m,c.inflate=d,c.inflateRaw=e,c.ungzip=d},{"./utils/common":27,"./utils/strings":28,"./zlib/constants":30,"./zlib/gzheader":33,"./zlib/inflate.js":35,"./zlib/messages":37,"./zlib/zstream":39}],27:[function(a,b,c){"use strict";var d="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;c.assign=function(a){for(var b=Array.prototype.slice.call(arguments,1);b.length;){var c=b.shift();if(c){if("object"!=typeof c)throw new TypeError(c+"must be non-object");for(var d in c)c.hasOwnProperty(d)&&(a[d]=c[d])}}return a},c.shrinkBuf=function(a,b){return a.length===b?a:a.subarray?a.subarray(0,b):(a.length=b,a)};var e={arraySet:function(a,b,c,d,e){if(b.subarray&&a.subarray)return void a.set(b.subarray(c,c+d),e);for(var f=0;d>f;f++)a[e+f]=b[c+f]},flattenChunks:function(a){var b,c,d,e,f,g;for(d=0,b=0,c=a.length;c>b;b++)d+=a[b].length;for(g=new Uint8Array(d),e=0,b=0,c=a.length;c>b;b++)f=a[b],g.set(f,e),e+=f.length;return g}},f={arraySet:function(a,b,c,d,e){for(var f=0;d>f;f++)a[e+f]=b[c+f]},flattenChunks:function(a){return[].concat.apply([],a)}};c.setTyped=function(a){a?(c.Buf8=Uint8Array,c.Buf16=Uint16Array,c.Buf32=Int32Array,c.assign(c,e)):(c.Buf8=Array,c.Buf16=Array,c.Buf32=Array,c.assign(c,f))},c.setTyped(d)},{}],28:[function(a,b,c){"use strict";function d(a,b){if(65537>b&&(a.subarray&&g||!a.subarray&&f))return String.fromCharCode.apply(null,e.shrinkBuf(a,b));for(var c="",d=0;b>d;d++)c+=String.fromCharCode(a[d]);return c}var e=a("./common"),f=!0,g=!0;try{String.fromCharCode.apply(null,[0])}catch(h){f=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(h){g=!1}for(var i=new e.Buf8(256),j=0;256>j;j++)i[j]=j>=252?6:j>=248?5:j>=240?4:j>=224?3:j>=192?2:1;i[254]=i[254]=1,c.string2buf=function(a){var b,c,d,f,g,h=a.length,i=0;for(f=0;h>f;f++)c=a.charCodeAt(f),55296===(64512&c)&&h>f+1&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),i+=128>c?1:2048>c?2:65536>c?3:4;for(b=new e.Buf8(i),g=0,f=0;i>g;f++)c=a.charCodeAt(f),55296===(64512&c)&&h>f+1&&(d=a.charCodeAt(f+1),56320===(64512&d)&&(c=65536+(c-55296<<10)+(d-56320),f++)),128>c?b[g++]=c:2048>c?(b[g++]=192|c>>>6,b[g++]=128|63&c):65536>c?(b[g++]=224|c>>>12,b[g++]=128|c>>>6&63,b[g++]=128|63&c):(b[g++]=240|c>>>18,b[g++]=128|c>>>12&63,b[g++]=128|c>>>6&63,b[g++]=128|63&c);return b},c.buf2binstring=function(a){return d(a,a.length)},c.binstring2buf=function(a){for(var b=new e.Buf8(a.length),c=0,d=b.length;d>c;c++)b[c]=a.charCodeAt(c);return b},c.buf2string=function(a,b){var c,e,f,g,h=b||a.length,j=new Array(2*h);for(e=0,c=0;h>c;)if(f=a[c++],128>f)j[e++]=f;else if(g=i[f],g>4)j[e++]=65533,c+=g-1;else{for(f&=2===g?31:3===g?15:7;g>1&&h>c;)f=f<<6|63&a[c++],g--;g>1?j[e++]=65533:65536>f?j[e++]=f:(f-=65536,j[e++]=55296|f>>10&1023,j[e++]=56320|1023&f)}return d(j,e)},c.utf8border=function(a,b){var c;for(b=b||a.length,b>a.length&&(b=a.length),c=b-1;c>=0&&128===(192&a[c]);)c--;return 0>c?b:0===c?b:c+i[a[c]]>b?c:b}},{"./common":27}],29:[function(a,b){"use strict";function c(a,b,c,d){for(var e=65535&a|0,f=a>>>16&65535|0,g=0;0!==c;){g=c>2e3?2e3:c,c-=g;do e=e+b[d++]|0,f=f+e|0;while(--g);e%=65521,f%=65521}return e|f<<16|0}b.exports=c},{}],30:[function(a,b){b.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],31:[function(a,b){"use strict";function c(){for(var a,b=[],c=0;256>c;c++){a=c;for(var d=0;8>d;d++)a=1&a?3988292384^a>>>1:a>>>1;b[c]=a}return b}function d(a,b,c,d){var f=e,g=d+c;a=-1^a;for(var h=d;g>h;h++)a=a>>>8^f[255&(a^b[h])];return-1^a}var e=c();b.exports=d},{}],32:[function(a,b,c){"use strict";function d(a,b){return a.msg=G[b],b}function e(a){return(a<<1)-(a>4?9:0)}function f(a){for(var b=a.length;--b>=0;)a[b]=0}function g(a){var b=a.state,c=b.pending;c>a.avail_out&&(c=a.avail_out),0!==c&&(C.arraySet(a.output,b.pending_buf,b.pending_out,c,a.next_out),a.next_out+=c,b.pending_out+=c,a.total_out+=c,a.avail_out-=c,b.pending-=c,0===b.pending&&(b.pending_out=0))}function h(a,b){D._tr_flush_block(a,a.block_start>=0?a.block_start:-1,a.strstart-a.block_start,b),a.block_start=a.strstart,g(a.strm)}function i(a,b){a.pending_buf[a.pending++]=b}function j(a,b){a.pending_buf[a.pending++]=b>>>8&255,a.pending_buf[a.pending++]=255&b}function k(a,b,c,d){var e=a.avail_in;return e>d&&(e=d),0===e?0:(a.avail_in-=e,C.arraySet(b,a.input,a.next_in,e,c),1===a.state.wrap?a.adler=E(a.adler,b,e,c):2===a.state.wrap&&(a.adler=F(a.adler,b,e,c)),a.next_in+=e,a.total_in+=e,e)}function l(a,b){var c,d,e=a.max_chain_length,f=a.strstart,g=a.prev_length,h=a.nice_match,i=a.strstart>a.w_size-jb?a.strstart-(a.w_size-jb):0,j=a.window,k=a.w_mask,l=a.prev,m=a.strstart+ib,n=j[f+g-1],o=j[f+g];a.prev_length>=a.good_match&&(e>>=2),h>a.lookahead&&(h=a.lookahead);do if(c=b,j[c+g]===o&&j[c+g-1]===n&&j[c]===j[f]&&j[++c]===j[f+1]){f+=2,c++;do;while(j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&j[++f]===j[++c]&&m>f);if(d=ib-(m-f),f=m-ib,d>g){if(a.match_start=b,g=d,d>=h)break;n=j[f+g-1],o=j[f+g]}}while((b=l[b&k])>i&&0!==--e);return g<=a.lookahead?g:a.lookahead}function m(a){var b,c,d,e,f,g=a.w_size;do{if(e=a.window_size-a.lookahead-a.strstart,a.strstart>=g+(g-jb)){C.arraySet(a.window,a.window,g,g,0),a.match_start-=g,a.strstart-=g,a.block_start-=g,c=a.hash_size,b=c;do d=a.head[--b],a.head[b]=d>=g?d-g:0;while(--c);c=g,b=c;do d=a.prev[--b],a.prev[b]=d>=g?d-g:0;while(--c);e+=g}if(0===a.strm.avail_in)break;if(c=k(a.strm,a.window,a.strstart+a.lookahead,e),a.lookahead+=c,a.lookahead+a.insert>=hb)for(f=a.strstart-a.insert,a.ins_h=a.window[f],a.ins_h=(a.ins_h<<a.hash_shift^a.window[f+1])&a.hash_mask;a.insert&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[f+hb-1])&a.hash_mask,a.prev[f&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=f,f++,a.insert--,!(a.lookahead+a.insert<hb)););}while(a.lookahead<jb&&0!==a.strm.avail_in)}function n(a,b){var c=65535;for(c>a.pending_buf_size-5&&(c=a.pending_buf_size-5);;){if(a.lookahead<=1){if(m(a),0===a.lookahead&&b===H)return sb;if(0===a.lookahead)break}a.strstart+=a.lookahead,a.lookahead=0;var d=a.block_start+c;if((0===a.strstart||a.strstart>=d)&&(a.lookahead=a.strstart-d,a.strstart=d,h(a,!1),0===a.strm.avail_out))return sb;if(a.strstart-a.block_start>=a.w_size-jb&&(h(a,!1),0===a.strm.avail_out))return sb}return a.insert=0,b===K?(h(a,!0),0===a.strm.avail_out?ub:vb):a.strstart>a.block_start&&(h(a,!1),0===a.strm.avail_out)?sb:sb}function o(a,b){for(var c,d;;){if(a.lookahead<jb){if(m(a),a.lookahead<jb&&b===H)return sb;if(0===a.lookahead)break}if(c=0,a.lookahead>=hb&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+hb-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart),0!==c&&a.strstart-c<=a.w_size-jb&&(a.match_length=l(a,c)),a.match_length>=hb)if(d=D._tr_tally(a,a.strstart-a.match_start,a.match_length-hb),a.lookahead-=a.match_length,a.match_length<=a.max_lazy_match&&a.lookahead>=hb){a.match_length--;do a.strstart++,a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+hb-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart;while(0!==--a.match_length);a.strstart++}else a.strstart+=a.match_length,a.match_length=0,a.ins_h=a.window[a.strstart],a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+1])&a.hash_mask;else d=D._tr_tally(a,0,a.window[a.strstart]),a.lookahead--,a.strstart++;if(d&&(h(a,!1),0===a.strm.avail_out))return sb}return a.insert=a.strstart<hb-1?a.strstart:hb-1,b===K?(h(a,!0),0===a.strm.avail_out?ub:vb):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?sb:tb}function p(a,b){for(var c,d,e;;){if(a.lookahead<jb){if(m(a),a.lookahead<jb&&b===H)return sb;if(0===a.lookahead)break}if(c=0,a.lookahead>=hb&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+hb-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart),a.prev_length=a.match_length,a.prev_match=a.match_start,a.match_length=hb-1,0!==c&&a.prev_length<a.max_lazy_match&&a.strstart-c<=a.w_size-jb&&(a.match_length=l(a,c),a.match_length<=5&&(a.strategy===S||a.match_length===hb&&a.strstart-a.match_start>4096)&&(a.match_length=hb-1)),a.prev_length>=hb&&a.match_length<=a.prev_length){e=a.strstart+a.lookahead-hb,d=D._tr_tally(a,a.strstart-1-a.prev_match,a.prev_length-hb),a.lookahead-=a.prev_length-1,a.prev_length-=2;do++a.strstart<=e&&(a.ins_h=(a.ins_h<<a.hash_shift^a.window[a.strstart+hb-1])&a.hash_mask,c=a.prev[a.strstart&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=a.strstart);while(0!==--a.prev_length);if(a.match_available=0,a.match_length=hb-1,a.strstart++,d&&(h(a,!1),0===a.strm.avail_out))return sb}else if(a.match_available){if(d=D._tr_tally(a,0,a.window[a.strstart-1]),d&&h(a,!1),a.strstart++,a.lookahead--,0===a.strm.avail_out)return sb}else a.match_available=1,a.strstart++,a.lookahead--}return a.match_available&&(d=D._tr_tally(a,0,a.window[a.strstart-1]),a.match_available=0),a.insert=a.strstart<hb-1?a.strstart:hb-1,b===K?(h(a,!0),0===a.strm.avail_out?ub:vb):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?sb:tb}function q(a,b){for(var c,d,e,f,g=a.window;;){if(a.lookahead<=ib){if(m(a),a.lookahead<=ib&&b===H)return sb;if(0===a.lookahead)break}if(a.match_length=0,a.lookahead>=hb&&a.strstart>0&&(e=a.strstart-1,d=g[e],d===g[++e]&&d===g[++e]&&d===g[++e])){f=a.strstart+ib;do;while(d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&d===g[++e]&&f>e);a.match_length=ib-(f-e),a.match_length>a.lookahead&&(a.match_length=a.lookahead)}if(a.match_length>=hb?(c=D._tr_tally(a,1,a.match_length-hb),a.lookahead-=a.match_length,a.strstart+=a.match_length,a.match_length=0):(c=D._tr_tally(a,0,a.window[a.strstart]),a.lookahead--,a.strstart++),c&&(h(a,!1),0===a.strm.avail_out))return sb}return a.insert=0,b===K?(h(a,!0),0===a.strm.avail_out?ub:vb):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?sb:tb}function r(a,b){for(var c;;){if(0===a.lookahead&&(m(a),0===a.lookahead)){if(b===H)return sb;break}if(a.match_length=0,c=D._tr_tally(a,0,a.window[a.strstart]),a.lookahead--,a.strstart++,c&&(h(a,!1),0===a.strm.avail_out))return sb}return a.insert=0,b===K?(h(a,!0),0===a.strm.avail_out?ub:vb):a.last_lit&&(h(a,!1),0===a.strm.avail_out)?sb:tb}function s(a){a.window_size=2*a.w_size,f(a.head),a.max_lazy_match=B[a.level].max_lazy,a.good_match=B[a.level].good_length,a.nice_match=B[a.level].nice_length,a.max_chain_length=B[a.level].max_chain,a.strstart=0,a.block_start=0,a.lookahead=0,a.insert=0,a.match_length=a.prev_length=hb-1,a.match_available=0,a.ins_h=0}function t(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=Y,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new C.Buf16(2*fb),this.dyn_dtree=new C.Buf16(2*(2*db+1)),this.bl_tree=new C.Buf16(2*(2*eb+1)),f(this.dyn_ltree),f(this.dyn_dtree),f(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new C.Buf16(gb+1),this.heap=new C.Buf16(2*cb+1),f(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new C.Buf16(2*cb+1),f(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function u(a){var b;return a&&a.state?(a.total_in=a.total_out=0,a.data_type=X,b=a.state,b.pending=0,b.pending_out=0,b.wrap<0&&(b.wrap=-b.wrap),b.status=b.wrap?lb:qb,a.adler=2===b.wrap?0:1,b.last_flush=H,D._tr_init(b),M):d(a,O)}function v(a){var b=u(a);return b===M&&s(a.state),b}function w(a,b){return a&&a.state?2!==a.state.wrap?O:(a.state.gzhead=b,M):O}function x(a,b,c,e,f,g){if(!a)return O;var h=1;if(b===R&&(b=6),0>e?(h=0,e=-e):e>15&&(h=2,e-=16),1>f||f>Z||c!==Y||8>e||e>15||0>b||b>9||0>g||g>V)return d(a,O);8===e&&(e=9);var i=new t;return a.state=i,i.strm=a,i.wrap=h,i.gzhead=null,i.w_bits=e,i.w_size=1<<i.w_bits,i.w_mask=i.w_size-1,i.hash_bits=f+7,i.hash_size=1<<i.hash_bits,i.hash_mask=i.hash_size-1,i.hash_shift=~~((i.hash_bits+hb-1)/hb),i.window=new C.Buf8(2*i.w_size),i.head=new C.Buf16(i.hash_size),i.prev=new C.Buf16(i.w_size),i.lit_bufsize=1<<f+6,i.pending_buf_size=4*i.lit_bufsize,i.pending_buf=new C.Buf8(i.pending_buf_size),i.d_buf=i.lit_bufsize>>1,i.l_buf=3*i.lit_bufsize,i.level=b,i.strategy=g,i.method=c,v(a)}function y(a,b){return x(a,b,Y,$,_,W)}function z(a,b){var c,h,k,l;if(!a||!a.state||b>L||0>b)return a?d(a,O):O;if(h=a.state,!a.output||!a.input&&0!==a.avail_in||h.status===rb&&b!==K)return d(a,0===a.avail_out?Q:O);if(h.strm=a,c=h.last_flush,h.last_flush=b,h.status===lb)if(2===h.wrap)a.adler=0,i(h,31),i(h,139),i(h,8),h.gzhead?(i(h,(h.gzhead.text?1:0)+(h.gzhead.hcrc?2:0)+(h.gzhead.extra?4:0)+(h.gzhead.name?8:0)+(h.gzhead.comment?16:0)),i(h,255&h.gzhead.time),i(h,h.gzhead.time>>8&255),i(h,h.gzhead.time>>16&255),i(h,h.gzhead.time>>24&255),i(h,9===h.level?2:h.strategy>=T||h.level<2?4:0),i(h,255&h.gzhead.os),h.gzhead.extra&&h.gzhead.extra.length&&(i(h,255&h.gzhead.extra.length),i(h,h.gzhead.extra.length>>8&255)),h.gzhead.hcrc&&(a.adler=F(a.adler,h.pending_buf,h.pending,0)),h.gzindex=0,h.status=mb):(i(h,0),i(h,0),i(h,0),i(h,0),i(h,0),i(h,9===h.level?2:h.strategy>=T||h.level<2?4:0),i(h,wb),h.status=qb);else{var m=Y+(h.w_bits-8<<4)<<8,n=-1;n=h.strategy>=T||h.level<2?0:h.level<6?1:6===h.level?2:3,m|=n<<6,0!==h.strstart&&(m|=kb),m+=31-m%31,h.status=qb,j(h,m),0!==h.strstart&&(j(h,a.adler>>>16),j(h,65535&a.adler)),a.adler=1}if(h.status===mb)if(h.gzhead.extra){for(k=h.pending;h.gzindex<(65535&h.gzhead.extra.length)&&(h.pending!==h.pending_buf_size||(h.gzhead.hcrc&&h.pending>k&&(a.adler=F(a.adler,h.pending_buf,h.pending-k,k)),g(a),k=h.pending,h.pending!==h.pending_buf_size));)i(h,255&h.gzhead.extra[h.gzindex]),h.gzindex++;h.gzhead.hcrc&&h.pending>k&&(a.adler=F(a.adler,h.pending_buf,h.pending-k,k)),h.gzindex===h.gzhead.extra.length&&(h.gzindex=0,h.status=nb)}else h.status=nb;if(h.status===nb)if(h.gzhead.name){k=h.pending;do{if(h.pending===h.pending_buf_size&&(h.gzhead.hcrc&&h.pending>k&&(a.adler=F(a.adler,h.pending_buf,h.pending-k,k)),g(a),k=h.pending,h.pending===h.pending_buf_size)){l=1;break}l=h.gzindex<h.gzhead.name.length?255&h.gzhead.name.charCodeAt(h.gzindex++):0,i(h,l)}while(0!==l);h.gzhead.hcrc&&h.pending>k&&(a.adler=F(a.adler,h.pending_buf,h.pending-k,k)),0===l&&(h.gzindex=0,h.status=ob)}else h.status=ob;if(h.status===ob)if(h.gzhead.comment){k=h.pending;do{if(h.pending===h.pending_buf_size&&(h.gzhead.hcrc&&h.pending>k&&(a.adler=F(a.adler,h.pending_buf,h.pending-k,k)),g(a),k=h.pending,h.pending===h.pending_buf_size)){l=1;break}l=h.gzindex<h.gzhead.comment.length?255&h.gzhead.comment.charCodeAt(h.gzindex++):0,i(h,l)}while(0!==l);h.gzhead.hcrc&&h.pending>k&&(a.adler=F(a.adler,h.pending_buf,h.pending-k,k)),0===l&&(h.status=pb)}else h.status=pb;if(h.status===pb&&(h.gzhead.hcrc?(h.pending+2>h.pending_buf_size&&g(a),h.pending+2<=h.pending_buf_size&&(i(h,255&a.adler),i(h,a.adler>>8&255),a.adler=0,h.status=qb)):h.status=qb),0!==h.pending){if(g(a),0===a.avail_out)return h.last_flush=-1,M}else if(0===a.avail_in&&e(b)<=e(c)&&b!==K)return d(a,Q);if(h.status===rb&&0!==a.avail_in)return d(a,Q);if(0!==a.avail_in||0!==h.lookahead||b!==H&&h.status!==rb){var o=h.strategy===T?r(h,b):h.strategy===U?q(h,b):B[h.level].func(h,b);if((o===ub||o===vb)&&(h.status=rb),o===sb||o===ub)return 0===a.avail_out&&(h.last_flush=-1),M;if(o===tb&&(b===I?D._tr_align(h):b!==L&&(D._tr_stored_block(h,0,0,!1),b===J&&(f(h.head),0===h.lookahead&&(h.strstart=0,h.block_start=0,h.insert=0))),g(a),0===a.avail_out))return h.last_flush=-1,M}return b!==K?M:h.wrap<=0?N:(2===h.wrap?(i(h,255&a.adler),i(h,a.adler>>8&255),i(h,a.adler>>16&255),i(h,a.adler>>24&255),i(h,255&a.total_in),i(h,a.total_in>>8&255),i(h,a.total_in>>16&255),i(h,a.total_in>>24&255)):(j(h,a.adler>>>16),j(h,65535&a.adler)),g(a),h.wrap>0&&(h.wrap=-h.wrap),0!==h.pending?M:N)}function A(a){var b;return a&&a.state?(b=a.state.status,b!==lb&&b!==mb&&b!==nb&&b!==ob&&b!==pb&&b!==qb&&b!==rb?d(a,O):(a.state=null,b===qb?d(a,P):M)):O}var B,C=a("../utils/common"),D=a("./trees"),E=a("./adler32"),F=a("./crc32"),G=a("./messages"),H=0,I=1,J=3,K=4,L=5,M=0,N=1,O=-2,P=-3,Q=-5,R=-1,S=1,T=2,U=3,V=4,W=0,X=2,Y=8,Z=9,$=15,_=8,ab=29,bb=256,cb=bb+1+ab,db=30,eb=19,fb=2*cb+1,gb=15,hb=3,ib=258,jb=ib+hb+1,kb=32,lb=42,mb=69,nb=73,ob=91,pb=103,qb=113,rb=666,sb=1,tb=2,ub=3,vb=4,wb=3,xb=function(a,b,c,d,e){this.good_length=a,this.max_lazy=b,this.nice_length=c,this.max_chain=d,this.func=e};B=[new xb(0,0,0,0,n),new xb(4,4,8,4,o),new xb(4,5,16,8,o),new xb(4,6,32,32,o),new xb(4,4,16,16,p),new xb(8,16,32,32,p),new xb(8,16,128,128,p),new xb(8,32,128,256,p),new xb(32,128,258,1024,p),new xb(32,258,258,4096,p)],c.deflateInit=y,c.deflateInit2=x,c.deflateReset=v,c.deflateResetKeep=u,c.deflateSetHeader=w,c.deflate=z,c.deflateEnd=A,c.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":27,"./adler32":29,"./crc32":31,"./messages":37,"./trees":38}],33:[function(a,b){"use strict";function c(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}b.exports=c},{}],34:[function(a,b){"use strict";var c=30,d=12;b.exports=function(a,b){var e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C;e=a.state,f=a.next_in,B=a.input,g=f+(a.avail_in-5),h=a.next_out,C=a.output,i=h-(b-a.avail_out),j=h+(a.avail_out-257),k=e.dmax,l=e.wsize,m=e.whave,n=e.wnext,o=e.window,p=e.hold,q=e.bits,r=e.lencode,s=e.distcode,t=(1<<e.lenbits)-1,u=(1<<e.distbits)-1;a:do{15>q&&(p+=B[f++]<<q,q+=8,p+=B[f++]<<q,q+=8),v=r[p&t];b:for(;;){if(w=v>>>24,p>>>=w,q-=w,w=v>>>16&255,0===w)C[h++]=65535&v;else{if(!(16&w)){if(0===(64&w)){v=r[(65535&v)+(p&(1<<w)-1)];continue b}if(32&w){e.mode=d;break a}a.msg="invalid literal/length code",e.mode=c;break a}x=65535&v,w&=15,w&&(w>q&&(p+=B[f++]<<q,q+=8),x+=p&(1<<w)-1,p>>>=w,q-=w),15>q&&(p+=B[f++]<<q,q+=8,p+=B[f++]<<q,q+=8),v=s[p&u];c:for(;;){if(w=v>>>24,p>>>=w,q-=w,w=v>>>16&255,!(16&w)){if(0===(64&w)){v=s[(65535&v)+(p&(1<<w)-1)];continue c}a.msg="invalid distance code",e.mode=c;break a}if(y=65535&v,w&=15,w>q&&(p+=B[f++]<<q,q+=8,w>q&&(p+=B[f++]<<q,q+=8)),y+=p&(1<<w)-1,y>k){a.msg="invalid distance too far back",e.mode=c;break a}if(p>>>=w,q-=w,w=h-i,y>w){if(w=y-w,w>m&&e.sane){a.msg="invalid distance too far back",e.mode=c;break a}if(z=0,A=o,0===n){if(z+=l-w,x>w){x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}}else if(w>n){if(z+=l+n-w,w-=n,x>w){x-=w;do C[h++]=o[z++];while(--w);if(z=0,x>n){w=n,x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}}}else if(z+=n-w,x>w){x-=w;do C[h++]=o[z++];while(--w);z=h-y,A=C}for(;x>2;)C[h++]=A[z++],C[h++]=A[z++],C[h++]=A[z++],x-=3;x&&(C[h++]=A[z++],x>1&&(C[h++]=A[z++]))}else{z=h-y;do C[h++]=C[z++],C[h++]=C[z++],C[h++]=C[z++],x-=3;while(x>2);x&&(C[h++]=C[z++],x>1&&(C[h++]=C[z++]))}break}}break}}while(g>f&&j>h);x=q>>3,f-=x,q-=x<<3,p&=(1<<q)-1,a.next_in=f,a.next_out=h,a.avail_in=g>f?5+(g-f):5-(f-g),a.avail_out=j>h?257+(j-h):257-(h-j),e.hold=p,e.bits=q}},{}],35:[function(a,b,c){"use strict";function d(a){return(a>>>24&255)+(a>>>8&65280)+((65280&a)<<8)+((255&a)<<24)}function e(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new r.Buf16(320),this.work=new r.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function f(a){var b;return a&&a.state?(b=a.state,a.total_in=a.total_out=b.total=0,a.msg="",b.wrap&&(a.adler=1&b.wrap),b.mode=K,b.last=0,b.havedict=0,b.dmax=32768,b.head=null,b.hold=0,b.bits=0,b.lencode=b.lendyn=new r.Buf32(ob),b.distcode=b.distdyn=new r.Buf32(pb),b.sane=1,b.back=-1,C):F}function g(a){var b;return a&&a.state?(b=a.state,b.wsize=0,b.whave=0,b.wnext=0,f(a)):F}function h(a,b){var c,d;return a&&a.state?(d=a.state,0>b?(c=0,b=-b):(c=(b>>4)+1,48>b&&(b&=15)),b&&(8>b||b>15)?F:(null!==d.window&&d.wbits!==b&&(d.window=null),d.wrap=c,d.wbits=b,g(a))):F}function i(a,b){var c,d;return a?(d=new e,a.state=d,d.window=null,c=h(a,b),c!==C&&(a.state=null),c):F}function j(a){return i(a,rb)}function k(a){if(sb){var b;for(p=new r.Buf32(512),q=new r.Buf32(32),b=0;144>b;)a.lens[b++]=8;for(;256>b;)a.lens[b++]=9;for(;280>b;)a.lens[b++]=7;for(;288>b;)a.lens[b++]=8;for(v(x,a.lens,0,288,p,0,a.work,{bits:9}),b=0;32>b;)a.lens[b++]=5;v(y,a.lens,0,32,q,0,a.work,{bits:5}),sb=!1}a.lencode=p,a.lenbits=9,a.distcode=q,a.distbits=5}function l(a,b,c,d){var e,f=a.state;return null===f.window&&(f.wsize=1<<f.wbits,f.wnext=0,f.whave=0,f.window=new r.Buf8(f.wsize)),d>=f.wsize?(r.arraySet(f.window,b,c-f.wsize,f.wsize,0),f.wnext=0,f.whave=f.wsize):(e=f.wsize-f.wnext,e>d&&(e=d),r.arraySet(f.window,b,c-d,e,f.wnext),d-=e,d?(r.arraySet(f.window,b,c-d,d,0),f.wnext=d,f.whave=f.wsize):(f.wnext+=e,f.wnext===f.wsize&&(f.wnext=0),f.whave<f.wsize&&(f.whave+=e))),0}function m(a,b){var c,e,f,g,h,i,j,m,n,o,p,q,ob,pb,qb,rb,sb,tb,ub,vb,wb,xb,yb,zb,Ab=0,Bb=new r.Buf8(4),Cb=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!a||!a.state||!a.output||!a.input&&0!==a.avail_in)return F;c=a.state,c.mode===V&&(c.mode=W),h=a.next_out,f=a.output,j=a.avail_out,g=a.next_in,e=a.input,i=a.avail_in,m=c.hold,n=c.bits,o=i,p=j,xb=C;a:for(;;)switch(c.mode){case K:if(0===c.wrap){c.mode=W;break}for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(2&c.wrap&&35615===m){c.check=0,Bb[0]=255&m,Bb[1]=m>>>8&255,c.check=t(c.check,Bb,2,0),m=0,n=0,c.mode=L;break}if(c.flags=0,c.head&&(c.head.done=!1),!(1&c.wrap)||(((255&m)<<8)+(m>>8))%31){a.msg="incorrect header check",c.mode=lb;break}if((15&m)!==J){a.msg="unknown compression method",c.mode=lb;break}if(m>>>=4,n-=4,wb=(15&m)+8,0===c.wbits)c.wbits=wb;else if(wb>c.wbits){a.msg="invalid window size",c.mode=lb;break}c.dmax=1<<wb,a.adler=c.check=1,c.mode=512&m?T:V,m=0,n=0;break;case L:for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(c.flags=m,(255&c.flags)!==J){a.msg="unknown compression method",c.mode=lb;break}if(57344&c.flags){a.msg="unknown header flags set",c.mode=lb;break}c.head&&(c.head.text=m>>8&1),512&c.flags&&(Bb[0]=255&m,Bb[1]=m>>>8&255,c.check=t(c.check,Bb,2,0)),m=0,n=0,c.mode=M;case M:for(;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.head&&(c.head.time=m),512&c.flags&&(Bb[0]=255&m,Bb[1]=m>>>8&255,Bb[2]=m>>>16&255,Bb[3]=m>>>24&255,c.check=t(c.check,Bb,4,0)),m=0,n=0,c.mode=N;case N:for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.head&&(c.head.xflags=255&m,c.head.os=m>>8),512&c.flags&&(Bb[0]=255&m,Bb[1]=m>>>8&255,c.check=t(c.check,Bb,2,0)),m=0,n=0,c.mode=O;case O:if(1024&c.flags){for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.length=m,c.head&&(c.head.extra_len=m),512&c.flags&&(Bb[0]=255&m,Bb[1]=m>>>8&255,c.check=t(c.check,Bb,2,0)),m=0,n=0}else c.head&&(c.head.extra=null);c.mode=P;case P:if(1024&c.flags&&(q=c.length,q>i&&(q=i),q&&(c.head&&(wb=c.head.extra_len-c.length,c.head.extra||(c.head.extra=new Array(c.head.extra_len)),r.arraySet(c.head.extra,e,g,q,wb)),512&c.flags&&(c.check=t(c.check,e,q,g)),i-=q,g+=q,c.length-=q),c.length))break a;c.length=0,c.mode=Q;case Q:if(2048&c.flags){if(0===i)break a;q=0;do wb=e[g+q++],c.head&&wb&&c.length<65536&&(c.head.name+=String.fromCharCode(wb));while(wb&&i>q);if(512&c.flags&&(c.check=t(c.check,e,q,g)),i-=q,g+=q,wb)break a}else c.head&&(c.head.name=null);c.length=0,c.mode=R;case R:if(4096&c.flags){if(0===i)break a;q=0;do wb=e[g+q++],c.head&&wb&&c.length<65536&&(c.head.comment+=String.fromCharCode(wb));while(wb&&i>q);if(512&c.flags&&(c.check=t(c.check,e,q,g)),i-=q,g+=q,wb)break a}else c.head&&(c.head.comment=null);c.mode=S;case S:if(512&c.flags){for(;16>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m!==(65535&c.check)){a.msg="header crc mismatch",c.mode=lb;break}m=0,n=0}c.head&&(c.head.hcrc=c.flags>>9&1,c.head.done=!0),a.adler=c.check=0,c.mode=V;break;case T:for(;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}a.adler=c.check=d(m),m=0,n=0,c.mode=U;case U:if(0===c.havedict)return a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,E;a.adler=c.check=1,c.mode=V;case V:if(b===A||b===B)break a;case W:if(c.last){m>>>=7&n,n-=7&n,c.mode=ib;break}for(;3>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}switch(c.last=1&m,m>>>=1,n-=1,3&m){case 0:c.mode=X;break;case 1:if(k(c),c.mode=bb,b===B){m>>>=2,n-=2;break a}break;case 2:c.mode=$;break;case 3:a.msg="invalid block type",c.mode=lb}m>>>=2,n-=2;break;case X:for(m>>>=7&n,n-=7&n;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if((65535&m)!==(m>>>16^65535)){a.msg="invalid stored block lengths",c.mode=lb;break}if(c.length=65535&m,m=0,n=0,c.mode=Y,b===B)break a;case Y:c.mode=Z;case Z:if(q=c.length){if(q>i&&(q=i),q>j&&(q=j),0===q)break a;r.arraySet(f,e,g,q,h),i-=q,g+=q,j-=q,h+=q,c.length-=q;break}c.mode=V;break;case $:for(;14>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(c.nlen=(31&m)+257,m>>>=5,n-=5,c.ndist=(31&m)+1,m>>>=5,n-=5,c.ncode=(15&m)+4,m>>>=4,n-=4,c.nlen>286||c.ndist>30){a.msg="too many length or distance symbols",c.mode=lb;break}c.have=0,c.mode=_;case _:for(;c.have<c.ncode;){for(;3>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.lens[Cb[c.have++]]=7&m,m>>>=3,n-=3}for(;c.have<19;)c.lens[Cb[c.have++]]=0;if(c.lencode=c.lendyn,c.lenbits=7,yb={bits:c.lenbits},xb=v(w,c.lens,0,19,c.lencode,0,c.work,yb),c.lenbits=yb.bits,xb){a.msg="invalid code lengths set",c.mode=lb;break}c.have=0,c.mode=ab;case ab:for(;c.have<c.nlen+c.ndist;){for(;Ab=c.lencode[m&(1<<c.lenbits)-1],qb=Ab>>>24,rb=Ab>>>16&255,sb=65535&Ab,!(n>=qb);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(16>sb)m>>>=qb,n-=qb,c.lens[c.have++]=sb;else{if(16===sb){for(zb=qb+2;zb>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m>>>=qb,n-=qb,0===c.have){a.msg="invalid bit length repeat",c.mode=lb;break}wb=c.lens[c.have-1],q=3+(3&m),m>>>=2,n-=2}else if(17===sb){for(zb=qb+3;zb>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=qb,n-=qb,wb=0,q=3+(7&m),m>>>=3,n-=3}else{for(zb=qb+7;zb>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=qb,n-=qb,wb=0,q=11+(127&m),m>>>=7,n-=7}if(c.have+q>c.nlen+c.ndist){a.msg="invalid bit length repeat",c.mode=lb;break}for(;q--;)c.lens[c.have++]=wb}}if(c.mode===lb)break;if(0===c.lens[256]){a.msg="invalid code -- missing end-of-block",c.mode=lb;break}if(c.lenbits=9,yb={bits:c.lenbits},xb=v(x,c.lens,0,c.nlen,c.lencode,0,c.work,yb),c.lenbits=yb.bits,xb){a.msg="invalid literal/lengths set",c.mode=lb;break}if(c.distbits=6,c.distcode=c.distdyn,yb={bits:c.distbits},xb=v(y,c.lens,c.nlen,c.ndist,c.distcode,0,c.work,yb),c.distbits=yb.bits,xb){a.msg="invalid distances set",c.mode=lb;break}if(c.mode=bb,b===B)break a;case bb:c.mode=cb;case cb:if(i>=6&&j>=258){a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,u(a,p),h=a.next_out,f=a.output,j=a.avail_out,g=a.next_in,e=a.input,i=a.avail_in,m=c.hold,n=c.bits,c.mode===V&&(c.back=-1);
  break}for(c.back=0;Ab=c.lencode[m&(1<<c.lenbits)-1],qb=Ab>>>24,rb=Ab>>>16&255,sb=65535&Ab,!(n>=qb);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(rb&&0===(240&rb)){for(tb=qb,ub=rb,vb=sb;Ab=c.lencode[vb+((m&(1<<tb+ub)-1)>>tb)],qb=Ab>>>24,rb=Ab>>>16&255,sb=65535&Ab,!(n>=tb+qb);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=tb,n-=tb,c.back+=tb}if(m>>>=qb,n-=qb,c.back+=qb,c.length=sb,0===rb){c.mode=hb;break}if(32&rb){c.back=-1,c.mode=V;break}if(64&rb){a.msg="invalid literal/length code",c.mode=lb;break}c.extra=15&rb,c.mode=db;case db:if(c.extra){for(zb=c.extra;zb>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.length+=m&(1<<c.extra)-1,m>>>=c.extra,n-=c.extra,c.back+=c.extra}c.was=c.length,c.mode=eb;case eb:for(;Ab=c.distcode[m&(1<<c.distbits)-1],qb=Ab>>>24,rb=Ab>>>16&255,sb=65535&Ab,!(n>=qb);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(0===(240&rb)){for(tb=qb,ub=rb,vb=sb;Ab=c.distcode[vb+((m&(1<<tb+ub)-1)>>tb)],qb=Ab>>>24,rb=Ab>>>16&255,sb=65535&Ab,!(n>=tb+qb);){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}m>>>=tb,n-=tb,c.back+=tb}if(m>>>=qb,n-=qb,c.back+=qb,64&rb){a.msg="invalid distance code",c.mode=lb;break}c.offset=sb,c.extra=15&rb,c.mode=fb;case fb:if(c.extra){for(zb=c.extra;zb>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}c.offset+=m&(1<<c.extra)-1,m>>>=c.extra,n-=c.extra,c.back+=c.extra}if(c.offset>c.dmax){a.msg="invalid distance too far back",c.mode=lb;break}c.mode=gb;case gb:if(0===j)break a;if(q=p-j,c.offset>q){if(q=c.offset-q,q>c.whave&&c.sane){a.msg="invalid distance too far back",c.mode=lb;break}q>c.wnext?(q-=c.wnext,ob=c.wsize-q):ob=c.wnext-q,q>c.length&&(q=c.length),pb=c.window}else pb=f,ob=h-c.offset,q=c.length;q>j&&(q=j),j-=q,c.length-=q;do f[h++]=pb[ob++];while(--q);0===c.length&&(c.mode=cb);break;case hb:if(0===j)break a;f[h++]=c.length,j--,c.mode=cb;break;case ib:if(c.wrap){for(;32>n;){if(0===i)break a;i--,m|=e[g++]<<n,n+=8}if(p-=j,a.total_out+=p,c.total+=p,p&&(a.adler=c.check=c.flags?t(c.check,f,p,h-p):s(c.check,f,p,h-p)),p=j,(c.flags?m:d(m))!==c.check){a.msg="incorrect data check",c.mode=lb;break}m=0,n=0}c.mode=jb;case jb:if(c.wrap&&c.flags){for(;32>n;){if(0===i)break a;i--,m+=e[g++]<<n,n+=8}if(m!==(4294967295&c.total)){a.msg="incorrect length check",c.mode=lb;break}m=0,n=0}c.mode=kb;case kb:xb=D;break a;case lb:xb=G;break a;case mb:return H;case nb:default:return F}return a.next_out=h,a.avail_out=j,a.next_in=g,a.avail_in=i,c.hold=m,c.bits=n,(c.wsize||p!==a.avail_out&&c.mode<lb&&(c.mode<ib||b!==z))&&l(a,a.output,a.next_out,p-a.avail_out)?(c.mode=mb,H):(o-=a.avail_in,p-=a.avail_out,a.total_in+=o,a.total_out+=p,c.total+=p,c.wrap&&p&&(a.adler=c.check=c.flags?t(c.check,f,p,a.next_out-p):s(c.check,f,p,a.next_out-p)),a.data_type=c.bits+(c.last?64:0)+(c.mode===V?128:0)+(c.mode===bb||c.mode===Y?256:0),(0===o&&0===p||b===z)&&xb===C&&(xb=I),xb)}function n(a){if(!a||!a.state)return F;var b=a.state;return b.window&&(b.window=null),a.state=null,C}function o(a,b){var c;return a&&a.state?(c=a.state,0===(2&c.wrap)?F:(c.head=b,b.done=!1,C)):F}var p,q,r=a("../utils/common"),s=a("./adler32"),t=a("./crc32"),u=a("./inffast"),v=a("./inftrees"),w=0,x=1,y=2,z=4,A=5,B=6,C=0,D=1,E=2,F=-2,G=-3,H=-4,I=-5,J=8,K=1,L=2,M=3,N=4,O=5,P=6,Q=7,R=8,S=9,T=10,U=11,V=12,W=13,X=14,Y=15,Z=16,$=17,_=18,ab=19,bb=20,cb=21,db=22,eb=23,fb=24,gb=25,hb=26,ib=27,jb=28,kb=29,lb=30,mb=31,nb=32,ob=852,pb=592,qb=15,rb=qb,sb=!0;c.inflateReset=g,c.inflateReset2=h,c.inflateResetKeep=f,c.inflateInit=j,c.inflateInit2=i,c.inflate=m,c.inflateEnd=n,c.inflateGetHeader=o,c.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":27,"./adler32":29,"./crc32":31,"./inffast":34,"./inftrees":36}],36:[function(a,b){"use strict";var c=a("../utils/common"),d=15,e=852,f=592,g=0,h=1,i=2,j=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],k=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],l=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],m=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];b.exports=function(a,b,n,o,p,q,r,s){var t,u,v,w,x,y,z,A,B,C=s.bits,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=null,O=0,P=new c.Buf16(d+1),Q=new c.Buf16(d+1),R=null,S=0;for(D=0;d>=D;D++)P[D]=0;for(E=0;o>E;E++)P[b[n+E]]++;for(H=C,G=d;G>=1&&0===P[G];G--);if(H>G&&(H=G),0===G)return p[q++]=20971520,p[q++]=20971520,s.bits=1,0;for(F=1;G>F&&0===P[F];F++);for(F>H&&(H=F),K=1,D=1;d>=D;D++)if(K<<=1,K-=P[D],0>K)return-1;if(K>0&&(a===g||1!==G))return-1;for(Q[1]=0,D=1;d>D;D++)Q[D+1]=Q[D]+P[D];for(E=0;o>E;E++)0!==b[n+E]&&(r[Q[b[n+E]]++]=E);if(a===g?(N=R=r,y=19):a===h?(N=j,O-=257,R=k,S-=257,y=256):(N=l,R=m,y=-1),M=0,E=0,D=F,x=q,I=H,J=0,v=-1,L=1<<H,w=L-1,a===h&&L>e||a===i&&L>f)return 1;for(var T=0;;){T++,z=D-J,r[E]<y?(A=0,B=r[E]):r[E]>y?(A=R[S+r[E]],B=N[O+r[E]]):(A=96,B=0),t=1<<D-J,u=1<<I,F=u;do u-=t,p[x+(M>>J)+u]=z<<24|A<<16|B|0;while(0!==u);for(t=1<<D-1;M&t;)t>>=1;if(0!==t?(M&=t-1,M+=t):M=0,E++,0===--P[D]){if(D===G)break;D=b[n+r[E]]}if(D>H&&(M&w)!==v){for(0===J&&(J=H),x+=F,I=D-J,K=1<<I;G>I+J&&(K-=P[I+J],!(0>=K));)I++,K<<=1;if(L+=1<<I,a===h&&L>e||a===i&&L>f)return 1;v=M&w,p[v]=H<<24|I<<16|x-q|0}}return 0!==M&&(p[x+M]=D-J<<24|64<<16|0),s.bits=H,0}},{"../utils/common":27}],37:[function(a,b){"use strict";b.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],38:[function(a,b,c){"use strict";function d(a){for(var b=a.length;--b>=0;)a[b]=0}function e(a){return 256>a?gb[a]:gb[256+(a>>>7)]}function f(a,b){a.pending_buf[a.pending++]=255&b,a.pending_buf[a.pending++]=b>>>8&255}function g(a,b,c){a.bi_valid>V-c?(a.bi_buf|=b<<a.bi_valid&65535,f(a,a.bi_buf),a.bi_buf=b>>V-a.bi_valid,a.bi_valid+=c-V):(a.bi_buf|=b<<a.bi_valid&65535,a.bi_valid+=c)}function h(a,b,c){g(a,c[2*b],c[2*b+1])}function i(a,b){var c=0;do c|=1&a,a>>>=1,c<<=1;while(--b>0);return c>>>1}function j(a){16===a.bi_valid?(f(a,a.bi_buf),a.bi_buf=0,a.bi_valid=0):a.bi_valid>=8&&(a.pending_buf[a.pending++]=255&a.bi_buf,a.bi_buf>>=8,a.bi_valid-=8)}function k(a,b){var c,d,e,f,g,h,i=b.dyn_tree,j=b.max_code,k=b.stat_desc.static_tree,l=b.stat_desc.has_stree,m=b.stat_desc.extra_bits,n=b.stat_desc.extra_base,o=b.stat_desc.max_length,p=0;for(f=0;U>=f;f++)a.bl_count[f]=0;for(i[2*a.heap[a.heap_max]+1]=0,c=a.heap_max+1;T>c;c++)d=a.heap[c],f=i[2*i[2*d+1]+1]+1,f>o&&(f=o,p++),i[2*d+1]=f,d>j||(a.bl_count[f]++,g=0,d>=n&&(g=m[d-n]),h=i[2*d],a.opt_len+=h*(f+g),l&&(a.static_len+=h*(k[2*d+1]+g)));if(0!==p){do{for(f=o-1;0===a.bl_count[f];)f--;a.bl_count[f]--,a.bl_count[f+1]+=2,a.bl_count[o]--,p-=2}while(p>0);for(f=o;0!==f;f--)for(d=a.bl_count[f];0!==d;)e=a.heap[--c],e>j||(i[2*e+1]!==f&&(a.opt_len+=(f-i[2*e+1])*i[2*e],i[2*e+1]=f),d--)}}function l(a,b,c){var d,e,f=new Array(U+1),g=0;for(d=1;U>=d;d++)f[d]=g=g+c[d-1]<<1;for(e=0;b>=e;e++){var h=a[2*e+1];0!==h&&(a[2*e]=i(f[h]++,h))}}function m(){var a,b,c,d,e,f=new Array(U+1);for(c=0,d=0;O-1>d;d++)for(ib[d]=c,a=0;a<1<<_[d];a++)hb[c++]=d;for(hb[c-1]=d,e=0,d=0;16>d;d++)for(jb[d]=e,a=0;a<1<<ab[d];a++)gb[e++]=d;for(e>>=7;R>d;d++)for(jb[d]=e<<7,a=0;a<1<<ab[d]-7;a++)gb[256+e++]=d;for(b=0;U>=b;b++)f[b]=0;for(a=0;143>=a;)eb[2*a+1]=8,a++,f[8]++;for(;255>=a;)eb[2*a+1]=9,a++,f[9]++;for(;279>=a;)eb[2*a+1]=7,a++,f[7]++;for(;287>=a;)eb[2*a+1]=8,a++,f[8]++;for(l(eb,Q+1,f),a=0;R>a;a++)fb[2*a+1]=5,fb[2*a]=i(a,5);kb=new nb(eb,_,P+1,Q,U),lb=new nb(fb,ab,0,R,U),mb=new nb(new Array(0),bb,0,S,W)}function n(a){var b;for(b=0;Q>b;b++)a.dyn_ltree[2*b]=0;for(b=0;R>b;b++)a.dyn_dtree[2*b]=0;for(b=0;S>b;b++)a.bl_tree[2*b]=0;a.dyn_ltree[2*X]=1,a.opt_len=a.static_len=0,a.last_lit=a.matches=0}function o(a){a.bi_valid>8?f(a,a.bi_buf):a.bi_valid>0&&(a.pending_buf[a.pending++]=a.bi_buf),a.bi_buf=0,a.bi_valid=0}function p(a,b,c,d){o(a),d&&(f(a,c),f(a,~c)),E.arraySet(a.pending_buf,a.window,b,c,a.pending),a.pending+=c}function q(a,b,c,d){var e=2*b,f=2*c;return a[e]<a[f]||a[e]===a[f]&&d[b]<=d[c]}function r(a,b,c){for(var d=a.heap[c],e=c<<1;e<=a.heap_len&&(e<a.heap_len&&q(b,a.heap[e+1],a.heap[e],a.depth)&&e++,!q(b,d,a.heap[e],a.depth));)a.heap[c]=a.heap[e],c=e,e<<=1;a.heap[c]=d}function s(a,b,c){var d,f,i,j,k=0;if(0!==a.last_lit)do d=a.pending_buf[a.d_buf+2*k]<<8|a.pending_buf[a.d_buf+2*k+1],f=a.pending_buf[a.l_buf+k],k++,0===d?h(a,f,b):(i=hb[f],h(a,i+P+1,b),j=_[i],0!==j&&(f-=ib[i],g(a,f,j)),d--,i=e(d),h(a,i,c),j=ab[i],0!==j&&(d-=jb[i],g(a,d,j)));while(k<a.last_lit);h(a,X,b)}function t(a,b){var c,d,e,f=b.dyn_tree,g=b.stat_desc.static_tree,h=b.stat_desc.has_stree,i=b.stat_desc.elems,j=-1;for(a.heap_len=0,a.heap_max=T,c=0;i>c;c++)0!==f[2*c]?(a.heap[++a.heap_len]=j=c,a.depth[c]=0):f[2*c+1]=0;for(;a.heap_len<2;)e=a.heap[++a.heap_len]=2>j?++j:0,f[2*e]=1,a.depth[e]=0,a.opt_len--,h&&(a.static_len-=g[2*e+1]);for(b.max_code=j,c=a.heap_len>>1;c>=1;c--)r(a,f,c);e=i;do c=a.heap[1],a.heap[1]=a.heap[a.heap_len--],r(a,f,1),d=a.heap[1],a.heap[--a.heap_max]=c,a.heap[--a.heap_max]=d,f[2*e]=f[2*c]+f[2*d],a.depth[e]=(a.depth[c]>=a.depth[d]?a.depth[c]:a.depth[d])+1,f[2*c+1]=f[2*d+1]=e,a.heap[1]=e++,r(a,f,1);while(a.heap_len>=2);a.heap[--a.heap_max]=a.heap[1],k(a,b),l(f,j,a.bl_count)}function u(a,b,c){var d,e,f=-1,g=b[1],h=0,i=7,j=4;for(0===g&&(i=138,j=3),b[2*(c+1)+1]=65535,d=0;c>=d;d++)e=g,g=b[2*(d+1)+1],++h<i&&e===g||(j>h?a.bl_tree[2*e]+=h:0!==e?(e!==f&&a.bl_tree[2*e]++,a.bl_tree[2*Y]++):10>=h?a.bl_tree[2*Z]++:a.bl_tree[2*$]++,h=0,f=e,0===g?(i=138,j=3):e===g?(i=6,j=3):(i=7,j=4))}function v(a,b,c){var d,e,f=-1,i=b[1],j=0,k=7,l=4;for(0===i&&(k=138,l=3),d=0;c>=d;d++)if(e=i,i=b[2*(d+1)+1],!(++j<k&&e===i)){if(l>j){do h(a,e,a.bl_tree);while(0!==--j)}else 0!==e?(e!==f&&(h(a,e,a.bl_tree),j--),h(a,Y,a.bl_tree),g(a,j-3,2)):10>=j?(h(a,Z,a.bl_tree),g(a,j-3,3)):(h(a,$,a.bl_tree),g(a,j-11,7));j=0,f=e,0===i?(k=138,l=3):e===i?(k=6,l=3):(k=7,l=4)}}function w(a){var b;for(u(a,a.dyn_ltree,a.l_desc.max_code),u(a,a.dyn_dtree,a.d_desc.max_code),t(a,a.bl_desc),b=S-1;b>=3&&0===a.bl_tree[2*cb[b]+1];b--);return a.opt_len+=3*(b+1)+5+5+4,b}function x(a,b,c,d){var e;for(g(a,b-257,5),g(a,c-1,5),g(a,d-4,4),e=0;d>e;e++)g(a,a.bl_tree[2*cb[e]+1],3);v(a,a.dyn_ltree,b-1),v(a,a.dyn_dtree,c-1)}function y(a){var b,c=4093624447;for(b=0;31>=b;b++,c>>>=1)if(1&c&&0!==a.dyn_ltree[2*b])return G;if(0!==a.dyn_ltree[18]||0!==a.dyn_ltree[20]||0!==a.dyn_ltree[26])return H;for(b=32;P>b;b++)if(0!==a.dyn_ltree[2*b])return H;return G}function z(a){pb||(m(),pb=!0),a.l_desc=new ob(a.dyn_ltree,kb),a.d_desc=new ob(a.dyn_dtree,lb),a.bl_desc=new ob(a.bl_tree,mb),a.bi_buf=0,a.bi_valid=0,n(a)}function A(a,b,c,d){g(a,(J<<1)+(d?1:0),3),p(a,b,c,!0)}function B(a){g(a,K<<1,3),h(a,X,eb),j(a)}function C(a,b,c,d){var e,f,h=0;a.level>0?(a.strm.data_type===I&&(a.strm.data_type=y(a)),t(a,a.l_desc),t(a,a.d_desc),h=w(a),e=a.opt_len+3+7>>>3,f=a.static_len+3+7>>>3,e>=f&&(e=f)):e=f=c+5,e>=c+4&&-1!==b?A(a,b,c,d):a.strategy===F||f===e?(g(a,(K<<1)+(d?1:0),3),s(a,eb,fb)):(g(a,(L<<1)+(d?1:0),3),x(a,a.l_desc.max_code+1,a.d_desc.max_code+1,h+1),s(a,a.dyn_ltree,a.dyn_dtree)),n(a),d&&o(a)}function D(a,b,c){return a.pending_buf[a.d_buf+2*a.last_lit]=b>>>8&255,a.pending_buf[a.d_buf+2*a.last_lit+1]=255&b,a.pending_buf[a.l_buf+a.last_lit]=255&c,a.last_lit++,0===b?a.dyn_ltree[2*c]++:(a.matches++,b--,a.dyn_ltree[2*(hb[c]+P+1)]++,a.dyn_dtree[2*e(b)]++),a.last_lit===a.lit_bufsize-1}var E=a("../utils/common"),F=4,G=0,H=1,I=2,J=0,K=1,L=2,M=3,N=258,O=29,P=256,Q=P+1+O,R=30,S=19,T=2*Q+1,U=15,V=16,W=7,X=256,Y=16,Z=17,$=18,_=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],ab=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],bb=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],cb=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],db=512,eb=new Array(2*(Q+2));d(eb);var fb=new Array(2*R);d(fb);var gb=new Array(db);d(gb);var hb=new Array(N-M+1);d(hb);var ib=new Array(O);d(ib);var jb=new Array(R);d(jb);var kb,lb,mb,nb=function(a,b,c,d,e){this.static_tree=a,this.extra_bits=b,this.extra_base=c,this.elems=d,this.max_length=e,this.has_stree=a&&a.length},ob=function(a,b){this.dyn_tree=a,this.max_code=0,this.stat_desc=b},pb=!1;c._tr_init=z,c._tr_stored_block=A,c._tr_flush_block=C,c._tr_tally=D,c._tr_align=B},{"../utils/common":27}],39:[function(a,b){"use strict";function c(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}b.exports=c},{}]},{},[9])(9)});
  
  /*!
   Buttons for DataTables 1.7.0
   ©2016-2021 SpryMedia Ltd - datatables.net/license
  */
  (function(f){"function"===typeof define&&define.amd?define(["jquery","datatables.net"],function(A){return f(A,window,document)}):"object"===typeof exports?module.exports=function(A,y){A||(A=window);y&&y.fn.dataTable||(y=require("datatables.net")(A,y).$);return f(y,A,A.document)}:f(jQuery,window,document)})(function(f,A,y,t){function E(a,b,c){f.fn.animate?a.stop().fadeIn(b,c):(a.css("display","block"),c&&c.call(a))}function F(a,b,c){f.fn.animate?a.stop().fadeOut(b,c):(a.css("display","none"),c&&c.call(a))}
  function H(a,b){a=new q.Api(a);b=b?b:a.init().buttons||q.defaults.buttons;return(new u(a,b)).container()}var q=f.fn.dataTable,M=0,N=0,z=q.ext.buttons,u=function(a,b){if(!(this instanceof u))return function(c){return(new u(c,a)).container()};"undefined"===typeof b&&(b={});!0===b&&(b={});Array.isArray(b)&&(b={buttons:b});this.c=f.extend(!0,{},u.defaults,b);b.buttons&&(this.c.buttons=b.buttons);this.s={dt:new q.Api(a),buttons:[],listenKeys:"",namespace:"dtb"+M++};this.dom={container:f("<"+this.c.dom.container.tag+
  "/>").addClass(this.c.dom.container.className)};this._constructor()};f.extend(u.prototype,{action:function(a,b){a=this._nodeToButton(a);if(b===t)return a.conf.action;a.conf.action=b;return this},active:function(a,b){var c=this._nodeToButton(a);a=this.c.dom.button.active;c=f(c.node);if(b===t)return c.hasClass(a);c.toggleClass(a,b===t?!0:b);return this},add:function(a,b){var c=this.s.buttons;if("string"===typeof b){b=b.split("-");var d=this.s;c=0;for(var e=b.length-1;c<e;c++)d=d.buttons[1*b[c]];c=d.buttons;
  b=1*b[b.length-1]}this._expandButton(c,a,d!==t,b);this._draw();return this},container:function(){return this.dom.container},disable:function(a){a=this._nodeToButton(a);f(a.node).addClass(this.c.dom.button.disabled).attr("disabled",!0);return this},destroy:function(){f("body").off("keyup."+this.s.namespace);var a=this.s.buttons.slice(),b;var c=0;for(b=a.length;c<b;c++)this.remove(a[c].node);this.dom.container.remove();a=this.s.dt.settings()[0];c=0;for(b=a.length;c<b;c++)if(a.inst===this){a.splice(c,
  1);break}return this},enable:function(a,b){if(!1===b)return this.disable(a);a=this._nodeToButton(a);f(a.node).removeClass(this.c.dom.button.disabled).removeAttr("disabled");return this},name:function(){return this.c.name},node:function(a){if(!a)return this.dom.container;a=this._nodeToButton(a);return f(a.node)},processing:function(a,b){var c=this.s.dt,d=this._nodeToButton(a);if(b===t)return f(d.node).hasClass("processing");f(d.node).toggleClass("processing",b);f(c.table().node()).triggerHandler("buttons-processing.dt",
  [b,c.button(a),c,f(a),d.conf]);return this},remove:function(a){var b=this._nodeToButton(a),c=this._nodeToHost(a),d=this.s.dt;if(b.buttons.length)for(var e=b.buttons.length-1;0<=e;e--)this.remove(b.buttons[e].node);b.conf.destroy&&b.conf.destroy.call(d.button(a),d,f(a),b.conf);this._removeKey(b.conf);f(b.node).remove();a=f.inArray(b,c);c.splice(a,1);return this},text:function(a,b){var c=this._nodeToButton(a);a=this.c.dom.collection.buttonLiner;a=c.inCollection&&a&&a.tag?a.tag:this.c.dom.buttonLiner.tag;
  var d=this.s.dt,e=f(c.node),h=function(m){return"function"===typeof m?m(d,e,c.conf):m};if(b===t)return h(c.conf.text);c.conf.text=b;a?e.children(a).html(h(b)):e.html(h(b));return this},_constructor:function(){var a=this,b=this.s.dt,c=b.settings()[0],d=this.c.buttons;c._buttons||(c._buttons=[]);c._buttons.push({inst:this,name:this.c.name});for(var e=0,h=d.length;e<h;e++)this.add(d[e]);b.on("destroy",function(m,g){g===c&&a.destroy()});f("body").on("keyup."+this.s.namespace,function(m){if(!y.activeElement||
  y.activeElement===y.body){var g=String.fromCharCode(m.keyCode).toLowerCase();-1!==a.s.listenKeys.toLowerCase().indexOf(g)&&a._keypress(g,m)}})},_addKey:function(a){a.key&&(this.s.listenKeys+=f.isPlainObject(a.key)?a.key.key:a.key)},_draw:function(a,b){a||(a=this.dom.container,b=this.s.buttons);a.children().detach();for(var c=0,d=b.length;c<d;c++)a.append(b[c].inserter),a.append(" "),b[c].buttons&&b[c].buttons.length&&this._draw(b[c].collection,b[c].buttons)},_expandButton:function(a,b,c,d){var e=
  this.s.dt,h=0;b=Array.isArray(b)?b:[b];for(var m=0,g=b.length;m<g;m++){var l=this._resolveExtends(b[m]);if(l)if(Array.isArray(l))this._expandButton(a,l,c,d);else{var k=this._buildButton(l,c);k&&(d!==t&&null!==d?(a.splice(d,0,k),d++):a.push(k),k.conf.buttons&&(k.collection=f("<"+this.c.dom.collection.tag+"/>"),k.conf._collection=k.collection,this._expandButton(k.buttons,k.conf.buttons,!0,d)),l.init&&l.init.call(e.button(k.node),e,f(k.node),l),h++)}}},_buildButton:function(a,b){var c=this.c.dom.button,
  d=this.c.dom.buttonLiner,e=this.c.dom.collection,h=this.s.dt,m=function(n){return"function"===typeof n?n(h,k,a):n};b&&e.button&&(c=e.button);b&&e.buttonLiner&&(d=e.buttonLiner);if(a.available&&!a.available(h,a))return!1;var g=function(n,p,r,v){v.action.call(p.button(r),n,p,r,v);f(p.table().node()).triggerHandler("buttons-action.dt",[p.button(r),p,r,v])};e=a.tag||c.tag;var l=a.clickBlurs===t?!0:a.clickBlurs,k=f("<"+e+"/>").addClass(c.className).attr("tabindex",this.s.dt.settings()[0].iTabIndex).attr("aria-controls",
  this.s.dt.table().node().id).on("click.dtb",function(n){n.preventDefault();!k.hasClass(c.disabled)&&a.action&&g(n,h,k,a);l&&k.trigger("blur")}).on("keyup.dtb",function(n){13===n.keyCode&&!k.hasClass(c.disabled)&&a.action&&g(n,h,k,a)});"a"===e.toLowerCase()&&k.attr("href","#");"button"===e.toLowerCase()&&k.attr("type","button");d.tag?(e=f("<"+d.tag+"/>").html(m(a.text)).addClass(d.className),"a"===d.tag.toLowerCase()&&e.attr("href","#"),k.append(e)):k.html(m(a.text));!1===a.enabled&&k.addClass(c.disabled);
  a.className&&k.addClass(a.className);a.titleAttr&&k.attr("title",m(a.titleAttr));a.attr&&k.attr(a.attr);a.namespace||(a.namespace=".dt-button-"+N++);d=(d=this.c.dom.buttonContainer)&&d.tag?f("<"+d.tag+"/>").addClass(d.className).append(k):k;this._addKey(a);this.c.buttonCreated&&(d=this.c.buttonCreated(a,d));return{conf:a,node:k.get(0),inserter:d,buttons:[],inCollection:b,collection:null}},_nodeToButton:function(a,b){b||(b=this.s.buttons);for(var c=0,d=b.length;c<d;c++){if(b[c].node===a)return b[c];
  if(b[c].buttons.length){var e=this._nodeToButton(a,b[c].buttons);if(e)return e}}},_nodeToHost:function(a,b){b||(b=this.s.buttons);for(var c=0,d=b.length;c<d;c++){if(b[c].node===a)return b;if(b[c].buttons.length){var e=this._nodeToHost(a,b[c].buttons);if(e)return e}}},_keypress:function(a,b){if(!b._buttonsHandled){var c=function(d){for(var e=0,h=d.length;e<h;e++){var m=d[e].conf,g=d[e].node;m.key&&(m.key===a?(b._buttonsHandled=!0,f(g).click()):!f.isPlainObject(m.key)||m.key.key!==a||m.key.shiftKey&&
  !b.shiftKey||m.key.altKey&&!b.altKey||m.key.ctrlKey&&!b.ctrlKey||m.key.metaKey&&!b.metaKey||(b._buttonsHandled=!0,f(g).click()));d[e].buttons.length&&c(d[e].buttons)}};c(this.s.buttons)}},_removeKey:function(a){if(a.key){var b=f.isPlainObject(a.key)?a.key.key:a.key;a=this.s.listenKeys.split("");b=f.inArray(b,a);a.splice(b,1);this.s.listenKeys=a.join("")}},_resolveExtends:function(a){var b=this.s.dt,c,d=function(g){for(var l=0;!f.isPlainObject(g)&&!Array.isArray(g);){if(g===t)return;if("function"===
  typeof g){if(g=g(b,a),!g)return!1}else if("string"===typeof g){if(!z[g])throw"Unknown button type: "+g;g=z[g]}l++;if(30<l)throw"Buttons: Too many iterations";}return Array.isArray(g)?g:f.extend({},g)};for(a=d(a);a&&a.extend;){if(!z[a.extend])throw"Cannot extend unknown button type: "+a.extend;var e=d(z[a.extend]);if(Array.isArray(e))return e;if(!e)return!1;var h=e.className;a=f.extend({},e,a);h&&a.className!==h&&(a.className=h+" "+a.className);var m=a.postfixButtons;if(m){a.buttons||(a.buttons=[]);
  h=0;for(c=m.length;h<c;h++)a.buttons.push(m[h]);a.postfixButtons=null}if(m=a.prefixButtons){a.buttons||(a.buttons=[]);h=0;for(c=m.length;h<c;h++)a.buttons.splice(h,0,m[h]);a.prefixButtons=null}a.extend=e.extend}return a},_popover:function(a,b,c){var d=this.c,e=f.extend({align:"button-left",autoClose:!1,background:!0,backgroundClassName:"dt-button-background",contentClassName:d.dom.collection.className,collectionLayout:"",collectionTitle:"",dropup:!1,fade:400,rightAlignClassName:"dt-button-right",
  tag:d.dom.collection.tag},c),h=b.node(),m=function(){F(f(".dt-button-collection"),e.fade,function(){f(this).detach()});f(b.buttons('[aria-haspopup="true"][aria-expanded="true"]').nodes()).attr("aria-expanded","false");f("div.dt-button-background").off("click.dtb-collection");u.background(!1,e.backgroundClassName,e.fade,h);f("body").off(".dtb-collection");b.off("buttons-action.b-internal")};!1===a&&m();c=f(b.buttons('[aria-haspopup="true"][aria-expanded="true"]').nodes());c.length&&(h=c.eq(0),m());
  c=f("<div/>").addClass("dt-button-collection").addClass(e.collectionLayout).css("display","none");a=f(a).addClass(e.contentClassName).attr("role","menu").appendTo(c);h.attr("aria-expanded","true");h.parents("body")[0]!==y.body&&(h=y.body.lastChild);e.collectionTitle&&c.prepend('<div class="dt-button-collection-title">'+e.collectionTitle+"</div>");E(c.insertAfter(h),e.fade);d=f(b.table().container());var g=c.css("position");"dt-container"===e.align&&(h=h.parent(),c.css("width",d.width()));if("absolute"===
  g&&(c.hasClass(e.rightAlignClassName)||c.hasClass(e.leftAlignClassName)||"dt-container"===e.align)){var l=h.position();c.css({top:l.top+h.outerHeight(),left:l.left});var k=c.outerHeight(),n=d.offset().top+d.height(),p=l.top+h.outerHeight()+k;n=p-n;p=l.top-k;var r=d.offset().top,v=l.top-k-5;(n>r-p||e.dropup)&&-v<r&&c.css("top",v);l=d.offset().left;d=d.width();d=l+d;g=c.offset().left;var x=c.width();x=g+x;var w=h.offset().left,B=h.outerWidth();B=w+B;w=0;c.hasClass(e.rightAlignClassName)?(w=B-x,l>g+
  w&&(g=l-(g+w),d-=x+w,w=g>d?w+d:w+g)):(w=l-g,d<x+w&&(g=l-(g+w),d-=x+w,w=g>d?w+d:w+g));c.css("left",c.position().left+w)}else"absolute"===g?(l=h.position(),c.css({top:l.top+h.outerHeight(),left:l.left}),k=c.outerHeight(),g=h.offset().top,w=0,w=h.offset().left,B=h.outerWidth(),B=w+B,g=c.offset().left,x=a.width(),x=g+x,v=l.top-k-5,n=d.offset().top+d.height(),p=l.top+h.outerHeight()+k,n=p-n,p=l.top-k,r=d.offset().top,(n>r-p||e.dropup)&&-v<r&&c.css("top",v),w="button-right"===e.align?B-x:w-g,c.css("left",
  c.position().left+w)):(g=c.height()/2,g>f(A).height()/2&&(g=f(A).height()/2),c.css("marginTop",-1*g));e.background&&u.background(!0,e.backgroundClassName,e.fade,h);f("div.dt-button-background").on("click.dtb-collection",function(){});f("body").on("click.dtb-collection",function(C){var I=f.fn.addBack?"addBack":"andSelf",J=f(C.target).parent()[0];(!f(C.target).parents()[I]().filter(a).length&&!f(J).hasClass("dt-buttons")||f(C.target).hasClass("dt-button-background"))&&m()}).on("keyup.dtb-collection",
  function(C){27===C.keyCode&&m()});e.autoClose&&setTimeout(function(){b.on("buttons-action.b-internal",function(C,I,J,O){O[0]!==h[0]&&m()})},0);f(c).trigger("buttons-popover.dt")}});u.background=function(a,b,c,d){c===t&&(c=400);d||(d=y.body);a?E(f("<div/>").addClass(b).css("display","none").insertAfter(d),c):F(f("div."+b),c,function(){f(this).removeClass(b).remove()})};u.instanceSelector=function(a,b){if(a===t||null===a)return f.map(b,function(h){return h.inst});var c=[],d=f.map(b,function(h){return h.name}),
  e=function(h){if(Array.isArray(h))for(var m=0,g=h.length;m<g;m++)e(h[m]);else"string"===typeof h?-1!==h.indexOf(",")?e(h.split(",")):(h=f.inArray(h.trim(),d),-1!==h&&c.push(b[h].inst)):"number"===typeof h&&c.push(b[h].inst)};e(a);return c};u.buttonSelector=function(a,b){for(var c=[],d=function(g,l,k){for(var n,p,r=0,v=l.length;r<v;r++)if(n=l[r])p=k!==t?k+r:r+"",g.push({node:n.node,name:n.conf.name,idx:p}),n.buttons&&d(g,n.buttons,p+"-")},e=function(g,l){var k,n=[];d(n,l.s.buttons);var p=f.map(n,function(r){return r.node});
  if(Array.isArray(g)||g instanceof f)for(p=0,k=g.length;p<k;p++)e(g[p],l);else if(null===g||g===t||"*"===g)for(p=0,k=n.length;p<k;p++)c.push({inst:l,node:n[p].node});else if("number"===typeof g)c.push({inst:l,node:l.s.buttons[g].node});else if("string"===typeof g)if(-1!==g.indexOf(","))for(n=g.split(","),p=0,k=n.length;p<k;p++)e(n[p].trim(),l);else if(g.match(/^\d+(\-\d+)*$/))p=f.map(n,function(r){return r.idx}),c.push({inst:l,node:n[f.inArray(g,p)].node});else if(-1!==g.indexOf(":name"))for(g=g.replace(":name",
  ""),p=0,k=n.length;p<k;p++)n[p].name===g&&c.push({inst:l,node:n[p].node});else f(p).filter(g).each(function(){c.push({inst:l,node:this})});else"object"===typeof g&&g.nodeName&&(n=f.inArray(g,p),-1!==n&&c.push({inst:l,node:p[n]}))},h=0,m=a.length;h<m;h++)e(b,a[h]);return c};u.stripData=function(a,b){if("string"!==typeof a)return a;a=a.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"");a=a.replace(/<!\-\-.*?\-\->/g,"");b.stripHtml&&(a=a.replace(/<[^>]*>/g,""));b.trim&&(a=a.replace(/^\s+|\s+$/g,
  ""));b.stripNewlines&&(a=a.replace(/\n/g," "));b.decodeEntities&&(K.innerHTML=a,a=K.value);return a};u.defaults={buttons:["copy","excel","csv","pdf","print"],name:"main",tabIndex:0,dom:{container:{tag:"div",className:"dt-buttons"},collection:{tag:"div",className:""},button:{tag:"button",className:"dt-button",active:"active",disabled:"disabled"},buttonLiner:{tag:"span",className:""}}};u.version="1.7.0";f.extend(z,{collection:{text:function(a){return a.i18n("buttons.collection","Collection")},className:"buttons-collection",
  init:function(a,b,c){b.attr("aria-expanded",!1)},action:function(a,b,c,d){a.stopPropagation();d._collection.parents("body").length?this.popover(!1,d):this.popover(d._collection,d)},attr:{"aria-haspopup":!0}},copy:function(a,b){if(z.copyHtml5)return"copyHtml5"},csv:function(a,b){if(z.csvHtml5&&z.csvHtml5.available(a,b))return"csvHtml5"},excel:function(a,b){if(z.excelHtml5&&z.excelHtml5.available(a,b))return"excelHtml5"},pdf:function(a,b){if(z.pdfHtml5&&z.pdfHtml5.available(a,b))return"pdfHtml5"},pageLength:function(a){a=
  a.settings()[0].aLengthMenu;var b=[],c=[];if(Array.isArray(a[0]))b=a[0],c=a[1];else for(var d=0;d<a.length;d++){var e=a[d];f.isPlainObject(e)?(b.push(e.value),c.push(e.label)):(b.push(e),c.push(e))}return{extend:"collection",text:function(h){return h.i18n("buttons.pageLength",{"-1":"Show all rows",_:"Show %d rows"},h.page.len())},className:"buttons-page-length",autoClose:!0,buttons:f.map(b,function(h,m){return{text:c[m],className:"button-page-length",action:function(g,l){l.page.len(h).draw()},init:function(g,
  l,k){var n=this;l=function(){n.active(g.page.len()===h)};g.on("length.dt"+k.namespace,l);l()},destroy:function(g,l,k){g.off("length.dt"+k.namespace)}}}),init:function(h,m,g){var l=this;h.on("length.dt"+g.namespace,function(){l.text(g.text)})},destroy:function(h,m,g){h.off("length.dt"+g.namespace)}}}});q.Api.register("buttons()",function(a,b){b===t&&(b=a,a=t);this.selector.buttonGroup=a;var c=this.iterator(!0,"table",function(d){if(d._buttons)return u.buttonSelector(u.instanceSelector(a,d._buttons),
  b)},!0);c._groupSelector=a;return c});q.Api.register("button()",function(a,b){a=this.buttons(a,b);1<a.length&&a.splice(1,a.length);return a});q.Api.registerPlural("buttons().active()","button().active()",function(a){return a===t?this.map(function(b){return b.inst.active(b.node)}):this.each(function(b){b.inst.active(b.node,a)})});q.Api.registerPlural("buttons().action()","button().action()",function(a){return a===t?this.map(function(b){return b.inst.action(b.node)}):this.each(function(b){b.inst.action(b.node,
  a)})});q.Api.register(["buttons().enable()","button().enable()"],function(a){return this.each(function(b){b.inst.enable(b.node,a)})});q.Api.register(["buttons().disable()","button().disable()"],function(){return this.each(function(a){a.inst.disable(a.node)})});q.Api.registerPlural("buttons().nodes()","button().node()",function(){var a=f();f(this.each(function(b){a=a.add(b.inst.node(b.node))}));return a});q.Api.registerPlural("buttons().processing()","button().processing()",function(a){return a===
  t?this.map(function(b){return b.inst.processing(b.node)}):this.each(function(b){b.inst.processing(b.node,a)})});q.Api.registerPlural("buttons().text()","button().text()",function(a){return a===t?this.map(function(b){return b.inst.text(b.node)}):this.each(function(b){b.inst.text(b.node,a)})});q.Api.registerPlural("buttons().trigger()","button().trigger()",function(){return this.each(function(a){a.inst.node(a.node).trigger("click")})});q.Api.register("button().popover()",function(a,b){return this.map(function(c){return c.inst._popover(a,
  this.button(this[0].node),b)})});q.Api.register("buttons().containers()",function(){var a=f(),b=this._groupSelector;this.iterator(!0,"table",function(c){if(c._buttons){c=u.instanceSelector(b,c._buttons);for(var d=0,e=c.length;d<e;d++)a=a.add(c[d].container())}});return a});q.Api.register("buttons().container()",function(){return this.containers().eq(0)});q.Api.register("button().add()",function(a,b){var c=this.context;c.length&&(c=u.instanceSelector(this._groupSelector,c[0]._buttons),c.length&&c[0].add(b,
  a));return this.button(this._groupSelector,a)});q.Api.register("buttons().destroy()",function(){this.pluck("inst").unique().each(function(a){a.destroy()});return this});q.Api.registerPlural("buttons().remove()","buttons().remove()",function(){this.each(function(a){a.inst.remove(a.node)});return this});var D;q.Api.register("buttons.info()",function(a,b,c){var d=this;if(!1===a)return this.off("destroy.btn-info"),F(f("#datatables_buttons_info"),400,function(){f(this).remove()}),clearTimeout(D),D=null,
  this;D&&clearTimeout(D);f("#datatables_buttons_info").length&&f("#datatables_buttons_info").remove();a=a?"<h2>"+a+"</h2>":"";E(f('<div id="datatables_buttons_info" class="dt-button-info"/>').html(a).append(f("<div/>")["string"===typeof b?"html":"append"](b)).css("display","none").appendTo("body"));c!==t&&0!==c&&(D=setTimeout(function(){d.buttons.info(!1)},c));this.on("destroy.btn-info",function(){d.buttons.info(!1)});return this});q.Api.register("buttons.exportData()",function(a){if(this.context.length)return P(new q.Api(this.context[0]),
  a)});q.Api.register("buttons.exportInfo()",function(a){a||(a={});var b=a;var c="*"===b.filename&&"*"!==b.title&&b.title!==t&&null!==b.title&&""!==b.title?b.title:b.filename;"function"===typeof c&&(c=c());c===t||null===c?c=null:(-1!==c.indexOf("*")&&(c=c.replace("*",f("head > title").text()).trim()),c=c.replace(/[^a-zA-Z0-9_\u00A1-\uFFFF\.,\-_ !\(\)]/g,""),(b=G(b.extension))||(b=""),c+=b);b=G(a.title);b=null===b?null:-1!==b.indexOf("*")?b.replace("*",f("head > title").text()||"Exported data"):b;return{filename:c,
  title:b,messageTop:L(this,a.message||a.messageTop,"top"),messageBottom:L(this,a.messageBottom,"bottom")}});var G=function(a){return null===a||a===t?null:"function"===typeof a?a():a},L=function(a,b,c){b=G(b);if(null===b)return null;a=f("caption",a.table().container()).eq(0);return"*"===b?a.css("caption-side")!==c?null:a.length?a.text():"":b},K=f("<textarea/>")[0],P=function(a,b){var c=f.extend(!0,{},{rows:null,columns:"",modifier:{search:"applied",order:"applied"},orthogonal:"display",stripHtml:!0,
  stripNewlines:!0,decodeEntities:!0,trim:!0,format:{header:function(v){return u.stripData(v,c)},footer:function(v){return u.stripData(v,c)},body:function(v){return u.stripData(v,c)}},customizeData:null},b);b=a.columns(c.columns).indexes().map(function(v){var x=a.column(v).header();return c.format.header(x.innerHTML,v,x)}).toArray();var d=a.table().footer()?a.columns(c.columns).indexes().map(function(v){var x=a.column(v).footer();return c.format.footer(x?x.innerHTML:"",v,x)}).toArray():null,e=f.extend({},
  c.modifier);a.select&&"function"===typeof a.select.info&&e.selected===t&&a.rows(c.rows,f.extend({selected:!0},e)).any()&&f.extend(e,{selected:!0});e=a.rows(c.rows,e).indexes().toArray();var h=a.cells(e,c.columns);e=h.render(c.orthogonal).toArray();h=h.nodes().toArray();for(var m=b.length,g=[],l=0,k=0,n=0<m?e.length/m:0;k<n;k++){for(var p=[m],r=0;r<m;r++)p[r]=c.format.body(e[l],k,r,h[l]),l++;g[k]=p}b={header:b,footer:d,body:g};c.customizeData&&c.customizeData(b);return b};f.fn.dataTable.Buttons=u;
  f.fn.DataTable.Buttons=u;f(y).on("init.dt plugin-init.dt",function(a,b){"dt"===a.namespace&&(a=b.oInit.buttons||q.defaults.buttons)&&!b._buttons&&(new u(b,a)).container()});q.ext.feature.push({fnInit:H,cFeature:"B"});q.ext.features&&q.ext.features.register("buttons",H);return u});
  
  
  /*!
   DataTables styling wrapper for Buttons
   ©2018 SpryMedia Ltd - datatables.net/license
  */
  (function(c){"function"===typeof define&&define.amd?define(["jquery","datatables.net-dt","datatables.net-buttons"],function(a){return c(a,window,document)}):"object"===typeof exports?module.exports=function(a,b){a||(a=window);b&&b.fn.dataTable||(b=require("datatables.net-dt")(a,b).$);b.fn.dataTable.Buttons||require("datatables.net-buttons")(a,b);return c(b,a,a.document)}:c(jQuery,window,document)})(function(c,a,b,d){return c.fn.dataTable});
  
  
  /*!
   HTML5 export buttons for Buttons and DataTables.
   2016 SpryMedia Ltd - datatables.net/license
  
   FileSaver.js (1.3.3) - MIT license
   Copyright © 2016 Eli Grey - http://eligrey.com
  */
  (function(n){"function"===typeof define&&define.amd?define(["jquery","datatables.net","datatables.net-buttons"],function(u){return n(u,window,document)}):"object"===typeof exports?module.exports=function(u,x,E,F){u||(u=window);x&&x.fn.dataTable||(x=require("datatables.net")(u,x).$);x.fn.dataTable.Buttons||require("datatables.net-buttons")(u,x);return n(x,u,u.document,E,F)}:n(jQuery,window,document)})(function(n,u,x,E,F,B){function I(a){for(var c="";0<=a;)c=String.fromCharCode(a%26+65)+c,a=Math.floor(a/
  26)-1;return c}function O(a,c){J===B&&(J=-1===M.serializeToString((new u.DOMParser).parseFromString(P["xl/worksheets/sheet1.xml"],"text/xml")).indexOf("xmlns:r"));n.each(c,function(d,b){if(n.isPlainObject(b))d=a.folder(d),O(d,b);else{if(J){var m=b.childNodes[0],e,f=[];for(e=m.attributes.length-1;0<=e;e--){var g=m.attributes[e].nodeName;var p=m.attributes[e].nodeValue;-1!==g.indexOf(":")&&(f.push({name:g,value:p}),m.removeAttribute(g))}e=0;for(g=f.length;e<g;e++)p=b.createAttribute(f[e].name.replace(":",
  "_dt_b_namespace_token_")),p.value=f[e].value,m.setAttributeNode(p)}b=M.serializeToString(b);J&&(-1===b.indexOf("<?xml")&&(b='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+b),b=b.replace(/_dt_b_namespace_token_/g,":"),b=b.replace(/xmlns:NS[\d]+="" NS[\d]+:/g,""));b=b.replace(/<([^<>]*?) xmlns=""([^<>]*?)>/g,"<$1 $2>");a.file(d,b)}})}function y(a,c,d){var b=a.createElement(c);d&&(d.attr&&n(b).attr(d.attr),d.children&&n.each(d.children,function(m,e){b.appendChild(e)}),null!==d.text&&d.text!==
  B&&b.appendChild(a.createTextNode(d.text)));return b}function V(a,c){var d=a.header[c].length;a.footer&&a.footer[c].length>d&&(d=a.footer[c].length);for(var b=0,m=a.body.length;b<m;b++){var e=a.body[b][c];e=null!==e&&e!==B?e.toString():"";-1!==e.indexOf("\n")?(e=e.split("\n"),e.sort(function(f,g){return g.length-f.length}),e=e[0].length):e=e.length;e>d&&(d=e);if(40<d)return 54}d*=1.35;return 6<d?d:6}var D=n.fn.dataTable;D.Buttons.pdfMake=function(a){if(!a)return F||u.pdfMake;F=a};D.Buttons.jszip=
  function(a){if(!a)return E||u.JSZip;E=a};var K=function(a){if(!("undefined"===typeof a||"undefined"!==typeof navigator&&/MSIE [1-9]\./.test(navigator.userAgent))){var c=a.document.createElementNS("http://www.w3.org/1999/xhtml","a"),d="download"in c,b=/constructor/i.test(a.HTMLElement)||a.safari,m=/CriOS\/[\d]+/.test(navigator.userAgent),e=function(h){(a.setImmediate||a.setTimeout)(function(){throw h;},0)},f=function(h){setTimeout(function(){"string"===typeof h?(a.URL||a.webkitURL||a).revokeObjectURL(h):
  h.remove()},4E4)},g=function(h){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(h.type)?new Blob([String.fromCharCode(65279),h],{type:h.type}):h},p=function(h,q,v){v||(h=g(h));var r=this,w="application/octet-stream"===h.type,C=function(){var l=["writestart","progress","write","writeend"];l=[].concat(l);for(var z=l.length;z--;){var G=r["on"+l[z]];if("function"===typeof G)try{G.call(r,r)}catch(A){e(A)}}};r.readyState=r.INIT;if(d){var k=(a.URL||a.webkitURL||a).createObjectURL(h);
  setTimeout(function(){c.href=k;c.download=q;var l=new MouseEvent("click");c.dispatchEvent(l);C();f(k);r.readyState=r.DONE})}else(function(){if((m||w&&b)&&a.FileReader){var l=new FileReader;l.onloadend=function(){var z=m?l.result:l.result.replace(/^data:[^;]*;/,"data:attachment/file;");a.open(z,"_blank")||(a.location.href=z);r.readyState=r.DONE;C()};l.readAsDataURL(h);r.readyState=r.INIT}else k||(k=(a.URL||a.webkitURL||a).createObjectURL(h)),w?a.location.href=k:a.open(k,"_blank")||(a.location.href=
  k),r.readyState=r.DONE,C(),f(k)})()},t=p.prototype;if("undefined"!==typeof navigator&&navigator.msSaveOrOpenBlob)return function(h,q,v){q=q||h.name||"download";v||(h=g(h));return navigator.msSaveOrOpenBlob(h,q)};t.abort=function(){};t.readyState=t.INIT=0;t.WRITING=1;t.DONE=2;t.error=t.onwritestart=t.onprogress=t.onwrite=t.onabort=t.onerror=t.onwriteend=null;return function(h,q,v){return new p(h,q||h.name||"download",v)}}}("undefined"!==typeof self&&self||"undefined"!==typeof u&&u||this.content);D.fileSave=
  K;var Q=function(a){var c="Sheet1";a.sheetName&&(c=a.sheetName.replace(/[\[\]\*\/\\\?:]/g,""));return c},R=function(a){return a.newline?a.newline:navigator.userAgent.match(/Windows/)?"\r\n":"\n"},S=function(a,c){var d=R(c);a=a.buttons.exportData(c.exportOptions);var b=c.fieldBoundary,m=c.fieldSeparator,e=new RegExp(b,"g"),f=c.escapeChar!==B?c.escapeChar:"\\",g=function(v){for(var r="",w=0,C=v.length;w<C;w++)0<w&&(r+=m),r+=b?b+(""+v[w]).replace(e,f+b)+b:v[w];return r},p=c.header?g(a.header)+d:"";c=
  c.footer&&a.footer?d+g(a.footer):"";for(var t=[],h=0,q=a.body.length;h<q;h++)t.push(g(a.body[h]));return{str:p+t.join(d)+c,rows:t.length}},T=function(){if(-1===navigator.userAgent.indexOf("Safari")||-1!==navigator.userAgent.indexOf("Chrome")||-1!==navigator.userAgent.indexOf("Opera"))return!1;var a=navigator.userAgent.match(/AppleWebKit\/(\d+\.\d+)/);return a&&1<a.length&&603.1>1*a[1]?!0:!1};try{var M=new XMLSerializer,J}catch(a){}var P={"_rels/.rels":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  "xl/_rels/workbook.xml.rels":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',"[Content_Types].xml":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml" /><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" /><Default Extension="jpeg" ContentType="image/jpeg" /><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" /><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" /><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" /></Types>',
  "xl/workbook.xml":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="24816"/><workbookPr showInkAnnotation="0" autoCompressPictures="0"/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="19020" tabRatio="500"/></bookViews><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets><definedNames/></workbook>',
  "xl/worksheets/sheet1.xml":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><sheetData/><mergeCells count="0"/></worksheet>',"xl/styles.xml":'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><numFmts count="6"><numFmt numFmtId="164" formatCode="#,##0.00_- [$$-45C]"/><numFmt numFmtId="165" formatCode="&quot;£&quot;#,##0.00"/><numFmt numFmtId="166" formatCode="[$€-2] #,##0.00"/><numFmt numFmtId="167" formatCode="0.0%"/><numFmt numFmtId="168" formatCode="#,##0;(#,##0)"/><numFmt numFmtId="169" formatCode="#,##0.00;(#,##0.00)"/></numFmts><fonts count="5" x14ac:knownFonts="1"><font><sz val="11" /><name val="Calibri" /></font><font><sz val="11" /><name val="Calibri" /><color rgb="FFFFFFFF" /></font><font><sz val="11" /><name val="Calibri" /><b /></font><font><sz val="11" /><name val="Calibri" /><i /></font><font><sz val="11" /><name val="Calibri" /><u /></font></fonts><fills count="6"><fill><patternFill patternType="none" /></fill><fill><patternFill patternType="none" /></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9" /><bgColor indexed="64" /></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD99795" /><bgColor indexed="64" /></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="ffc6efce" /><bgColor indexed="64" /></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="ffc6cfef" /><bgColor indexed="64" /></patternFill></fill></fills><borders count="2"><border><left /><right /><top /><bottom /><diagonal /></border><border diagonalUp="false" diagonalDown="false"><left style="thin"><color auto="1" /></left><right style="thin"><color auto="1" /></right><top style="thin"><color auto="1" /></top><bottom style="thin"><color auto="1" /></bottom><diagonal /></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" /></cellStyleXfs><cellXfs count="68"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="left"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="fill"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment textRotation="90"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="9"   fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="167" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="168" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="169" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="1" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0" /></cellStyles><dxfs count="0" /><tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4" /></styleSheet>'},
  U=[{match:/^\-?\d+\.\d%$/,style:60,fmt:function(a){return a/100}},{match:/^\-?\d+\.?\d*%$/,style:56,fmt:function(a){return a/100}},{match:/^\-?\$[\d,]+.?\d*$/,style:57},{match:/^\-?£[\d,]+.?\d*$/,style:58},{match:/^\-?€[\d,]+.?\d*$/,style:59},{match:/^\-?\d+$/,style:65},{match:/^\-?\d+\.\d{2}$/,style:66},{match:/^\([\d,]+\)$/,style:61,fmt:function(a){return-1*a.replace(/[\(\)]/g,"")}},{match:/^\([\d,]+\.\d{2}\)$/,style:62,fmt:function(a){return-1*a.replace(/[\(\)]/g,"")}},{match:/^\-?[\d,]+$/,style:63},
  {match:/^\-?[\d,]+\.\d{2}$/,style:64},{match:/^[\d]{4}\-[\d]{2}\-[\d]{2}$/,style:67,fmt:function(a){return Math.round(25569+Date.parse(a)/864E5)}}];D.ext.buttons.copyHtml5={className:"buttons-copy buttons-html5",text:function(a){return a.i18n("buttons.copy","Copy")},action:function(a,c,d,b){this.processing(!0);var m=this;a=S(c,b);var e=c.buttons.exportInfo(b),f=R(b),g=a.str;d=n("<div/>").css({height:1,width:1,overflow:"hidden",position:"fixed",top:0,left:0});e.title&&(g=e.title+f+f+g);e.messageTop&&
  (g=e.messageTop+f+f+g);e.messageBottom&&(g=g+f+f+e.messageBottom);b.customize&&(g=b.customize(g,b,c));b=n("<textarea readonly/>").val(g).appendTo(d);if(x.queryCommandSupported("copy")){d.appendTo(c.table().container());b[0].focus();b[0].select();try{var p=x.execCommand("copy");d.remove();if(p){c.buttons.info(c.i18n("buttons.copyTitle","Copy to clipboard"),c.i18n("buttons.copySuccess",{1:"Copied one row to clipboard",_:"Copied %d rows to clipboard"},a.rows),2E3);this.processing(!1);return}}catch(q){}}p=
  n("<span>"+c.i18n("buttons.copyKeys","Press <i>ctrl</i> or <i>⌘</i> + <i>C</i> to copy the table data<br>to your system clipboard.<br><br>To cancel, click this message or press escape.")+"</span>").append(d);c.buttons.info(c.i18n("buttons.copyTitle","Copy to clipboard"),p,0);b[0].focus();b[0].select();var t=n(p).closest(".dt-button-info"),h=function(){t.off("click.buttons-copy");n(x).off(".buttons-copy");c.buttons.info(!1)};t.on("click.buttons-copy",h);n(x).on("keydown.buttons-copy",function(q){27===
  q.keyCode&&(h(),m.processing(!1))}).on("copy.buttons-copy cut.buttons-copy",function(){h();m.processing(!1)})},exportOptions:{},fieldSeparator:"\t",fieldBoundary:"",header:!0,footer:!1,title:"*",messageTop:"*",messageBottom:"*"};D.ext.buttons.csvHtml5={bom:!1,className:"buttons-csv buttons-html5",available:function(){return u.FileReader!==B&&u.Blob},text:function(a){return a.i18n("buttons.csv","CSV")},action:function(a,c,d,b){this.processing(!0);a=S(c,b).str;d=c.buttons.exportInfo(b);var m=b.charset;
  b.customize&&(a=b.customize(a,b,c));!1!==m?(m||(m=x.characterSet||x.charset),m&&(m=";charset="+m)):m="";b.bom&&(a="﻿"+a);K(new Blob([a],{type:"text/csv"+m}),d.filename,!0);this.processing(!1)},filename:"*",extension:".csv",exportOptions:{},fieldSeparator:",",fieldBoundary:'"',escapeChar:'"',charset:null,header:!0,footer:!1};D.ext.buttons.excelHtml5={className:"buttons-excel buttons-html5",available:function(){return u.FileReader!==B&&(E||u.JSZip)!==B&&!T()&&M},text:function(a){return a.i18n("buttons.excel",
  "Excel")},action:function(a,c,d,b){this.processing(!0);var m=this,e=0;a=function(k){return n.parseXML(P[k])};var f=a("xl/worksheets/sheet1.xml"),g=f.getElementsByTagName("sheetData")[0];a={_rels:{".rels":a("_rels/.rels")},xl:{_rels:{"workbook.xml.rels":a("xl/_rels/workbook.xml.rels")},"workbook.xml":a("xl/workbook.xml"),"styles.xml":a("xl/styles.xml"),worksheets:{"sheet1.xml":f}},"[Content_Types].xml":a("[Content_Types].xml")};var p=c.buttons.exportData(b.exportOptions),t,h,q=function(k){t=e+1;h=
  y(f,"row",{attr:{r:t}});for(var l=0,z=k.length;l<z;l++){var G=I(l)+""+t,A=null;if(null===k[l]||k[l]===B||""===k[l])if(!0===b.createEmptyCells)k[l]="";else continue;var H=k[l];k[l]="function"===typeof k[l].trim?k[l].trim():k[l];for(var N=0,W=U.length;N<W;N++){var L=U[N];if(k[l].match&&!k[l].match(/^0\d+/)&&k[l].match(L.match)){A=k[l].replace(/[^\d\.\-]/g,"");L.fmt&&(A=L.fmt(A));A=y(f,"c",{attr:{r:G,s:L.style},children:[y(f,"v",{text:A})]});break}}A||("number"===typeof k[l]||k[l].match&&k[l].match(/^-?\d+(\.\d+)?$/)&&
  !k[l].match(/^0\d+/)?A=y(f,"c",{attr:{t:"n",r:G},children:[y(f,"v",{text:k[l]})]}):(H=H.replace?H.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g,""):H,A=y(f,"c",{attr:{t:"inlineStr",r:G},children:{row:y(f,"is",{children:{row:y(f,"t",{text:H,attr:{"xml:space":"preserve"}})}})}})));h.appendChild(A)}g.appendChild(h);e++};b.customizeData&&b.customizeData(p);var v=function(k,l){var z=n("mergeCells",f);z[0].appendChild(y(f,"mergeCell",{attr:{ref:"A"+k+":"+I(l)+k}}));z.attr("count",parseFloat(z.attr("count"))+
  1);n("row:eq("+(k-1)+") c",f).attr("s","51")},r=c.buttons.exportInfo(b);r.title&&(q([r.title],e),v(e,p.header.length-1));r.messageTop&&(q([r.messageTop],e),v(e,p.header.length-1));b.header&&(q(p.header,e),n("row:last c",f).attr("s","2"));d=e;var w=0;for(var C=p.body.length;w<C;w++)q(p.body[w],e);w=e;b.footer&&p.footer&&(q(p.footer,e),n("row:last c",f).attr("s","2"));r.messageBottom&&(q([r.messageBottom],e),v(e,p.header.length-1));q=y(f,"cols");n("worksheet",f).prepend(q);v=0;for(C=p.header.length;v<
  C;v++)q.appendChild(y(f,"col",{attr:{min:v+1,max:v+1,width:V(p,v),customWidth:1}}));q=a.xl["workbook.xml"];n("sheets sheet",q).attr("name",Q(b));b.autoFilter&&(n("mergeCells",f).before(y(f,"autoFilter",{attr:{ref:"A"+d+":"+I(p.header.length-1)+w}})),n("definedNames",q).append(y(q,"definedName",{attr:{name:"_xlnm._FilterDatabase",localSheetId:"0",hidden:1},text:Q(b)+"!$A$"+d+":"+I(p.header.length-1)+w})));b.customize&&b.customize(a,b,c);0===n("mergeCells",f).children().length&&n("mergeCells",f).remove();
  c=new (E||u.JSZip);d={type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};O(c,a);c.generateAsync?c.generateAsync(d).then(function(k){K(k,r.filename);m.processing(!1)}):(K(c.generate(d),r.filename),this.processing(!1))},filename:"*",extension:".xlsx",exportOptions:{},header:!0,footer:!1,title:"*",messageTop:"*",messageBottom:"*",createEmptyCells:!1,autoFilter:!1,sheetName:""};D.ext.buttons.pdfHtml5={className:"buttons-pdf buttons-html5",available:function(){return u.FileReader!==
  B&&(F||u.pdfMake)},text:function(a){return a.i18n("buttons.pdf","PDF")},action:function(a,c,d,b){this.processing(!0);d=c.buttons.exportData(b.exportOptions);a=c.buttons.exportInfo(b);var m=[];b.header&&m.push(n.map(d.header,function(g){return{text:"string"===typeof g?g:g+"",style:"tableHeader"}}));for(var e=0,f=d.body.length;e<f;e++)m.push(n.map(d.body[e],function(g){if(null===g||g===B)g="";return{text:"string"===typeof g?g:g+"",style:e%2?"tableBodyEven":"tableBodyOdd"}}));b.footer&&d.footer&&m.push(n.map(d.footer,
  function(g){return{text:"string"===typeof g?g:g+"",style:"tableFooter"}}));d={pageSize:b.pageSize,pageOrientation:b.orientation,content:[{table:{headerRows:1,body:m},layout:"noBorders"}],styles:{tableHeader:{bold:!0,fontSize:11,color:"white",fillColor:"#2d4154",alignment:"center"},tableBodyEven:{},tableBodyOdd:{fillColor:"#f3f3f3"},tableFooter:{bold:!0,fontSize:11,color:"white",fillColor:"#2d4154"},title:{alignment:"center",fontSize:15},message:{}},defaultStyle:{fontSize:10}};a.messageTop&&d.content.unshift({text:a.messageTop,
  style:"message",margin:[0,0,0,12]});a.messageBottom&&d.content.push({text:a.messageBottom,style:"message",margin:[0,0,0,12]});a.title&&d.content.unshift({text:a.title,style:"title",margin:[0,0,0,12]});b.customize&&b.customize(d,b,c);c=(F||u.pdfMake).createPdf(d);"open"!==b.download||T()?c.download(a.filename):c.open();this.processing(!1)},title:"*",filename:"*",extension:".pdf",exportOptions:{},orientation:"portrait",pageSize:"A4",header:!0,footer:!1,messageTop:"*",messageBottom:"*",customize:null,
  download:"download"};return D.Buttons});
  
  
  /*!
   Print button for Buttons and DataTables.
   2016 SpryMedia Ltd - datatables.net/license
  */
  (function(b){"function"===typeof define&&define.amd?define(["jquery","datatables.net","datatables.net-buttons"],function(c){return b(c,window,document)}):"object"===typeof exports?module.exports=function(c,g){c||(c=window);g&&g.fn.dataTable||(g=require("datatables.net")(c,g).$);g.fn.dataTable.Buttons||require("datatables.net-buttons")(c,g);return b(g,c,c.document)}:b(jQuery,window,document)})(function(b,c,g,y){var u=b.fn.dataTable,n=g.createElement("a"),v=function(a){n.href=a;a=n.host;-1===a.indexOf("/")&&
  0!==n.pathname.indexOf("/")&&(a+="/");return n.protocol+"//"+a+n.pathname+n.search};u.ext.buttons.print={className:"buttons-print",text:function(a){return a.i18n("buttons.print","Print")},action:function(a,k,p,h){a=k.buttons.exportData(b.extend({decodeEntities:!1},h.exportOptions));p=k.buttons.exportInfo(h);var w=k.columns(h.exportOptions.columns).flatten().map(function(d){return k.settings()[0].aoColumns[k.column(d).index()].sClass}).toArray(),r=function(d,e){for(var x="<tr>",l=0,z=d.length;l<z;l++)x+=
  "<"+e+" "+(w[l]?'class="'+w[l]+'"':"")+">"+(null===d[l]||d[l]===y?"":d[l])+"</"+e+">";return x+"</tr>"},m='<table class="'+k.table().node().className+'">';h.header&&(m+="<thead>"+r(a.header,"th")+"</thead>");m+="<tbody>";for(var t=0,A=a.body.length;t<A;t++)m+=r(a.body[t],"td");m+="</tbody>";h.footer&&a.footer&&(m+="<tfoot>"+r(a.footer,"th")+"</tfoot>");m+="</table>";var f=c.open("","");f.document.close();var q="<title>"+p.title+"</title>";b("style, link").each(function(){var d=q,e=b(this).clone()[0];
  "link"===e.nodeName.toLowerCase()&&(e.href=v(e.href));q=d+e.outerHTML});try{f.document.head.innerHTML=q}catch(d){b(f.document.head).html(q)}f.document.body.innerHTML="<h1>"+p.title+"</h1><div>"+(p.messageTop||"")+"</div>"+m+"<div>"+(p.messageBottom||"")+"</div>";b(f.document.body).addClass("dt-print-view");b("img",f.document.body).each(function(d,e){e.setAttribute("src",v(e.getAttribute("src")))});h.customize&&h.customize(f,h,k);a=function(){h.autoPrint&&(f.print(),f.close())};navigator.userAgent.match(/Trident\/\d.\d/)?
  a():f.setTimeout(a,1E3)},title:"*",messageTop:"*",messageBottom:"*",exportOptions:{},header:!0,footer:!1,autoPrint:!0,customize:null};return u.Buttons});
  
  
  // datatables function
  $('#myTable').DataTable({
      "pageLength": 10,
      "language": {
          searchPanes: {
              clearMessage: "Limpar tudo",
              collapse: {
                  0: "Filtros",
                  _: "Filtros (%d)"
              },
              count: "{total}",
              countFiltered: "{shown} ({total})",
              emptyPanes: "Nenhum Filtro", 
              loadMessage: "Carregando Filtros...",
              title: "Filtros Ativos",
              sEmptyTable:"N",
          },
          buttons: {
              "copy": 'Copiar',
              "copySuccess": {
                  "1": "Uma linha copiada",
                  "_": "%d linhas copiadas"
              },
              "copyTitle": 'Copiar linhas',
              "copyKeys": 'Aperte <i>ctrl</i> ou <i>\u2318</i> + <i>C</i> para copiar os dados da tabela <br>para seu sistema.<br><br>Para cancelar, clique nesta mensagem ou aperte ESC.'
          }
      },
      order: [
          [0, 'asc'],
      ],
      rowGroup: {
          dataSrc: 0
      },
      columnDefs:[{
          targets: '_all',
          type: 'locale-compare'
      }],
      searchPanes:{
          cascadePanes: true,
          dtOpts: {
              dom:'tp',
              paging:'true',
              pagingType:'simple',
              searching:true,
          }
      },
      buttons: ['searchPanes', 'copy', 'excel'],
      dom:'Bfrtip',
  });
  
  
  $('.C').DataTable({
      "pageLength": 5,
  });
  
  