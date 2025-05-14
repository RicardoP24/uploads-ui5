sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  function (Controller) {
    "use strict";

    // Extend base Controller class to define custom controller logic
    var PageController = Controller.extend("upload.system.controller.Main", {
      onInit: function () {
        
        this._fragments = {};
        this._loadFragment("maintable"); // Load the first fragment initially
        const currentFormatted = this._formatCurrentDateTime();

        const oData = {
          Codes: [
            { code: "ARTTIP", table: "Customers" },
            { code: "COMP", table: "Products" },
            { code: "ENTI", table: "Sales Orders" },
          ],
          CodesTables: [
            { sapCode: "SAP001", wpmsCode: "WP001", variableRatio: "1.5" },
            { sapCode: "SAP002", wpmsCode: "WP002", variableRatio: "2.0" },
            { sapCode: "SAP003", wpmsCode: "WP003", variableRatio: "0.8" },
          ],
          isEditing: false,
          editBuffer: {}, // <--- buffer for dialog input
          selectedArticleName: "",
          selectedRowPath: "",
          logs: {
            de: 0,
            a: 999999999999999,
            inicio: currentFormatted, // ISO format required for DateTimePicker
            fim: currentFormatted,
          },
        };

        const oModel = new sap.ui.model.json.JSONModel(oData);
        this.getView().setModel(oModel);
      },
      _formatCurrentDateTime: function () {
        const oDate = new Date();
        const pad = (n) => (n < 10 ? "0" + n : n);

        const day = pad(oDate.getDate());
        const month = pad(oDate.getMonth() + 1);
        const year = oDate.getFullYear();

        const hours = pad(oDate.getHours());
        const minutes = pad(oDate.getMinutes());
        const seconds = pad(oDate.getSeconds());

        return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
      },

      // Handle row click in FolderTable
      onRowPress: function (oEvent) {
        // Example: switch to the second table fragment
        const oListItem = oEvent.getParameter("listItem");
        const oCtx = oListItem.getBindingContext();
        const oData = oCtx.getObject();
        const sPath = oCtx.getPath();

        const oModel = this.getView().getModel();
        if (oData.sapCode) oModel.setProperty("/selectedRowPath", sPath);

        this.getView()
          .getModel()
          .setProperty(
            "/selectedArticleName",
            `Tipo de Artigo - ${oData.code || oData.name}`
          );

        this._loadFragment("codestables");
      },
      onRowPressCodeTable: function (oEvent) {
        // Example: switch to the second table fragment
        const oListItem = oEvent.getParameter("listItem");
        const oCtx = oListItem.getBindingContext();
        const sPath = oCtx.getPath();

        const oModel = this.getView().getModel();
        oModel.setProperty("/selectedRowPath", sPath);
      },

      _loadFragment: function (key) {
        if (!this._fragments) {
          this._fragments = {};
        }

        const container = this.byId("fragmentContainer");
        container.removeAllItems();

        const view = this.getView();
        let fragmentName = "";

        switch (key) {
          case "maintable":
            fragmentName = "upload.system.view.MainTable";
            break;

          case "codestables":
            fragmentName = "upload.system.view.CodeTable";
            break;

          case "verlogs":
            fragmentName = "upload.system.view.VerLogs";
            break;
        }

        if (!this._fragments[key]) {
          sap.ui.core.Fragment.load({
            id: view.getId(),
            name: fragmentName,
            controller: this,
          }).then((oFragment) => {
            this._fragments[key] = oFragment;

            const oTable = this.byId("idCodesTable"); // table ID inside the fragment

            if (oTable) {
              oTable.attachItemPress(this.onRowPressCodeTable, this);
            }
            container.addItem(oFragment);
          });
        } else {
          container.addItem(this._fragments[key]);
        }
      },

      onBackPress: function () {
        // Load first fragment again
        this.getView().getModel().setProperty("/selectedArticleName", "");
        this.getView().getModel().setProperty("/selectedRowPath", "");

        this._loadFragment("maintable");
      },

      onOpenMenu: function (oEvent) {
        if (!this._oMenu) {
          this._oMenu = new sap.m.Menu({
            items: [
              new sap.m.MenuItem({
                text: "Tabela Códigos",
                icon: "sap-icon://appointment-2",
                press: () => {
                  this._loadFragment("maintable");
                },
              }),
              new sap.m.MenuItem({
                text: "Ver Logs",
                icon: "sap-icon://employee",
                press: () => {
                  this._loadFragment("verlogs");
                },
              }),
            ],
          });
        }
        this._oMenu.openBy(oEvent.getSource());
      },

      onEditPress: function () {
        const oModel = this.getView().getModel();
        const sPath = oModel.getProperty("/selectedRowPath");

        if (!sPath || sPath == "") {
          sap.m.MessageToast.show("Please select a row first.");
          return;
        }

        // Store current values in a temporary buffer
        const rowData = Object.assign({}, oModel.getProperty(sPath));
        oModel.setProperty("/editBuffer", rowData);

        // Load dialog fragment
        if (!this._pEditDialog) {
          this._pEditDialog = sap.ui.core.Fragment.load({
            id: this.getView().getId(), // <--- this is critical!
            name: "upload.system.view.EditDialog",
            controller: this,
          }).then((oDialog) => {
            this.getView().addDependent(oDialog);
            return oDialog;
          });
        }

        this._pEditDialog.then(function (oDialog) {
          oDialog.open();
        });
      },

      onEditDialogSave: function () {
        const oModel = this.getView().getModel();
        const sPath = oModel.getProperty("/selectedRowPath");
        const oEditedData = oModel.getProperty("/editBuffer");

        if (sPath && oEditedData) {
          oModel.setProperty(sPath + "/wpmsCode", oEditedData.wpmsCode);
          oModel.setProperty(
            sPath + "/variableRatio",
            oEditedData.variableRatio
          );
        }

        this.byId("editDialog").close();
        sap.m.MessageToast.show("Row updated.");
      },

      onEditDialogCancel: function () {
        this.byId("editDialog").close();
      },
    });

    return PageController;
  }
);
