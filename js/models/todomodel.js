/*global Backbone */
var app = app || {};

(function () {
    'use strict';

    // Todo Model
    // ----------

    // Our basic **Todo** model has `title`, `order`, and `completed` attributes.
    app.Todo = Backbone.Model.extend({
        // Default attributes for the todo
        // and ensure that each todo created has `title` and `completed` keys.
        initialize: function () {
            console.log('new model was initialized: ', this.defaults.title, this.defaults.completed)
            console.log('bind',this.bind())
        },
        defaults: {
            title: '',
            completed: false
        },

        // Toggle the `completed` state of this todo item.
        toggle: function () {
            this.save({
                completed: !this.get('completed')
            });
        }
    });
})();

(function () {
    app.Subtl = Backbone.Model.extend ({
        defaults: {
            subtitle: '',
            meta: 0
        },
        initialize: function () {
            console.log('Subtitle model initialized');

        }

    })
})();