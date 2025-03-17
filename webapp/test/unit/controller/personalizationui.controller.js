/*global QUnit*/

sap.ui.define([
	"compersonalizationui/tablepersonalizationui/controller/personalizationui.controller"
], function (Controller) {
	"use strict";

	QUnit.module("personalizationui Controller");

	QUnit.test("I should test the personalizationui controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
