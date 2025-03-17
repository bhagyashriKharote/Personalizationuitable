sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/p13n/Engine",
    "sap/m/p13n/SelectionController",
    "sap/m/p13n/SortController",
    "sap/m/p13n/GroupController",
    "sap/m/p13n/MetadataHelper",
    "sap/ui/model/Sorter",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/ui/core/library",
    "com/personalization/ui/tablepersonalizationui/model/MetadataHelper"
], function(Controller, JSONModel, Engine, SelectionController, SortController, GroupController, MetadataHelper, Sorter, Column, Text, coreLibrary, TableMetadata) {
    "use strict";
 
    return Controller.extend("com.personalization.ui.tablepersonalizationui.controller.personalizationui", {
 
        onInit: function() {
            var oModel = new JSONModel();
            oModel.loadData("/model/data.json");
 
            oModel.attachRequestCompleted(function() {
                this.getView().setModel(oModel);
                this._registerForP13n();
            }.bind(this));
        },
 
        _registerForP13n: function() {
            var oTable = this.byId("idEmployeeTable");
 
            this.oMetadataHelper = new MetadataHelper(TableMetadata); // Load Metadata Dynamically
            
 
            Engine.getInstance().register(oTable, {
                helper: this.oMetadataHelper,
                controller: {
                    Columns: new SelectionController({
                        targetAggregation: "columns",
                        control: oTable
                    }),
                    Sorter: new SortController({
                        control: oTable
                    }),
                    Groups: new GroupController({
                        control: oTable
                    })
                }
            });
 
            Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
        },

        onFilterPress: function () {
            var oFilterBar = this.getView().byId("filterBar"); // Replace with actual FilterBar ID
            if (oFilterBar) {
                var bVisible = oFilterBar.getVisible();
                oFilterBar.setVisible(!bVisible);
            } else {
                sap.m.MessageToast.show("Filter Bar not found");
            }
        },

        onHideFilterPress: function () {
            var oFilterBar = this.getView().byId("filterBar");
            oFilterBar.setVisible(!oFilterBar.getVisible());
        },
 
        onGoPress: function() {
            var oTable = this.byId("idEmployeeTable");
            var aFilters = [];
            var sDepartment = this.byId("departmentInput").getValue();
            var sTitle = this.byId("titleInput").getValue();
            var sSkills = this.byId("skillsInput").getValue();
            if (sDepartment) {
                aFilters.push(new sap.ui.model.Filter("Department", sap.ui.model.FilterOperator.Contains, sDepartment));
            }
            if (sTitle) {
                aFilters.push(new sap.ui.model.Filter("Title", sap.ui.model.FilterOperator.Contains, sTitle));
            }
            if (sSkills) {
                aFilters.push(new sap.ui.model.Filter("Skills", sap.ui.model.FilterOperator.Contains, sSkills));
            }
            var oBinding = oTable.getBinding("rows").refresh();
            oBinding.filter(aFilters);
        },
 
        onPersonalizePress: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            Engine.getInstance().show(oTable, ["Columns", "Sorter", "Groups"], {
                contentHeight: "35rem",
                contentWidth: "32rem",
                source: oEvt.getSource()
            });
        },
        
        _getKey: function(oControl) {
            return this.getView().getLocalId(oControl.getId());
        },
        
        handleStateChange: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            var oState = oEvt.getParameter("state");
 
            if (!oState) {
                return;
            }
 
            var aSorter = [];
 
            oState.Groups.forEach(function(oGroup) {
                aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oGroup.key).path, false, true));
            }.bind(this));
 
            oState.Sorter.forEach(function(oSorter) {
                var oExistingSorter = aSorter.find(function(oSort){
                    return oSort.sPath === this.oMetadataHelper.getProperty(oSorter.key).path;
                }.bind(this));
 
                if (oExistingSorter) {
                    oExistingSorter.bDescending = !!oSorter.descending;
                } else {
                    aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
                }
            }.bind(this));
 
            // Update table columns
            oTable.getColumns().forEach(function(oColumn, iIndex) {
                oColumn.setVisible(false);
                oColumn.setWidth(oState.ColumnWidth[this._getKey(oColumn)] || "auto");
                oColumn.setSorted(false);
                oColumn.setGrouped(false);
            }.bind(this));
 
            oState.Sorter.forEach(function(oSorter) {
                var oCol = this.byId(oSorter.key);
                if (oCol) {
                    oCol.setSorted(true);
                    oCol.setSortOrder(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
                }
            }.bind(this));
 
            oState.Groups.forEach(function(oGroup) {
                var oCol = this.byId(oGroup.key);
                if (oCol) {
                    oCol.setGrouped(true);
                }
            }.bind(this));
 
            // Update rows binding
            oTable.bindRows({
                path: "/employees",
                sorter: aSorter
            });
        },
 
        onSort: function(oEvt) {
            var oSortItem = oEvt.getParameter("item");
            var oTable = this.byId("idEmployeeTable");
            var sAffectedProperty = oSortItem.getKey();
            var sSortOrder = oSortItem.getSortOrder();
 
            Engine.getInstance().retrieveState(oTable).then(function(oState) {
                oState.Sorter.forEach(function(oSorter) {
                    oSorter.sorted = false;
                });
 
                if (sSortOrder !== coreLibrary.SortOrder.None) {
                    oState.Sorter.push({
                        key: sAffectedProperty,
                        descending: sSortOrder === coreLibrary.SortOrder.Descending
                    });
                }
 
                Engine.getInstance().applyState(oTable, oState);
            });
        },
 
        onGroup: function(oEvt) {
            var oGroupItem = oEvt.getParameter("item");
            var oTable = this.byId("idEmployeeTable");
            var sAffectedProperty = oGroupItem.getKey();
 
            Engine.getInstance().retrieveState(oTable).then(function(oState) {
                oState.Groups.forEach(function(oGroup) {
                    oGroup.grouped = false;
                });
 
                if (oGroupItem.getGrouped()) {
                    oState.Groups.push({
                        key: sAffectedProperty
                    });
                }
 
                Engine.getInstance().applyState(oTable, oState);
            });
        },
 
        onColumnMove: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            var oDraggedColumn = oEvt.getParameter("draggedControl");
            var oDroppedColumn = oEvt.getParameter("droppedControl");

            if (oDraggedColumn === oDroppedColumn) {
                return;
            }

            var sDropPosition = oEvt.getParameter("dropPosition");
            var iDraggedIndex = oTable.indexOfColumn(oDraggedColumn);
            var iDroppedIndex = oTable.indexOfColumn(oDroppedColumn);
            var iNewPos = iDroppedIndex + (sDropPosition === "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
            var sKey = oDraggedColumn.getId();

            Engine.getInstance().retrieveState(oTable).then(function(oState) {
                var oCol = oState.Columns.find(function(oColumn) {
                    return oColumn.key === sKey;
                }) || { key: sKey };
                oCol.position = iNewPos;

                Engine.getInstance().applyState(oTable, { Columns: [oCol] });
            });
        },

        onColumnResize: function(oEvt) {
            var oTable = this.byId("idEmployeeTable");
            var oColumn = oEvt.getParameter("column");
            var sWidth = oEvt.getParameter("width");
        
            var oColumnState = {};
            oColumnState[oColumn.getId()] = sWidth;
        
            Engine.getInstance().applyState(oTable, { ColumnWidth: oColumnState });
        }
    });
});