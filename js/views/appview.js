/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
    'use strict';
    app.AppView = Backbone.View.extend({
        //adding template
        todoTpl: _.template( $('#item-template').html()),
        el: '#todoapp',
        initialize: function () {
            this.listenTo(app.Netc, 'add', this.addOne);
            this.listenTo(app.Netc, 'reset', this.addAll);
            app.Netc.fetch();
        },

        ///rendering newly arrived elements (applying to DOM one-by-one)
        addOne: function( elem ) {
            console.log('addone',elem);
            //data arrived to client
            var view = new app.ItemsView({model:elem});
            //appending view.el to document
            $('#todoapp').append( view.render().el );

            },

        // Add all items in the **Todos** collection at once.
        addAll: function() {
            this.$('#todo-list').html('');
            app.Todos.each(this.addOne, this);
        },

    })

})(jQuery);

(function () {
    app.ItemsView = Backbone.View.extend({
        tmpl: _.template($('#item-template').html()),
        tagName: 'div',
        events: {
            'dblclick label': 'edit',
            'keypress .edit': 'updateOnEnter',
            'blur .edit': 'close'
        },

        edit: function (ev) {
            console.log( this.$el.find('.edit'))
            this.$el.find('.edit').addClass('editing');
            this.$el.addClass('editing');
            this.$input.focus();
        },
        initialize:  function(){
            console.log('ItemsView view initialized');
            this.listenTo(this.model, 'change', this.render);
       },
        //on-demand rendering
        render: function() {
            this.$el.html(this.tmpl(this.model.attributes));
            this.$input = this.$('.edit');
            return this;
        },


        removeFromAll: function(id){
           this.tobedeleted = app.netcollect.get(id);
           this.tobedeleted.destroy();
           this.initialize()
        },

        saveToAll: function(e){
            console.log(e.id)
        }
})
})(jQuery);
