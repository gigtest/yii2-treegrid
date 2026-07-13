/*
 * jQuery treegrid Plugin 0.3.0
 * https://github.com/maxazan/jquery-treegrid
 *
 * Copyright 2013, Pomazan Max
 * Licensed under the MIT licenses.
 */
(function($) {

    var timer = 0;
    var delay = (function () {
        return function (callback, ms) {
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        };
    })();

    var isEmptyValue = function (value) {
        return value === undefined || value === null || value === '';
    };

    var prepareIndex = function ($rows, settings) {
        var index = createTreegridIndex();

        $rows.each(function () {
            var row = this;
            var jRow = $(row);
            var nodeId = getIndexNodeId(row, settings);

            if (nodeId === null) {
                return;
            }

            var parentId = getIndexParentId(row, settings);

            var node = createTreegridNode(
                nodeId,
                parentId,
                jRow,
                jRow.hasClass(settings.expandedClass),
                jRow.hasClass(settings.collapsedClass),
                jRow.hasClass(settings.selectedClass),
                jRow.hasClass(settings.findedClass),
                getSearchTextFromRow(jRow, settings)
            );

            addNodeToIndex(index, node);
        });

        linkIndexNodes(index);

        return index;
    };

    var createTreegridNode = function (
        nodeId, parentId, jRow, isExpanded, isCollapsed, isSelected, isFinded, searchText
    ) {
        return {
            id: nodeId,
            parentId: parentId,
            childIds: [],
            jRow: jRow,
            isExpanded: isExpanded,
            isCollapsed: isCollapsed,
            isSelected: isSelected,
            isFinded: isFinded,
            isSearchIncluded: false,
            searchText: searchText
        };
    };

    var createTreegridIndex = function () {
        return {
            nodes: {},
            orderedIds: [],
            isSearchActive: false
        };
    };

    var getIndexNodeId = function (row, settings) {
        var nodeId = settings.getNodeId.apply(row);

        if (isEmptyValue(nodeId)) {
            return null;
        }

        return String(nodeId);
    };

    var getIndexParentId = function (row, settings) {
        var parentId = settings.getParentNodeId.apply(row);

        if (isEmptyValue(parentId)) {
            return null;
        }

        return String(parentId);
    };

    var getSearchTextFromRow = function (jRow, settings) {
        var searchColumns = settings.searchColumns || [0];
        var text = [];

        for (var i = 0; i < searchColumns.length; i++) {
            text.push(
                jRow
                    .find('td')
                    .eq(searchColumns[i])
                    .text()
            );
        }

        return text.join(' ').toLowerCase();
    };

    var eachIndexNode = function (index, callback) {
        if (!index || !index.nodes) {
            return;
        }

        if (index.orderedIds && index.orderedIds.length) {
            for (var i = 0; i < index.orderedIds.length; i++) {
                var nodeId = index.orderedIds[i];
                var node = getIndexNodeById(index, nodeId);

                if (node) {
                    callback(node, nodeId);
                }
            }

            return;
        }

        for (var nodeId in index.nodes) {
            if (!Object.prototype.hasOwnProperty.call(index.nodes, nodeId)) {
                continue;
            }

            callback(index.nodes[nodeId], nodeId);
        }
    };

    var addNodeToIndex = function (index, node) {
        if (!index.nodes[node.id]) {
            index.orderedIds.push(node.id);
        }

        index.nodes[node.id] = node;

        return node;
    };

    var linkIndexNodes = function (index) {
        eachIndexNode(index, function (node) {
            if (node.parentId === null) {
                return;
            }

            var parentNode = getIndexNodeById(index, node.parentId);

            if (parentNode) {
                parentNode.childIds.push(node.id);
            }
        });
    };

    var getIndexNodeById = function (index, nodeId) {
        if (!index || !index.nodes || isEmptyValue(nodeId)) {
            return null;
        }

        return index.nodes[String(nodeId)] || null;
    };

    var getIndexNodesByIds = function (index, ids) {
        var nodes = [];

        if (!index || !ids || !ids.length) {
            return nodes;
        }

        for (var i = 0; i < ids.length; i++) {
            var node = getIndexNodeById(index, ids[i]);

            if (node) {
                nodes.push(node);
            }
        }

        return nodes;
    };

    var getAllIndexNodes = function (index) {
        var nodes = [];

        eachIndexNode(index, function (node) {
            nodes.push(node);
        });

        return nodes;
    };

    var getRootIndexNodes = function (index) {
        var nodes = [];

        eachIndexNode(index, function (node) {
            if (node.parentId === null) {
                nodes.push(node);
            }
        });

        return nodes;
    };

    var getChildIndexNodes = function (index, node) {
        if (!index || !node) {
            return [];
        }

        return getIndexNodesByIds(index, node.childIds);
    };

    var getSelectedIndexNodes = function (index) {
        var nodes = [];

        eachIndexNode(index, function (node) {
            if (node.isSelected) {
                nodes.push(node);
            }
        });

        return nodes;
    };

    var getFindedIndexNodes = function (index) {
        var nodes = [];

        eachIndexNode(index, function (node) {
            if (node.isFinded) {
                nodes.push(node);
            }
        });

        return nodes;
    };

    var getMatchedIndexNodes = function (index, value) {
        var nodes = [];
        var searchValue = String(value || '').toLowerCase();

        if (!searchValue.length) {
            return nodes;
        }

        eachIndexNode(index, function (node) {
            if (node.searchText.indexOf(searchValue) !== -1) {
                nodes.push(node);
            }
        });

        return nodes;
    };

    var getParentIndexNode = function (index, node) {
        if (!index || !node || node.parentId === null) {
            return null;
        }

        return getIndexNodeById(index, node.parentId);
    };

    var getAncestorIndexNodes = function (index, node) {
        var nodes = [];
        var parentNode = getParentIndexNode(index, node);

        while (parentNode) {
            nodes.push(parentNode);
            parentNode = getParentIndexNode(index, parentNode);
        }

        return nodes;
    };

    var getContextRootIndexNodes = function (index) {
        var nodes = getRootIndexNodes(index);

        if (!index || !index.isSearchActive) {
            return nodes;
        }

        var contextNodes = [];

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].isSearchIncluded) {
                contextNodes.push(nodes[i]);
            }
        }

        return contextNodes;
    };

    var getContextChildIndexNodes = function (index, node) {
        var nodes = getChildIndexNodes(index, node);

        if (!index || !index.isSearchActive) {
            return nodes;
        }

        var contextNodes = [];

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].isSearchIncluded) {
                contextNodes.push(nodes[i]);
            }
        }

        return contextNodes;
    };

    var getDescendantIndexNodes = function(index, node) {
        var descendants = [];
        var childNodes = getChildIndexNodes(index, node);

        for (var i = 0; i < childNodes.length; i++) {
            descendants.push(childNodes[i]);

            descendants = descendants.concat(
                getDescendantIndexNodes(index, childNodes[i])
            );
        }

        return descendants;
    };

    var isIndexNodeVisible = function (index, node) {
        if (!index || !node) {
            return false;
        }

        if (index.isSearchActive && !node.isSearchIncluded) {
            return false;
        }

        var parentNode = getParentIndexNode(index, node);

        while (parentNode) {
            if (index.isSearchActive && !parentNode.isSearchIncluded) {
                return false;
            }

            if (!parentNode.isExpanded) {
                return false;
            }

            parentNode = getParentIndexNode(index, parentNode);
        }

        return true;
    };

    var getSiblingIndexNodes = function (index, node) {
        if (!index || !node) {
            return [];
        }

        if (node.parentId === null) {
            return getRootIndexNodes(index);
        }

        var parentNode = getIndexNodeById(index, node.parentId);

        return parentNode ? getChildIndexNodes(index, parentNode) : [];
    };

    var getContextSiblingIndexNodes = function (index, node) {
        var siblingNodes = getSiblingIndexNodes(index, node);

        if (!index || !index.isSearchActive) {
            return siblingNodes;
        }

        var contextNodes = [];

        for (var i = 0; i < siblingNodes.length; i++) {
            if (siblingNodes[i].isSearchIncluded) {
                contextNodes.push(siblingNodes[i]);
            }
        }

        return contextNodes;
    };

    var getRowElementsFromIndexNodes = function (nodes) {
        var elements = [];

        if (!nodes || !nodes.length) {
            return elements;
        }

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            if (node && node.jRow && node.jRow.length) {
                elements.push(node.jRow[0]);
            }
        }

        return elements;
    };

    var methods = {
        /**
         * Initialize tree
         *
         * @param {Object} options
         * @returns {Object[]}
         */
        initTree: function(options) {
            var settings = $.extend({}, this.treegrid.defaults, options);

            return this.each(function() {
                var $this = $(this);

                $this.treegrid('setTreeContainer', $this.find('table'));
                $this.treegrid('setSettings', settings);
                $this.treegrid('initIndex', settings);
                $this.treegrid('getRootNodes').treegrid('initNode', settings);
            });
        },

        /**
         * Initialize node
         *
         * @param {Object} settings
         * @returns {Object[]}
         */
        initNode: function(settings) {
            return this.each(function() {
                var $this = $(this);

                $this.treegrid('setTreeContainer', settings.getTreeGridContainer.apply(this));

                if (!$this.treegrid('isNode')) {
                    return;
                }

                $this.treegrid('getChildNodes').treegrid('initNode', settings);
                $this.treegrid('initEvents');
                $this.treegrid('initState');
                $this.treegrid('initChangeEvent');
                $this.treegrid('initSettingsEvents');
                $this.treegrid('initExpanderEvent');
            });
        },

        /**
         * Initialize node index
         *
         * @param {Object} settings
         * @returns {Object[]}
         */
        initIndex: function(settings) {
            return this.each(function () {
                var $treeContainer = $(this);
                var index = prepareIndex($treeContainer.find('tr'), settings);

                $treeContainer.treegrid("setIndex", index);
            });
        },

        /**
         * Инициализирует события изменения
         *
         * @returns {Node}
         */
        initChangeEvent: function() {
            var $this = $(this);

            $this.on("change", function() {
                var $this = $(this);

                if ($this.treegrid('getSetting', 'saveState')) {
                    $this.treegrid('saveState');
                }
            });

            return $this;
        },

        /**
         * Initialize search input event
         *
         * @param {Object} widget
         * @returns {Node}
         */
        initSearchEvent: function (widget) {
            var search = $(this);
            var $widget = $(widget);
            var searchLogo = search.closest('.treegrid-search-container').find('.treegrid-search-icon');

            searchLogo.off('click').on('click', function () {
                if (!searchLogo.hasClass('search-clear')) {
                    return;
                }

                search.val('').trigger('keyup');
            });

            search.off('keyup').on('keyup', function() {
                var value = search.val();

                if (String(value || '').length === 0) {
                    searchLogo.removeClass('search-clear').addClass('search-logo');

                    clearTimeout(timer);
                    $widget.treegrid('resetSearch');

                    return;
                }

                searchLogo.removeClass('search-logo').addClass('search-clear');

                delay(function () {
                    $widget.treegrid('search', value);
                }, 300);
            });

            return search;
        },

        /**
         * Initialize expander click event
         *
         * @returns {Node}
         */
        initExpanderEvent: function() {
            return $(this).each(function () {
                var $this = $(this);
                var expander = $this.treegrid('getExpander');

                if (!expander || !expander.length) {
                    return;
                }

                expander.off('click');
                expander.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    $($(this).closest('tr')).treegrid('toggle');
                });
            });
        },

        /**
         * Initialize node events
         *
         * @returns {Node}
         */
        initEvents: function() {
            var $this = $(this);

            $this.on("collapse", function(e) {
                e.preventDefault();
                e.stopPropagation();

                $this.treegrid('setCollapseState', true);
            });

            $this.on("expand", function(e) {
                e.preventDefault();
                e.stopPropagation();

                $this.treegrid('setExpandedState', true);
            });

            $this.on("select", function (e) {
                e.preventDefault();
                e.stopPropagation();

                $this.treegrid('setSelectedState', true);
            });

            $this.on("unselect", function (e) {
                e.preventDefault();
                e.stopPropagation();

                $this.treegrid('setSelectedState', false);
            });

            $this.on("click", function (e) {
                e.preventDefault();
                e.stopPropagation();

                $this.treegrid("toggleSelect");
            });

            return $this;
        },

        /**
         * Initialize events from settings
         *
         * @returns {Node}
         */
        initSettingsEvents: function() {
            var $this = $(this);

            $this.on("change", function() {
                var $this = $(this);
                if (typeof($this.treegrid('getSetting', 'onChange')) === "function") {
                    $this.treegrid('getSetting', 'onChange').apply($this);
                }
            });

            $this.on("collapse", function() {
                var $this = $(this);
                if (typeof($this.treegrid('getSetting', 'onCollapse')) === "function") {
                    $this.treegrid('getSetting', 'onCollapse').apply($this);
                }
            });

            $this.on("expand", function() {
                var $this = $(this);
                if (typeof($this.treegrid('getSetting', 'onExpand')) === "function") {
                    $this.treegrid('getSetting', 'onExpand').apply($this);
                }
            });

            $this.on("select", function () {
                var $this = $(this);
                if (typeof($this.treegrid('getSetting', 'onSelect')) === "function") {
                    $this.treegrid('getSetting', 'onSelect').apply($this);
                }
            });

            $this.on("unselect", function () {
                var $this = $(this);
                if (typeof($this.treegrid('getSetting', 'onUnselect')) === "function") {
                    $this.treegrid('getSetting', 'onUnselect').apply($this);
                }
            });

            $this.on("click", function () {
                var $this = $(this);
                if (typeof($this.treegrid('getSetting', 'onClick')) === "function") {
                    $this.treegrid('getSetting', 'onClick').apply($this);
                }
            });

            return $this;
        },

        /**
         * Initialize search inputs
         *
         * @returns {Node}
         */
        initSearch: function () {
            var $this = $(this);
            $this.treegrid('getSetting', 'getSearchInput').apply(this).each(function() {
                $(this).treegrid('initSearchEvent', $this);
            });
        },

        /**
         * Builds and activates search tree.
         *
         * @param {String} value
         * @returns {Node}
         */
        search: function(value) {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var searchValue = String(value || '');
            var $allNodes = $this.treegrid('getAllNodes');

            if (!searchValue.length) {
                return $this.treegrid('resetSearch');
            }

            $this.treegrid('getSelectedNodes').treegrid('unselect');
            $this.treegrid('getFindedNodes').treegrid('setFindedState', false);

            $allNodes.treegrid('setSearchIncludedState', false);
            $this.treegrid('setSearchActiveState', true);

            var matchedNodes = getMatchedIndexNodes(index, searchValue);
            var includedNodeIds = {};
            var includedNodes = [];
            var ancestorNodeIds = {};
            var ancestorNodes = [];

            var addIncludedNode = function(node) {
                if (!node || includedNodeIds[node.id]) {
                    return;
                }

                includedNodeIds[node.id] = true;
                includedNodes.push(node);
            };

            var addAncestorNode = function(node) {
                if (!node || ancestorNodeIds[node.id]) {
                    return;
                }

                ancestorNodeIds[node.id] = true;
                ancestorNodes.push(node);
            };

            for (var i = 0; i < matchedNodes.length; i++) {
                var matchedNode = matchedNodes[i];
                var matchedAncestorNodes = getAncestorIndexNodes(index, matchedNode);
                var matchedDescendantNodes = getDescendantIndexNodes(index, matchedNode);

                addIncludedNode(matchedNode);

                for (var j = 0; j < matchedAncestorNodes.length; j++) {
                    addIncludedNode(matchedAncestorNodes[j]);
                    addAncestorNode(matchedAncestorNodes[j]);
                }

                for (var k = 0; k < matchedDescendantNodes.length; k++) {
                    addIncludedNode(matchedDescendantNodes[k]);
                }
            }

            $(getRowElementsFromIndexNodes(includedNodes)).treegrid('setSearchIncludedState', true);
            $(getRowElementsFromIndexNodes(ancestorNodes)).treegrid('setExpandedState', true);
            $(getRowElementsFromIndexNodes(matchedNodes)).treegrid('setFindedState', true);

            $allNodes.treegrid('refreshVisibility');

            return $this;
        },

        /**
         * Reset search state
         *
         * @returns {Node}
         */
        resetSearch: function() {
            var $this = $(this);
            var $allNodes = $this.treegrid('getAllNodes');

            $this.treegrid('getSelectedNodes').treegrid('unselect');
            $this.treegrid('getFindedNodes').treegrid('setFindedState', false);

            $this.treegrid('setSearchActiveState', false);
            $allNodes.treegrid('setSearchIncludedState', false);

            $allNodes.treegrid('refreshVisibility');

            return $this;
        },

        /**
         * Initialize expand and collapse buttons
         *
         * @returns {Node}
         */
        initManageButtons: function () {
            var $this = $(this);

            $this.find("#treegrid-expand-all").each(function () {
                $(this).on("click", function() {
                    $this.treegrid("expandAll");
                });
            });

            $this.find("#treegrid-collapse-all").each(function () {
                $(this).on("click", function() {
                    $this.treegrid("collapseAll");
                });
            });
        },

        /**
         * Initialise state of node
         *
         * @returns {Node}
         */
        initState: function() {
            var $this = $(this);
            if ($this.treegrid('getSetting', 'saveState') && !$this.treegrid('isFirstInit')) {
                $this.treegrid('restoreState');
            } else {
                if ($this.treegrid('getSetting', 'initialState') === "expanded") {
                    $this.treegrid('expand');
                } else {
                    $this.treegrid('collapse');
                }
            }
            return $this;
        },

        /**
         * Return true if this tree was never been initialised
         *
         * @returns {Boolean}
         */
        isFirstInit: function() {
            var tree = $(this).treegrid('getTreeContainer');
            if (tree.data('first_init') === undefined) {
                tree.data('first_init', $.cookie(tree.treegrid('getSetting', 'saveStateName')) === undefined);
            }
            return tree.data('first_init');
        },

        /**
         * Save state of current node
         *
         * @returns {Node}
         */
        saveState: function() {
            var $this = $(this);
            if ($this.treegrid('getSetting', 'saveStateMethod') === 'cookie') {

                var stateArrayString = $.cookie($this.treegrid('getSetting', 'saveStateName')) || '';
                var stateArray = (stateArrayString === '' ? [] : stateArrayString.split(','));
                var nodeId = $this.treegrid('getNodeId');

                if ($this.treegrid('isExpanded')) {
                    if ($.inArray(nodeId, stateArray) === -1) {
                        stateArray.push(nodeId);
                    }
                } else if ($this.treegrid('isCollapsed')) {
                    if ($.inArray(nodeId, stateArray) !== -1) {
                        stateArray.splice($.inArray(nodeId, stateArray), 1);
                    }
                }
                $.cookie($this.treegrid('getSetting', 'saveStateName'), stateArray.join(','));
            }
            return $this;
        },

        /**
         * Restore state of current node
         *
         * @returns {Node}
         */
        restoreState: function() {
            var $this = $(this);
            if ($this.treegrid('getSetting', 'saveStateMethod') === 'cookie') {
                var stateArray = $.cookie($this.treegrid('getSetting', 'saveStateName')).split(',');
                if ($.inArray($this.treegrid('getNodeId'), stateArray) !== -1) {
                    $this.treegrid('expand');
                } else {
                    $this.treegrid('collapse');
                }
            }
            return $this;
        },

        /**
         * Get index
         *
         * @return {*|null}
         */
        getIndex: function() {
            var $this = $(this);
            var $treeContainer = $this.treegrid('getTreeContainer');

            if (!$treeContainer) {
                return null;
            }

            return $treeContainer.data('treegridIndex');
        },

        /**
         * Set index
         *
         * @param {Object} index
         */
        setIndex: function(index) {
            var $this = $(this);
            var $treeContainer = $this.treegrid('getTreeContainer');

            if ($treeContainer) {
                $treeContainer.data('treegridIndex', index);
            }
        },

        /**
         * Method return setting by name
         *
         * @param {type} name
         * @returns {unresolved}
         */
        getSetting: function(name) {
            if (!$(this).treegrid('getTreeContainer')) {
                return null;
            }
            return $(this).treegrid('getTreeContainer').data('settings')[name];
        },

        /**
         * Add new settings
         *
         * @param {Object} settings
         */
        setSettings: function(settings) {
            $(this).treegrid('getTreeContainer').data('settings', settings);
        },

        /**
         * Return tree container
         *
         * @returns {HtmlElement}
         */
        getTreeContainer: function() {
            return $(this).data('treegrid');
        },

        /**
         * Set tree container
         *
         * @param {HtmlElement} container
         */
        setTreeContainer: function(container) {
            return $(this).data('treegrid', container);
        },

        /**
         * Возвращает выбранные узлы
         *
         * @return {Node}
         */
        getSelectedNodes: function () {
            var index = $(this).treegrid('getIndex');
            var nodes = getSelectedIndexNodes(index);
            var elements = getRowElementsFromIndexNodes(nodes);

            return $(elements);
        },

        /**
         * Set found state
         *
         * @param {Boolean} finded
         * @returns {Node}
         */
        setFindedState: function(finded) {
            return $(this).each(function () {
                var $this = $(this);
                var index = $this.treegrid('getIndex');
                var node = getIndexNodeById(index, $this.treegrid('getNodeId'));
                var settings = $this.treegrid("getTreeContainer").data("settings");

                if (!node) {
                    return;
                }

                node.isFinded = finded;

                $this.toggleClass(settings.findedClass, finded);
            });
        },

        /**
         * Sets search mode state.
         *
         * @param {Boolean} active
         * @returns {Node}
         */
        setSearchActiveState: function(active) {
            var $this = $(this);
            var index = $this.treegrid('getIndex');

            if (index) {
                index.isSearchActive = active;
            }

            return $this;
        },

        /**
         * Sets whether nodes belong to the current search tree.
         *
         * @param {Boolean} included
         * @returns {Node}
         */
        setSearchIncludedState: function(included) {
            return $(this).each(function () {
                var $this = $(this);
                var index = $this.treegrid('getIndex');
                var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

                if (!node) {
                    return;
                }

                node.isSearchIncluded = included;
            });
        },

        /**
         * Возвращает найденные узлы при поиске
         *
         * @return {Node}
         */
        getFindedNodes: function () {
            var index = $(this).treegrid('getIndex');
            var nodes = getFindedIndexNodes(index);
            var elements = getRowElementsFromIndexNodes(nodes);

            return $(elements);
        },

        /**
         * Возвращает расширитель узла
         *
         * @returns {Node}
         */
        getExpander: function() {
            var $this = $(this);
            return $this.find('.treegrid-expander');
        },

        /**
         * Method return all root nodes of tree
         *
         * @returns {Array}
         */
        getRootNodes: function() {
            var index = $(this).treegrid('getIndex');
            var rootNodes = getRootIndexNodes(index);
            var elements = getRowElementsFromIndexNodes(rootNodes);

            return $(elements);
        },

        /**
         * Returns root nodes available in the current tree context.
         *
         * @returns {Node}
         */
        getContextRootNodes: function() {
            var index = $(this).treegrid('getIndex');
            var nodes = getContextRootIndexNodes(index);
            var elements = getRowElementsFromIndexNodes(nodes);

            return $(elements);
        },

        /**
         * Method return all nodes of tree
         *
         * @returns {Array}
         */
        getAllNodes: function() {
            var index = $(this).treegrid('getIndex');
            var nodes = getAllIndexNodes(index);
            var elements = getRowElementsFromIndexNodes(nodes);

            return $(elements);
        },

        /**
         * Mthod return true if element is Node
         *
         * @returns {String}
         */
        isNode: function() {
            return $(this).treegrid('getNodeId') !== null;
        },

        /**
         * Mthod return id of node
         *
         * @returns {String}
         */
        getNodeId: function() {
            return $(this).treegrid('getSetting', 'getNodeId').apply(this);
        },

        /**
         * Method return parent node or null if root node
         *
         * @returns {Object[]}
         */
        getParentNode: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

            if (!node || node.parentId === null) {
                return null;
            }

            var parentNode = getIndexNodeById(index, node.parentId);

            return parentNode ? parentNode.jRow : null;
        },

        /**
         * Method return array of child nodes or null if node is leaf
         *
         * @returns {Object[]}
         */
        getChildNodes: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));
            var nodes = getChildIndexNodes(index, node);
            var elements = getRowElementsFromIndexNodes(nodes);

            return $(elements);
        },

        /**
         * Returns child nodes available in the current tree context.
         *
         * @returns {Node}
         */
        getContextChildNodes: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(
                index,
                $this.treegrid('getNodeId')
            );
            var nodes = getContextChildIndexNodes(index, node);
            var elements = getRowElementsFromIndexNodes(nodes);

            return $(elements);
        },

        /**
         * Returns whether search mode is active.
         *
         * @returns {Boolean}
         */
        isSearchActive: function() {
            var index = $(this).treegrid('getIndex');

            return !!(index && index.isSearchActive);
        },

        /**
         * Returns whether node belongs to the current search tree.
         *
         * @returns {Boolean}
         */
        isSearchIncluded: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

            return !!(node && node.isSearchIncluded);
        },

        /**
         * Method return true if node is root
         *
         * @returns {Boolean}
         */
        isRoot: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

            return !!(node && node.parentId === null);
        },

        /**
         * Method return true if node has no child nodes
         *
         * @returns {Boolean}
         */
        isLeaf: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(
                index,
                $this.treegrid('getNodeId')
            );

            return getContextChildIndexNodes(index, node).length !== 0;
        },

        /**
         * Method return true if node last in branch
         *
         * @returns {Boolean}
         */
        isLast: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));
            var siblingNodes = getContextSiblingIndexNodes(index, node);

            return !!(node && siblingNodes.length > 0 && siblingNodes[siblingNodes.length - 1].id === node.id);
        },

        /**
         * Method return true if node first in branch
         *
         * @returns {Boolean}
         */
        isFirst: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));
            var siblingNodes = getContextSiblingIndexNodes(index, node);

            return !!(node && siblingNodes.length > 0 && siblingNodes[0].id === node.id);
        },

        /**
         * Return true if node expanded
         *
         * @returns {Boolean}
         */
        isExpanded: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

            return node ? node.isExpanded : false;
        },

        /**
         * Return true if node collapsed
         *
         * @returns {Boolean}
         */
        isCollapsed: function() {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

            return node ? node.isCollapsed : false;
        },

        /**
         * Возвращает true, если узел выбран
         *
         * @returns {Boolean}
         */
        isSelected: function () {
            var $this = $(this);
            var index = $this.treegrid('getIndex');
            var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

            return node ? node.isSelected : false;
        },

        /**
         * Return true if at least one of parent node is collapsed
         *
         * @returns {Boolean}
         */
        isOneOfParentsCollapsed: function() {
            var $this = $(this);

            if ($this.treegrid('isRoot')) {
                return false;
            } else {
                if ($this.treegrid('getParentNode').treegrid('isCollapsed')) {
                    return true;
                } else {
                    return $this.treegrid('getParentNode').treegrid('isOneOfParentsCollapsed');
                }
            }
        },

        /**
         * Set expanded state
         *
         * @param {Boolean} expanded
         * @returns {Node}
         */
        setExpandedState: function(expanded) {
            return $(this).each(function () {
                var $this = $(this);
                var index = $this.treegrid('getIndex');
                var node = getIndexNodeById(index, $this.treegrid('getNodeId'));
                var settings = $this.treegrid("getTreeContainer").data("settings");

                if (!node) {
                    return;
                }

                node.isExpanded = expanded;
                node.isCollapsed = !expanded;

                $this.toggleClass(settings.expandedClass, expanded).toggleClass(settings.collapsedClass, !expanded);
            });
        },

        /**
         * Expand node
         *
         * @returns {Node}
         */
        expand: function() {
            return $(this).each(function() {
                var $this = $(this);

                if ($this.treegrid('isLeaf') && !$this.treegrid("isExpanded")) {
                    $this.trigger("expand");
                    $this.treegrid("showExpandedChildren");
                    $this.trigger("change");
                }
            });
        },

        /**
         * Show expanded children
         *
         * @returns {Node}
         */
        showExpandedChildren: function() {
            return this.each(function () {
                var $this = $(this);
                var children = $this.treegrid('getContextChildNodes');

                children.show();

                children.each(function () {
                    var $child = $(this);

                    if ($child.treegrid('isExpanded')) {
                        $child.treegrid('showExpandedChildren');
                    }
                });

                return $this;
            });
        },

        /**
         * Expand all nodes
         *
         * @returns {Node}
         */
        expandAll: function() {
            var $this = $(this);

            $this.treegrid('getContextRootNodes').treegrid('expandRecursive');

            return $this;
        },

        /**
         * Expand current node and all child nodes begin from current
         *
         * @returns {Node}
         */
        expandRecursive: function() {
            return $(this).each(function() {
                var $this = $(this);

                if (!$this.treegrid('isLeaf')) {
                    return;
                }

                if ($this.treegrid('isCollapsed')) {
                    $this.treegrid('expand');
                }

                $this
                    .treegrid('getContextChildNodes')
                    .treegrid('expandRecursive');
            });
        },

        /**
         * Set collapsed state
         *
         * @param {Boolean} collapsed
         * @returns {Node}
         */
        setCollapseState: function(collapsed) {
            return $(this).each(function () {
                var $this = $(this);
                var index = $this.treegrid('getIndex');
                var node = getIndexNodeById(index, $this.treegrid('getNodeId'));
                var settings = $this.treegrid("getTreeContainer").data("settings");

                if (!node) {
                    return;
                }

                node.isExpanded = !collapsed;
                node.isCollapsed = collapsed;

                $this.toggleClass(settings.collapsedClass, collapsed).toggleClass(settings.expandedClass, !collapsed);
            });
        },

        /**
         * Collapse node
         *
         * @returns {Node}
         */
        collapse: function() {
            return $(this).each(function() {
                var $this = $(this);

                if ($this.treegrid('isLeaf') && !$this.treegrid("isCollapsed")) {
                    $this.trigger("collapse");
                    $this.treegrid('hideChildren');
                    $this.trigger("change");
                }
            });
        },

        /**
         * Hide children
         *
         * @returns {Node}
         */
        hideChildren: function() {
            return this.each(function () {
                var $this = $(this);
                var children = $this.treegrid('getContextChildNodes');

                children.hide();

                children.each(function () {
                    var $child = $(this);

                    if ($child.treegrid('isExpanded')) {
                        $child.treegrid('hideChildren');
                    }
                });

                return $this;
            });
        },

        /**
         * Collapse all nodes
         *
         * @returns {Node}
         */
        collapseAll: function() {
            var $this = $(this);

            $this.treegrid('getContextRootNodes').treegrid('collapseRecursive');

            return $this;
        },

        /**
         * Collapse current node and all child nodes begin from current
         *
         * @returns {Node}
         */
        collapseRecursive: function() {
            return $(this).each(function() {
                var $this = $(this);

                if (!$this.treegrid('isLeaf')) {
                    return;
                }

                $this.treegrid('getContextChildNodes').treegrid('collapseRecursive');

                if ($this.treegrid('isExpanded')) {
                    $this.treegrid('collapse');
                }
            });
        },

        /**
         * Set selected state
         *
         * @param {Boolean} selected
         * @returns {Node}
         */
        setSelectedState: function(selected) {
            return $(this).each(function () {
                var $this = $(this);
                var index = $this.treegrid('getIndex');
                var node = getIndexNodeById(index, $this.treegrid('getNodeId'));
                var settings = $this.treegrid("getTreeContainer").data("settings");

                if (!node) {
                    return;
                }

                node.isSelected = selected;

                $this.toggleClass(settings.selectedClass, selected);
            });
        },

        /**
         * Выбирает узел
         *
         * @returns {Node}
         */
        select: function () {
            return $(this).each(function () {
                var $this = $(this);
                if ($this.treegrid('isLeaf') && !$this.treegrid('isSelected') && $this.treegrid('getSetting', 'multipleSelect') && $this.treegrid('getSetting', 'selectRecursive')) {
                    $this.treegrid('selectRecursive');
                    $this.trigger("change");
                } else {
                    $this.trigger('select');
                    $this.trigger("change");
                }
            });
        },

        /**
         * Отменяет выбор узла
         *
         * @returns {Node}
         */
        unselect: function () {
            return $(this).each(function() {
                var $this = $(this);
                if ($this.treegrid('isLeaf') && $this.treegrid('isSelected') && $this.treegrid('getSetting', 'multipleSelect') && $this.treegrid('getSetting', 'selectRecursive')) {
                    $this.treegrid('unselectRecursive');
                    $this.trigger("change");
                } else {
                    $this.trigger('unselect');
                    $this.trigger("change");
                }
            });
        },

        /**
         * Выбирает узел, если не выбран и отменяет выбор, если узел выбран
         *
         * @returns {Node}
         */
        toggleSelect: function () {
            var $this = $(this);
            var selectedNodes = $this.treegrid('getSelectedNodes');
            if (!$this.treegrid('getSetting', 'multipleSelect') && selectedNodes.length >= 1) {
                if (selectedNodes.attr("data-id") !== $this.attr("data-id")) {
                    selectedNodes.treegrid('unselect');
                    $this.treegrid('select');
                } else {
                    $this.treegrid('unselect');
                }
            } else {
                if (!$this.treegrid('isSelected')) {
                    $this.treegrid('select');
                } else {
                    $this.treegrid('unselect');
                }
            }
            return $this;
        },

        /**
         * Выбирает узел и всех его потомков
         *
         * @returns {Node}
         */
        selectRecursive: function () {
            return $(this).each(function() {
                var $this = $(this);

                if (!$this.treegrid('isSelected')) {
                    $this.trigger('select');
                }

                if ($this.treegrid('isLeaf')) {
                    $this.treegrid('getContextChildNodes').treegrid('selectRecursive');
                }
            });
        },

        /**
         * Отменяет выбор узла и всех его потомков
         *
         * @returns {Node}
         */
        unselectRecursive: function () {
            return $(this).each(function() {
                var $this = $(this);

                if ($this.treegrid('isSelected')) {
                    $this.trigger('unselect');
                }

                if ($this.treegrid('isLeaf')) {
                    $this.treegrid('getContextChildNodes').treegrid('unselectRecursive');
                }
            });
        },

        /**
         * Expand if collapsed, Collapse if expanded
         *
         * @returns {Node}
         */
        toggle: function() {
            var $this = $(this);
            if ($this.treegrid('isExpanded')) {
                $this.treegrid('collapse');
            } else {
                $this.treegrid('expand');
            }
            return $this;
        },

        /**
         * Applies node visibility for the current tree context.
         *
         * @returns {Node}
         */
        refreshVisibility: function() {
            var $nodes = $(this);
            var elementsToShow = [];
            var elementsToHide = [];

            $nodes.each(function () {
                var $this = $(this);
                var index = $this.treegrid('getIndex');
                var node = getIndexNodeById(index, $this.treegrid('getNodeId'));

                if (isIndexNodeVisible(index, node)) {
                    elementsToShow.push(this);
                } else {
                    elementsToHide.push(this);
                }
            });

            $(elementsToHide).hide();
            $(elementsToShow).show();

            return $nodes;
        },
    };

    $.fn.treegrid = function(method) {
        var args = Array.prototype.slice.call(arguments, 1);

        if (methods[method]) {
            return methods[method].apply(this, args);
        } else if (typeof method === 'object' || !method) {
            var options = method || {};

            return methods.initTree.apply(this, [options]);
        } else {
            $.error('Method with name ' + method + ' does not exists for jQuery.treegrid');
        }
    };

    /**
     * Plugin's default options
     */
    $.fn.treegrid.defaults = {
        initialState: 'collapsed',
        saveState: false,
        saveStateMethod: 'cookie',
        saveStateName: 'tree-grid-state',
        searchColumns: [0],
        multipleSelect: false,
        selectRecursive: false,
        expandedClass: 'treegrid-expanded',
        collapsedClass: 'treegrid-collapsed',
        selectedClass: 'treegrid-selected',
        findedClass: 'treegrid-finded',
        getSearchInput: function () {
            return $(this).find('.treegrid-search');
        },
        getNodeId: function() {
            return $(this).attr('data-id') || null;
        },
        getParentNodeId: function() {
            return $(this).attr('data-parent-id') || null;
        },
        getTreeGridContainer: function() {
            return $(this).closest('table');
        },
        onCollapse: null,
        onExpand: null,
        onChange: null,
        onSelect: null,
        onUnselect: null,
        onClick: null
    };
})(jQuery);
