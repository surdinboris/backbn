/*global Backbone */
var app = app || {};

(function () {
    app.Netm = Backbone.Model.extend ({
        defaults: {
            title: '',
            meta: 900,
            completed: false,
            todoDate:0

        },
        url: '/restapi',
        toggle: function() {
            this.save({
                completed: !this.get('completed')
            });
        },
        initialize: function () {

            console.log('Netm initialized', this);

        },
        parse: function( response ) {
            response.id = response._id;
            return response;
        }

    })
})();