sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
  ],
  function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    // Extend base Controller class to define custom controller logic
    var PageController = Controller.extend("upload.system.controller.Test", {
      // Called when the view is initialized
      onInit: function () {
        var oData = {
          caminho: "C:\\Users\\isr-rsilva\\Documents\\uploads",
        };

        this._navigationStack = []; // stack to keep track of parent paths
        this._selectedPaths = []; // stack to keep track of parent paths

        const model = new JSONModel({
          folders: { Uploads: [] },
          caminho: oData,
          systemActive: false, // Default state is OFF
        });

        this.getView().setModel(model);

        this.getView().setModel(
          new JSONModel({
            multiSelect: false, // Default to single select
            lastTapTime: 0,
            lastTapItem: null,
            selectedCount: 0,
          }),
          "viewModel"
        );

        this.byId("idFolderTable").setMode("SingleSelectMaster");

        this.loadFolders(
          "C:\\Users\\isr-rsilva\\Documents\\uploads",
          model.getData().folders.Uploads
        );
      },

      onToggleSelectMode: function (oEvent) {
        var oViewModel = this.getView().getModel("viewModel");
        if (!oViewModel.getData().multiSelect) {
          this._selectedPaths = [];
        }
      },

      onToggleChange: function (oEvent) {
        const bState = oEvent.getParameter("state");
        const oModel = this.getView().getModel();

        // Update the model value
        oModel.setProperty("/systemActive", bState);

        // Show feedback
        MessageToast.show(`Check Errors ${bState ? "ON" : "OFF"}`);

        // You can add additional logic here
      },

      /**
       * Resets/clears the FileUploader component
       */
      cleanFileUploader: function () {
        var oFileUploader = this.byId("fileUploader");

        if (!oFileUploader) {
          console.error("FileUploader not found");
          return;
        }

        // 1. Clear selected files
        oFileUploader.clear();

        // 2. Reset the internal file list
        oFileUploader.setValue("");

        // 3. Reset upload URL (if needed)
        oFileUploader.setUploadUrl("");

        // 4. Reset any custom properties
        oFileUploader.setEnabled(true);
        oFileUploader.setBusy(false);

        // 5. Reset validation state
        oFileUploader.setValueState("None");
        oFileUploader.setValueStateText("");

        // 6. Clear any internal files (for multiple upload)
        if (oFileUploader.getDomRef()) {
          var oInput = oFileUploader
            .getDomRef()
            .querySelector("input[type='file']");
          if (oInput) {
            oInput.value = ""; // This actually clears the file selection
          }
        }

        // Optional: Fire change event if needed
        // oFileUploader.fireChange();
      },

      onSelectionChangeTable: function (oEvent) {
        var oViewModel = this.getView().getModel("viewModel");

        if (!oViewModel.getData().multiSelect) {
          var oTable = this.byId("idFolderTable");
          var oSelectedItem = oTable.getSelectedItem();
          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          this.onRowPress(oData);
        } else {
          var oTable = this.byId("idFolderTable");
          var iSelectedCount = oTable.getSelectedItems();
          var sizeSelected = iSelectedCount.length;
          this._selectedPaths = oTable.getSelectedItems().map(function (oItem) {
            return oItem.getBindingContext().getObject().path;
          });
          oViewModel.setProperty("/selectedCount", sizeSelected);
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

      onRowPress: function (oData) {
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
        } else {
          

          if(oData.name.split('.')[1]==='php' || oData.name.split('.')[1]==='js' || oData.name.split('.')[1]==='cnf' || oData.name.split('.')[1]==='config' || oData.name.split('.')[1]==='log')
          this.previewFile(oData);
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

      checkErrors: async function (oFile) {
        return new Promise((resolve, reject) => {
          const oReader = new FileReader();

          oReader.onload = async (oEvent) => {
            const sFileContent = oEvent.target.result;

            try {
              // Wait for backend result
              const result = await this._sendCheckErrorToBackend(
                sFileContent,
                oFile.name
              );
              resolve(result); // You can return data or just resolve
            } catch (error) {
              MessageBox.error("Error checking PHP file: " + error.message);
              reject(true);
            }
          };

          oReader.onerror = () => {
            MessageBox.error("Error reading file");
            reject(true);
          };

          oReader.readAsText(oFile);
        });
      },

      onUploadPress: async function () {
        var oFileUploader = this.getView().byId("fileUploader");

        // Get the input DOM element
        const inputEl = oFileUploader.getDomRef("fu");
        const aFiles = inputEl?.files || [];

        if (aFiles.length === 0) {
          sap.m.MessageToast.show("No files selected.");
          return;
        }

        // Create busy dialog if not yet created

        var oFormData = new FormData();
        var isError;
        for (const oFile of Array.from(aFiles)) {
          const parts = oFile.name.split(".");
          const extension = parts.pop().toLowerCase();
          isError = false;
          var sdata = this.getView().getModel().getData().systemActive;
          if (sdata == true) {
            if (extension === "php") {
              try {
                isError = await this.checkErrors(oFile); // Wait for error check
              } catch (error) {
                console.error("Error in file:", oFile.name, error);
              }
            }
          }

          if (!isError) oFormData.append("files[]", oFile, oFile.name);
        }

        if (oFormData.entries().next().done) return;

        if (!this._oBusyDialog) {
          this._oBusyDialog = new sap.m.BusyDialog({
            text: "Uploading files, please wait...",
          });
          this.getView().addDependent(this._oBusyDialog);
        }

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
            var oTable = this.getView().byId("idFolderTable");
            var aItems = oTable.getItems();

            // Get current files from binding
            var aCurrentFiles = aItems.map(function (oItem) {
              return oItem.getBindingContext().getObject();
            });

            var i = 0;
            // Add new files (fixed variable name and push usage)
            Array.from(aFiles).forEach(function (file) {
              aCurrentFiles.push({
                name: file.name, // Make sure file has .name property
                path: data.uploadedFiles[i], // Handle if file is just a path string
                isDirectory: false,
                children: [],
              });

              i++;
            });

            // Create new JSON model
            var oModel = new sap.ui.model.json.JSONModel({
              folders: {
                Uploads: aCurrentFiles,
              },
            });

            // Set model to table
            oTable.setModel(oModel);
          })
          .catch((error) => {
            this._oBusyDialog.close();
            sap.m.MessageToast.show("File upload failed: " + error.message);
            // Additional error handling if needed
          })
          .finally(() => {
            this.cleanFileUploader();
          });
      },

      onDownloadPress: function (oEvent) {
        var oItem = oEvent.getSource();
        var oContext = oItem.getBindingContext();
        var oData = oContext.getObject();
        var filePath = oData.path;
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
            let filename = oData.name;
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

      previewFile: function (oData) {
        var filePath = oData.path;
        // Construct the URL to the server-side script that serves the file
        const url = `http://localhost:8000/public/index.php/api/previewFiles?filePath=${encodeURIComponent(
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
                "Server responded with status " + response.status
              );
            }
            return response.json();
          })
          .then((data) => {
            var oTable = this.byId("idFolderTable");
            oTable.removeSelections(); // Removes all selected rows

            if (data.success) {
              new sap.m.Dialog({
                title: data.filename,
                contentWidth: "80%",
                contentHeight: "60%",
                content: [
                  new sap.m.TextArea({
                    value: data.content,
                    editable: false,
                    width: "100%",
                    height: "100vh",
                  }),
                ],
                beginButton: new sap.m.Button({
                  text: "Close",
                  press: function () {
                    this.getParent().close();
                  },
                }),
              }).open();
            } else {
              throw new Error(`Server responded with status ${data}`);
            }
          });
      },

      onDelete: function (oEvent) {
        const oItem = oEvent.getSource().getParent().getParent();
        const oContext = oItem.getBindingContext();
        const oData = oContext.getObject();

        if (!oData || !oData.path) {
          return;
        }

        const filePath = encodeURIComponent(oData.path);

        // Confirm deletion
        MessageBox.confirm("Are you sure you want to delete this file?", {
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.YES) {
              fetch(
                `http://localhost:8000/public/index.php/api/deleteFile?filePath=${filePath}`,
                {
                  method: "DELETE",
                }
              )
                .then((response) => response.json())
                .then((data) => {
                  if (data.success) {
                    MessageToast.show("File deleted");
                    var oTable = this.getView().byId("idFolderTable"); // replace with your actual Table ID
                    var aItems = oTable.getItems();

                    var aCurrentFiles = aItems.map(function (oItem) {
                      return oItem.getBindingContext().getObject();
                    });

                    aCurrentFiles = aCurrentFiles.filter(
                      (file) => file.name !== oData.name
                    );

                    var CurrFiles = new sap.ui.model.json.JSONModel({
                      folders: { Uploads: aCurrentFiles },
                    });

                    this.getView().byId("idFolderTable").setModel(CurrFiles);

                    // Optionally, refresh model
                  } else {
                    MessageBox.error(data.message || "Delete failed");
                  }
                })
                .catch((error) => {
                  MessageBox.error("Error deleting file: " + error.message);
                });
            }
          }.bind(this),
        });
      },

      onDeleteMultipleFiles: function () {
        // Confirm deletion
        MessageBox.confirm(
          `Tem certeza que quer apagar ${this._selectedPaths.length} ficheiros?`,
          {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (oAction) {
              var apaths = this._selectedPaths;
              if (oAction === MessageBox.Action.YES) {
                fetch(
                  `http://localhost:8000/public/index.php/api/deleteSelectedItems`,
                  {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ paths: apaths }),
                  }
                )
                  .then((response) => response.json())
                  .then((data) => {
                    if (data.success) {
                      MessageToast.show("File deleted");
                      var oTable = this.getView().byId("idFolderTable"); // replace with your actual Table ID
                      var aItems = oTable.getItems();

                      var oViewModel = this.getView().getModel("viewModel");
                      oViewModel.setProperty("/selectedCount", 0);

                      var aCurrentFiles = aItems.map(function (oItem) {
                        return oItem.getBindingContext().getObject();
                      });

                      aCurrentFiles = aCurrentFiles.filter((file) => {
                        for (let i = 0; i < this._selectedPaths.length; i++) {
                          if (file.path === this._selectedPaths[i])
                            return false;
                        }
                        return true;
                      });

                      var CurrFiles = new sap.ui.model.json.JSONModel({
                        folders: { Uploads: aCurrentFiles },
                      });

                      this.getView().byId("idFolderTable").setModel(CurrFiles);

                      // Optionally, refresh model
                    } else {
                      MessageBox.error(data.message || "Delete failed");
                    }
                  })
                  .catch((error) => {
                    MessageBox.error("Error deleting file: " + error.message);
                  });
              }
            }.bind(this),
          }
        );
      },

      _sendCheckErrorToBackend: async function (sFileContent, sFileName) {
        const oFormData = new FormData();
        oFormData.append("file_content", sFileContent);
        oFormData.append("file_name", sFileName);

        try {
          const oResponse = await fetch(
            "http://localhost:8000/public/index.php/api/checkErrors",
            {
              method: "POST",
              body: oFormData,
            }
          );

          if (!oResponse.ok) {
            throw new Error("Network response was not ok");
          }

          const oData = await oResponse.json();

          if (oData.status === "error") {
            MessageBox.error(oData.output);
            return true;
          } else {
            MessageBox.success(oData.message, {
              title: "Nenhum Erro", // Optional title
              onClose: function () {
                // Optional callback when closed
              },
            });
            return false;
          }
        } catch (oError) {
          MessageBox.error(
            "Error communicating with server: " + oError.message
          );
          return true;
        }
      },
    });

    return PageController;
  }
);
