sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel",
  ],
  (UIComponent, JSONModel) => {
    "use strict";

    return UIComponent.extend("upload.system.Component", {
      metadata: {
        manifest: "json",
      },

      init: function () {
        UIComponent.prototype.init.apply(this, arguments);
        let user = new JSONModel({
          isLoggedIn: false,
          data: {},
        });

        this.setModel(user, "user");

        this.getRouter().initialize();
    
      },
 
 
    });
  }
);
