/*global Backbone */
var app = app || {};

(function () {
    'use strict';
    //
    // // Todo Collection
    // // ---------------
    //
    // // The collection of todos is backed by *localStorage* instead of a remote
    // // server.
    // var Todos = Backbone.Collection.extend({
    //     // Reference to this collection's model.
    //     model: app.Todo,
    //
    //     // Save all of the todo items under this example's namespace.
    //     // localStorage: new Backbone.LocalStorage('todos-backbone'),
    //
    //     // Filter down the list of all todo items that are finished.
    //     completed: function () {
    //         return this.where({completed: true});
    //     },
    //
    //     // Filter down the list to only todo items that are still not finished.
    //     remaining: function () {
    //         return this.where({completed: false});
    //     },
    //
    //     // We keep the Todos in sequential order, despite being saved by unordered
    //     // GUID in the database. This generates the next order number for new items.
    //     nextOrder: function () {
    //         return this.length ? this.last().get('order') + 1 : 1;
    //     },
    //
    //     // Todos are sorted by their original insertion order.
    //     comparator: 'order'
    // });
    //
    // // Create our global collection of **Todos**.
    // app.todos = new Todos();
    //
    // //// my net collection

    var NetCollection = Backbone.Collection.extend({
        model: app.Netm,
        url: '/restapi', //to fetch/manipulate collection

        comparator: function( todo ) {
            return todo.get('id');
        },
        //lets fetch before
        // nextOrder: function() {
        //     if ( !this.length ) {
        //         return 1;
        //     }
        //     return this.last().get('id') + 1;
        // },

        completed: function() {
            return this.filter(function( todo ) {
                return todo.get('completed');
            });
        },


    });
    //creating app collection based on server data
    app.Netc = new NetCollection();


})();
