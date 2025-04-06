sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "../firebase",
    "sap/m/BusyDialog",
  ],
  function (Controller, JSONModel, MessageToast, storage, BusyDialog, Dialog,Button) {
    "use strict";

    return Controller.extend("upload.system.controller.Dashboard", {
      onInit: function () {
        // Initialize model
        var oFileModel = new JSONModel({
          files: [], // Empty array initially
        });
        this.getView().setModel(oFileModel);

        this._userModel = this.getOwnerComponent().getModel("user");
        this.onFetchUserFiles();
      },

      onFileSelected: function (oEvent) {
        const oFileUploader = oEvent.getSource();
        const aFiles = oFileUploader.mProperties.value;
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

        this._oBusyDialog.open();

        const storageRef = firebase.storage().ref();
        const uploadPromises = [];

        // Upload each file and push the promise
        Array.from(aFiles).forEach((file) => {
          const fileRef = storageRef.child("uploads/" + file.name);
          const uploadTask = fileRef.put(file);

          const p = new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
              (error) => reject({ file, error }),
              () => {
                uploadTask.snapshot.ref.getDownloadURL().then((url) => {
                  resolve({ file, url });
                });
              }
            );
          });

          uploadPromises.push(p);
        });

        // Handle all uploads
        Promise.allSettled(uploadPromises).then((results) => {
          // ✅ Close the BusyDialog after all uploads are finished
          this._oBusyDialog.close();

          const success = results.filter((r) => r.status === "fulfilled");
          const failed = results.filter((r) => r.status === "rejected");

          if (success.length > 0) {
            sap.m.MessageToast.show(
              success.length + " file(s) uploaded successfully."
            );
            success.forEach((result) => {
              const { file, url } = result.value;

              // Prepare data for the backend API
              const fileMetadata = {
                userId: this._userModel.getProperty("/data/id"), // Example userId, replace with actual userId
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                storagePath: "uploads/" + file.name, // Path in Firebase Storage
                download_url: url, // URL of the uploaded file
              };

              // Make the fetch request to backend to save file metadata
              fetch("http://localhost:8000/public/index.php/api/upload", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(fileMetadata),
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.success) {
                    this.onFetchUserFiles();

                    console.log("File metadata saved successfully:", data);
                  } else {
                    console.error(
                      "Failed to save file metadata:",
                      data.message
                    );
                  }
                })
                .catch((error) => {
                  console.error("Error in sending metadata to backend:", error);
                });
            });
          }

          if (failed.length > 0) {
            console.error("Some uploads failed:", failed);
            sap.m.MessageBox.error(
              failed.length + " file(s) failed to upload."
            );
          }
        });
      },

      onUploadComplete: function () {
        // Placeholder for real upload logic
        MessageToast.show("Upload complete");
      },

      onFetchUserFiles: function () {
        // Get the userId from the model or session (as an example)
        var userId = this.getOwnerComponent()
          .getModel("user")
          .getProperty("/data/id");

        if (!userId) {
          MessageToast.show("User ID is missing.");
          return;
        }

        // Prepare the request data
        var requestData = {
          userId: userId,
        };

        // Perform the fetch request to get user files
        fetch("http://localhost:8000/public/index.php/api/getFiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData), // Convert the request data to JSON
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch files.");
            }
            return response.json();
          })
          .then((data) => {
            // Handle successful response
            if (data.success) {
              MessageToast.show(data.files.length + " file(s) found.");
              console.log("User files:", data.files);
              this.getView().getModel().setProperty("/files", data.files);
              // You can update your UI with the files here
            } else {
              MessageToast.show(data.message || "No files found.");
            }
          })
          .catch((error) => {
            // Handle any errors that occur during the fetch
            MessageToast.show("Error: " + error.message);
          });
      },

      onDeletePress: function (oEvent) {
        const oItem = oEvent.getSource().getParent().getParent(); // Get the ColumnListItem
        const oContext = oItem.getBindingContext();
        const file = oContext.getObject();

        const fileMetadata = {
          fileId: file.id,
          userId: this._userModel.getProperty("/data/id"), // Example userId, replace with actual userId
          fileName: file.file_name,
          fileSize: file.file_size,
          fileType: file.file_type,
          storagePath: file.storage_path, // Path in Firebase Storage
          download_url: file.download_url, // URL of the uploaded file
        };

        if (!file) {
          MessageToast.show("Missing file information.");
          return;
        }

              // Show a busy dialog during the deletion process
              var oBusyDialog = new sap.m.BusyDialog({
                text: "Deleting file, please wait...",
              });
              this.getView().addDependent(oBusyDialog);
              oBusyDialog.open();
              var storageRef = firebase.storage().ref();
              var fileRef = storageRef.child(fileMetadata.storagePath);

              fileRef
                .delete()
                .then(function () {
                  // Delete metadata from backend
                  return fetch(
                    "http://localhost:8000/public/index.php/api/deleteFile",
                    {
                      method: "POST",
                      body: JSON.stringify(fileMetadata), // Pass the fileId in the request body
                      headers: {
                        "Content-Type": "application/json",
                      },
                    }
                  );
                })
                .then(function (response) {
                  if (!response.ok) throw new Error("Backend deletion failed.");
                  return response.json();
                })
                .then(
                  function (data) {
                    if (data.success) {
                      // Remove item from model
                      var oModel = this.getView().getModel();
                      var aFiles = oModel.getProperty("/files") || [];
                      const fileId=data.fileId

                      aFiles = aFiles.filter(function (file) {
                        return file.id !== fileId;
                      });
                      oModel.setProperty("/files", aFiles);

                      MessageToast.show("File deleted successfully.");
                    } else {
                      throw new Error(
                        data.message || "Failed to delete file metadata."
                      );
                    }
                  }.bind(this)
                )
                .catch(function (error) {
                  console.error("Delete error:", error);
                })
                .finally(function () {
                  oBusyDialog.close();
                });
            



      },

      onDownloadPress: function(oEvent){
        const oItem = oEvent.getSource().getParent().getParent(); // Get the ColumnListItem
        const oContext = oItem.getBindingContext();
        const file = oContext.getObject();

        fetch(file.download_url)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.target="_blank"
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Error downloading the file:', error));
      }
    });
  }
);
