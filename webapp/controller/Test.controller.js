sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  function (Controller, JSONModel) {
    "use strict";

    // Extend base Controller class to define custom controller logic
    var PageController = Controller.extend("upload.system.controller.Test", {
      // Called when the view is initialized
      onInit: function () {
        var oData = {
          caminho: "C:\\Users\\isr-rsilva\\Documents\\uploads",
        };

        this._navigationStack = []; // stack to keep track of parent paths

        const model = new JSONModel({
          folders: { Uploads: [] },
          caminho: oData,
        });

        this.getView().setModel(model);

        this.loadFolders(
          "C:\\Users\\isr-rsilva\\Documents\\uploads",
          model.getData().folders.Uploads
        );
      },

      loadFolders: function (path, targetArray) {
        fetch(
          "http://localhost:8000/public/index.php/api/getDirectories.php?path=" +
            encodeURIComponent(path)
        )
          .then((res) => res.json())
          .then((data) => {
            data.forEach((item) => targetArray.push(item));
            this.getView().getModel().refresh(true);
          });
      },

      onRowPress: function (oEvent) {
        var oItem = oEvent.getSource();
        var oContext = oItem.getBindingContext();
        var oData = oContext.getObject();

        if (oData.isDirectory) {
          var oTable = this.getView().byId("idFolderTable"); // replace with your actual Table ID
          var aItems = oTable.getItems();
          
          var aCurrentFiles = aItems.map(function (oItem) {
            return oItem.getBindingContext().getObject();
          });
          
            this._navigationStack.push(
              aCurrentFiles // 'idFolderTable' is your Table ID

            ); // push current view

          // Show the children in a new model or navigate to a new view
          var oChildrenModel = new sap.ui.model.json.JSONModel({
            folders: { Uploads: oData.children },
          });
          this.getView().byId("idFolderTable").setModel(oChildrenModel); // 'idFolderTable' is your Table ID
        }
      },

      onBackPress: function () {
        if (this._navigationStack.length > 0) {
          const prevData = this._navigationStack.pop(); // pop previous level
          const currentModel = new JSONModel({
            folders: { Uploads: prevData },
          });
          this.getView().byId("idFolderTable").setModel(currentModel);
        }
      },
    });

    return PageController;
  }
);
