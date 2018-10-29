/*global Backbone */
var app = app || {};

(function () {
    'use strict';

    // Todo Router
    // ----------
    var rRouter = Backbone.Router.extend({
        routes: {
            //'': 'index',
            'edit/:id':'edit'

        },

        edit: function (id) {
        $(document).ready(function(){
            $(`.toggled`).hide('slow');
            $(`.toggled[id=${id}]`)
            .toggle('slow')
        })},


        index: function () {
            console.log('index');
            alert('index best app')
        }
        // setFilter: function (param) {
        //     // Set the current filter to be used
        //     app.TodoFilter = param || '';
        //
        //     // Trigger a collection filter event, causing hiding/unhiding
        //     // of Todo view items
        //     //app.todos.trigger('filter');
        //}
    });
    app.oRouter = new rRouter();
    Backbone.history.start();
})();

