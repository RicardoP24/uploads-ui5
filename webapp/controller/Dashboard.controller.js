sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/BusyDialog",
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    storage,
    BusyDialog,
    Dialog,
    Button
  ) {
    "use strict";

    return Controller.extend("upload.system.controller.Dashboard", {
      onInit: function () {
        // Initialize model
        var oFileModel = new JSONModel({
          files: [], // Empty array initially
        });
        this.getView().setModel(oFileModel);

        var oData = {
          caminho: "C:\\Users\\isr-rsilva\\Documents\\uploads",
        };
        const model = new JSONModel({ folders: [], caminho: oData });
        this.getView().setModel(model);

        // Load root directories
        this.loadFolders(
          "C:\\Users\\isr-rsilva\\Documents\\uploads",
          model.getData().folders
        );

        this._userModel = this.getOwnerComponent().getModel("user");
      },

      onFileSelected: function (oEvent) {
        const oFileUploader = oEvent.getSource();
        const aFiles = oFileUploader.mProperties.value;
        //partir a string dos nomes dos ficheiros em arrays
        const result = aFiles
          .match(/"([^"]+)"/g)
          .map((s) => s.replace(/"/g, ""));

        if (result.length > 0) {
          for (let index = 0; index < result.length; index++) {
            const oFile = aFiles[index];
            console.log("Selected file: " + oFile);
            // Additional logic to handle the selected file
          }
        } else {
          MessageToast.show("No file selected.");
        }
      },

      onViewPress: function (oEvent) {
        // Get the clicked row item
        var oItem = oEvent.getSource().getParent(); // The ColumnListItem
        var oContext = oItem.getBindingContext();
        var fileData = oContext.getObject(); // File data from the context of the row

        // Check if the file data contains a download URL
        if (fileData && fileData.download_url) {
          // Open the file's download URL in a new tab
          window.open(fileData.download_url, "_blank");
        } else {
          sap.m.MessageToast.show("Download URL is not available.");
        }
      },

      onUploadPress: function () {
        var oFileUploader = this.getView().byId("fileUploader");

        // Get the input DOM element
        const inputEl = oFileUploader.getDomRef("fu");
        const aFiles = inputEl?.files || [];

        if (aFiles.length === 0) {
          sap.m.MessageToast.show("No files selected.");
          return;
        }

        // Create busy dialog if not yet created
        if (!this._oBusyDialog) {
          this._oBusyDialog = new sap.m.BusyDialog({
            text: "Uploading files, please wait...",
          });
          this.getView().addDependent(this._oBusyDialog);
        }

        var oFormData = new FormData();
        Array.from(aFiles).forEach(function (oFile) {
          oFormData.append("files[]", oFile, oFile.name);
        });

        this._oBusyDialog.open();

        fetch("http://localhost:8000/public/index.php/api/upload", {
          method: "POST",
          body: oFormData,
        })
          .then((response) => {
            this._oBusyDialog.close();
            if (!response.ok) {
              throw new Error("Upload failed with status: " + response.status);
            }
            return response.json();
          })
          .then((data) => {
            sap.m.MessageToast.show("File uploaded successfully.");
            // Additional success handling if needed
          })
          .catch((error) => {
            this._oBusyDialog.close();
            sap.m.MessageToast.show("File upload failed: " + error.message);
            // Additional error handling if needed
          });
      },

      onUploadComplete: function () {
        // Placeholder for real upload logic
        MessageToast.show("Upload complete");
      },

      onDeletePress: function (oEvent) {
        const oItem = oEvent.getSource().getParent().getParent(); // Get the ColumnListItem
        const oContext = oItem.getBindingContext();
        const file = oContext.getObject();

        if (!file) {
          MessageToast.show("Missing file information.");
          return;
        }
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

      onItemPress: function (oEvent) {
 
        var oItem = oEvent.getParameter("listItem");
        var oContext = oItem.getBindingContext();
        var oData = oContext.getObject();

        if (oData.isDirectory) {
          // Update the binding of the List to show the contents of the selected folder
          var oList = this.byId("directoryList");
          oList.bindItems({
            path: oContext.getPath() + "/children",
            template: oItem.clone(),
          });

          this.addFolderBreadcrumbs(oData.name);
        } else {
          // Handle file selection (e.g., open the file or show details)
          sap.m.MessageToast.show("Selected file: " + oData.name);
        }
      },

      onBackPress: function () {
        var breadcrumb = this.getView().byId("breadcrumbs");

        if (
          breadcrumb.getText() == "C:\\Users\\isr-rsilva\\Documents\\uploads"
        ) {
          return;
        }

        var oList = this.byId("directoryList");
        var sCurrentPath = oList.getBinding("items").getPath();

        // Remove the last two segments to navigate up two levels
        var sParentPath = sCurrentPath.substring(
          0,
          sCurrentPath.lastIndexOf("/", sCurrentPath.lastIndexOf("/") - 1)
        );

        // Bind the list to the new parent path
        oList.bindItems({
          path: sParentPath,
          template: oList.getBindingInfo("items").template.clone(),
        });

        this.removeFolderBreadcrumbs();
      },

      onDownloadPress: function (oEvent) {
        var oItem = oEvent.getParameter("listItem");
        var oContext = oItem.getBindingContext();
        var oData = oContext.getObject();
        // Construct the URL to the server-side script that serves the file
        const url = `http://localhost:8000/public/index.php/api/download.php?filePath=${encodeURIComponent(
          filePath
        )}`;

        fetch(url, {
          method: "GET",
          headers: {
            // Add any necessary headers here
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Server responded with status ${response.status}`
              );
            }
            // Extract the filename from the Content-Disposition header
            const disposition = response.headers.get("Content-Disposition");
            let filename = "downloaded_file";
            if (disposition && disposition.indexOf("attachment") !== -1) {
              const matches = /filename="([^"]*)"/.exec(disposition);
              if (matches != null && matches[1]) filename = matches[1];
            }
            return response.blob().then((blob) => ({ filename, blob }));
          })
          .then(({ filename, blob }) => {
            // Create a link element
            const link = document.createElement("a");
            // Create a URL for the Blob and set it as the href attribute
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            // Set the download attribute with the filename
            link.download = filename;
            // Append the link to the body
            document.body.appendChild(link);
            // Programmatically click the link to trigger the download
            link.click();
            // Remove the link from the document
            document.body.removeChild(link);
            // Release the Blob URL
            window.URL.revokeObjectURL(url);
          })
          .catch((error) => {
            console.error("Error downloading the file:", error);
          });
      },

      addFolderBreadcrumbs: function (foldername) {
        // Obtenha o componente Text pelo ID
        var breadcrumb = this.getView().byId("breadcrumbs");
        if (breadcrumb) {
          // Defina o novo texto
          breadcrumb.setText(`${breadcrumb.getText()}\\${foldername}`);
        } else {
          console.error("Componente 'Text' não encontrado.");
        }
      },

      removeFolderBreadcrumbs: function () {
        // Obtenha o componente Text pelo ID
        var breadcrumb = this.getView().byId("breadcrumbs");
        if (breadcrumb) {
          // Defina o novo texto
          breadcrumb.setText(
            breadcrumb
              .getText()
              .substring(0, breadcrumb.getText().lastIndexOf("\\"))
          );
        } else {
          console.error("Componente 'Text' não encontrado.");
        }
      },
    });
  }
);
