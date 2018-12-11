/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
    'use strict';
    app.AppView = Backbone.View.extend({
        //adding template
        todoTpl: _.template( $('#item-template').html()),
        el: '#todoapp',
        events: {'blur input.creating':'create'},

        create: function (ev) {
            if (this.$input.val().trim() != '') {
                app.Netc.create({
                    //no id needed - it will be returned from server db
                    // id:app.Netc.nextOrder(),
                    title: this.$input.val(),
                });
                this.$input.val('');
            }
        },

        initialize: function () {
            this.$input = this.$('#new-todo');
            this.listenTo(app.Netc, 'add', this.addOne);
            this.listenTo(app.Netc, 'reset', this.addAll);
            //initialising - fetching data from server and starting to polling

            // this.startpolling(app.Netc.fetch({
            //
            //     success: function (collection, response, options) {
            //
            //         //options.xhr.getAllResponseHeaders(); // To get all the headers
            //         // console.log('header ->>',options.xhr.getResponseHeader('ETag')); // To get just one needed header
            //         // console.log('headers ->>',options.xhr.getAllResponseHeaders()); // To get just one needed header
            //
            //     }
            // }))
        },

        startpolling: async function () {
               //fetchOK handler
                function fetchOK(url, options) {
                    return fetch(url, options).then(response => {
                        if (response.status < 400) return response;
                        else throw new Error(response.statusText);
                    });
                }
                let tag = 0;
                for (;;) {
                    let response;
                    try {
                        //
                        //console.log(tag)
                        response = await fetchOK("/restapi/up", {
                            headers: tag && {"If-None-Match": tag,
                                "Prefer": "wait=90"}
                        });
                    } catch (e) {
                        console.log("Request failed: " + e);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        continue;
                    }
                    console.log(response);
                    if (response.status == 304) continue;
                    tag = response.headers.get("ETag");
                    app.Netc.fetch();
                }
            },

        ///rendering newly arrived elements (applying to DOM one-by-one)
        addOne: function( elem ) {
            console.log('addone',elem);
            //data arrived to client
            var view = new app.ItemsView({model:elem});
            //appending view.el to document
            $('#todoapp').append( view.render().el );

            },

        // // Add all items in the **Todos** collection at once.
        addAll: function() {
            console.log('addAll');
            $('#todoapp').html('');
            app.Netc.each(this.addOne, this);
        },

    })

})(jQuery);

(function () {
    app.ItemsView = Backbone.View.extend({
        tmpl: _.template($('#item-template').html()),

        tagName: 'div',
        events: {
            'blur input.edit':'close',
            'click button.destroy':'clear',
            'dblclick label': 'edit',
            'click input.toggle': 'toggle',
            'keypress .edit': 'updateOnEnter',

        },
        edit: function (ev) {
            this.$el.addClass('editing');
             console.log('edit',this.$el);
            this.$input.focus();
        },
        toggle: function (ev) {
            this.model.toggle()
        },
        clear: function(ev){

            this.model.destroy()
        },
        close: function (ev) {
            let target=ev.originalEvent.relatedTarget || 0;
            //checking whether we clicked in hidden section
            if(target.className == ev.target.className)
                return;
            let deleted = target.className == 'destroy';
            if(deleted){
                this.clear(ev)
            }
            //closing
            this.$el.removeClass('editing');
            if(this.$input.val() || this.$tododate.val() && !deleted){
                this.model.save({title:this.$input.val(), todoDate:this.$tododate.val()})
            }
        },

        initialize:  function(){
            console.log('ItemsView view initialized',this.model);
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
       },
        //on-demand rendering
        render: function() {
            this.$el.html(this.tmpl(this.model.attributes));
            this.$input = this.$el.find('input#todoediting');
            this.$tododate = this.$el.find('input#tododate');
            this.$toggler = this.$el.find('input.toggle');
            return this;
        },

})
})(jQuery);
