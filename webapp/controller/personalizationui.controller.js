sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/m/p13n/Engine',
	'sap/m/p13n/SelectionController',
	'sap/m/p13n/SortController',
	'sap/m/p13n/GroupController',
	'sap/m/p13n/MetadataHelper',
	'sap/ui/model/Sorter',
	'sap/ui/core/library',
	'sap/m/table/ColumnWidthController'
], function(Controller, JSONModel, Engine, SelectionController, SortController, GroupController, MetadataHelper, Sorter, CoreLibrary, ColumnWidthController) {
	"use strict";

	return Controller.extend("com.personalization.ui.tablepersonalizationui.controller.personalizationui", {

		onInit: function() {
			const oData = {
                employees: [
                    {
                        EmployeeID: "E001",
                        Name: "John Doe",
                        Department: "HR",
                        Location: "New York",
                        Email: "john.doe@example.com",
                        Phone: "123-456-7890",
                        Title: "Manager",
                        Status: "Active",
                        Salary: "100,000",
                        JoiningDate: "2020-01-01",
                        Experience: "5",
                        Skills: "Leadership",
                        Projects: "Project A",
                        Performance: "Excellent",
                        Age: "30",
                        Gender: "Male",
                        MaritalStatus: "Single",
                        Education: "MBA",
                        Certifications: "PMP",
                        Languages: "English"
                    }
                ]
            };

			var oModel = new JSONModel(oData);

			this.getView().setModel(oModel);

			this._registerForP13n();
		},

		_registerForP13n: function() {
			var oTable = this.byId("idEmployeeTable");

            this.oMetadataHelper = new MetadataHelper([
                { key: "EmployeeID", label: "Employee ID", path: "EmployeeID" },
                { key: "Name", label: "Name", path: "Name" },
                { key: "Department", label: "Department", path: "Department" },
                { key: "Location", label: "Location", path: "Location" },
                { key: "Email", label: "Email", path: "Email" },
                { key: "Phone", label: "Phone", path: "Phone" },
                { key: "Title", label: "Title", path: "Title" },
                { key: "Status", label: "Status", path: "Status" },
                { key: "Salary", label: "Salary", path: "Salary" },
                { key: "JoiningDate", label: "JoiningDate", path: "JoiningDate" },
                { key: "Experience", label: "Experience", path: "Experience" },
                { key: "Skills", label: "Skills", path: "Skills" },
                { key: "Projects", label: "Projects", path: "Projects" },
                { key: "Performance", label: "Performance", path: "Performance" },
                { key: "Age", label: "Age", path: "Age" },
                { key: "Gender", label: "Gender", path: "Gender" },
                { key: "MaritalStatus", label: "MaritalStatus", path: "MaritalStatus" },
                { key: "Education", label: "Education", path: "Education" },
                { key: "Certifications", label: "Certifications", path: "Certifications" },
                { key: "Languages", label: "Languages", path: "Languages" }
            ]);

			this._mIntialWidth = {
				"EmployeeID": "11rem",
				"Name": "11rem",
				"Department": "11rem",
				"Location": "11rem",
                "Email": "11rem",
                "Phone": "11rem",
                "Title": "11rem",
                "Status": "11rem",
                "Salary": "11rem",
                "JoiningDate": "11rem",
                "Experience": "11rem",
                "Skills": "11rem",
                "Projects": "11rem",
                "Performance": "11rem",
                "Age": "11rem",
                "Gender": "11rem",
                "MaritalStatus": "11rem",
                "Education": "11rem",
                "Certifications": "11rem",
                "Languages": "11rem",
			};

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
					}),
					ColumnWidth: new ColumnWidthController({
						control: oTable
					})
				}
			});

			Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
		},

		onPersonalizePress: function(oEvt) {
			var oTable = this.byId("idEmployeeTable");

			Engine.getInstance().show(oTable, ["Columns", "Sorter"], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oEvt.getSource()
			});
		},

		onColumnHeaderItemPress: function(oEvt) {
			var oTable = this.byId("idEmployeeTable");
			var sPanel = oEvt.getSource().getIcon().indexOf("sort") >= 0 ? "Sorter" : "Columns";

			Engine.getInstance().show(oTable, [sPanel], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oTable
			});
		},

		onSort: function(oEvt) {
			var oTable = this.byId("idEmployeeTable");
			var sAffectedProperty = this._getKey(oEvt.getParameter("column"));
			var sSortOrder = oEvt.getParameter("sortOrder");

			//Apply the state programatically on sorting through the column menu
			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(oTable).then(function(oState){

				//2) Modify the existing personalization state --> clear all sorters before
				oState.Sorter.forEach(function(oSorter){
					oSorter.sorted = false;
				});
				oState.Sorter.push({
					key: sAffectedProperty,
					descending: sSortOrder === CoreLibrary.SortOrder.Descending
				});

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(oTable, oState);
			});
		},

		onColumnMove: function(oEvt) {
			var oTable = this.byId("idEmployeeTable");
			var oAffectedColumn = oEvt.getParameter("column");
			var iNewPos = oEvt.getParameter("newPos");
			var sKey = this._getKey(oAffectedColumn);
			oEvt.preventDefault();

			Engine.getInstance().retrieveState(oTable).then(function(oState){

				var oCol = oState.Columns.find(function(oColumn) {
					return oColumn.key === sKey;
				}) || {key: sKey};
				oCol.position = iNewPos;

				Engine.getInstance().applyState(oTable, {Columns: [oCol]});
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

			oTable.getColumns().forEach(function(oColumn){

				var sKey = this._getKey(oColumn);
				var sColumnWidth = oState.ColumnWidth[sKey];

				oColumn.setWidth(sColumnWidth || this._mIntialWidth[sKey]);

				oColumn.setVisible(false);
				oColumn.setSortOrder(CoreLibrary.SortOrder.None);
			}.bind(this));

			oState.Columns.forEach(function(oProp, iIndex){
				var oCol = this.byId(oProp.key);
				oCol.setVisible(true);

				oTable.removeColumn(oCol);
				oTable.insertColumn(oCol, iIndex);
			}.bind(this));

			var aSorter = [];
			oState.Sorter.forEach(function(oSorter) {
				var oColumn = this.byId(oSorter.key);
				/** @deprecated As of version 1.120 */
				oColumn.setSorted(true);
				oColumn.setSortOrder(oSorter.descending ? CoreLibrary.SortOrder.Descending : CoreLibrary.SortOrder.Ascending);
				aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
			}.bind(this));
			oTable.getBinding("rows").sort(aSorter);
		},

		onColumnResize: function(oEvt) {
			var oColumn = oEvt.getParameter("column");
			var sWidth = oEvt.getParameter("width");
			var oTable = this.byId("idEmployeeTable");

			var oColumnState = {};
			oColumnState[this._getKey(oColumn)] = sWidth;

			Engine.getInstance().applyState(oTable, {
				ColumnWidth: oColumnState
			});
		}
	});
});