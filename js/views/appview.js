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
            console.log(view.render().el)
            $('#todo-list').append( view.render().el );

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
        netTmpl: _.template($('#item-template').html()),

//one initialization for all models ->>> own init for each model
        tagName: 'li',
        initialize:  function(){
            console.log('ItemsView view initialized');
            this.listenTo(this.model, 'change', this.render);
       },
        //on-demand rendering
        render: function() {
            console.log('rendering ',this.model.attributes );
            this.$el.html(this.netTmpl(this.model.attributes));
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
