/*global Backbone */
var app = app || {};

(function () {
    app.Netc = Backbone.Model.extend ({
        defaults: {
            title: '',
            meta: 900,
            completed: false,

        },
        toggle: function() {
            this.save({
                completed: !this.get('completed')
            });
        },
        initialize: function () {

            console.log('Nettitle model initialized');

        }

    })
})();