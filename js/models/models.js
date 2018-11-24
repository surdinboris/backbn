/*global Backbone */
var app = app || {};

(function () {
    app.Netc = Backbone.Model.extend ({
        defaults: {
            title: '',
            meta: 900,
            completed: false,
            todoDate:0

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