/*global Backbone */
var app = app || {};

(function () {
    app.Netc = Backbone.Model.extend ({
        defaults: {
            title: '',
            meta: 0,
            completed: 0,

        },
        initialize: function () {

            console.log('Nettitle model initialized');

        }

    })
})();