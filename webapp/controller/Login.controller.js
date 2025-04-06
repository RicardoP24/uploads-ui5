sap.ui.define([
   "sap/ui/core/mvc/Controller",
   "sap/ui/model/json/JSONModel",
   "sap/m/MessageToast"
], function (Controller, MessageToast) {
   "use strict";

   return Controller.extend("upload.system.controller.Login", {
    onLogin: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        var user = this.getView().byId("inputUser").getValue();
        var pass = this.getView().byId("inputPassword").getValue();

        if (!user || !pass) {
            MessageToast.show("Preencha todos os campos!");
            return;
        }

        fetch("http://localhost:8000/public/index.php/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: user, password: pass })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // MessageToast.show("Login bem-sucedido!");
                let userModel = this.getOwnerComponent().getModel("user");
                userModel.setProperty("/isLoggedIn",true);
                userModel.setProperty("/data",data.user);

                oRouter.navTo("dashboard"); // Navega para a tela Home


            } else {
                // MessageToast.show(data.message);
                console.error(data);
            }
        })
        .catch(error => {
            // MessageToast.show(error);
            console.error(error);
        });
    }
   });
});
