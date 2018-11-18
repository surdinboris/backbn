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
            console.log('addAll');
            $('#todoapp').html('');
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
            'click input.toggle': 'toggle',
            'keypress .edit': 'updateOnEnter',
            'blur input.edit': 'close'

        },

        edit: function (ev) {

            this.$el.addClass('editing');
            console.log('edit',this.$el)
            this.$input.focus();
        },
        toggle: function (ev) {
            this.model.toggle()
        },
        close: function () {
            this.$el.removeClass('editing');
            if(this.$input.val()){
                this.model.save({title:this.$input.val()})
            }

        },

        initialize:  function(){
            console.log('ItemsView view initialized');
            this.listenTo(this.model, 'change', this.render);
       },
        //on-demand rendering
        render: function() {
            this.$el.html(this.tmpl(this.model.attributes));
            this.$input = this.$el.find('input.edit');
            this.$toggler = this.$el.find('input.toggle');
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
