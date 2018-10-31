/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
    'use strict';
    app.AppView = Backbone.View.extend({
        //adding template
        todoTpl: _.template( $('#item-template').html()),
        el: '.todoapp',
        initialize: function () {
            //adding network view element
            this.$el.append(new app.networkView().el);
        }
    })

})(jQuery);

(function () {
    app.networkView = Backbone.View.extend({
        netTmpl: _.template($('#net-content').html()),
        //renderCounter:0,
        events: {
            'click': 'clicked',
            'click .editButton': function (ev) {
                let id=ev.target.id;
                this.$el.find(`.toggled[id="${id}"]`).toggle('slow');
                //this.$el.find('.toggle')
            },
            "click .destroy": function (ev) {
                let id=$(ev.target).attr('id');
                //do whatever you want with id
                this.removeFromAll(id)
                app.oRouter.navigate("")
            },
            "click .refresh": function (ev) {
                //partial update?
                let id=$(ev.target).attr('id')
            },
            "click .save": function (ev) {
                let id=parseInt($(ev.target).attr('id'));
                let model=app.netcollect.get(id);
                model.save();
                //when typing - store text  in local model id  and save it
                // on server when sace is pressed
            },
            "focus .edit": function(ev){

                app.oRouter.navigate("edit/"+ev.target.id)

            },
            "keyup .edit": function (ev) {
                let id=parseInt($(ev.target).attr('id'));
                let text=$(ev.target).val();
                app.netcollect.set({id:id, nettitle: text})
            },
        },

        initialize:  function(){
           this.fetchContent().then(()=>{

            this.render()
        })
        },
        //on-demand rendering
        render: function(){
            this.$el.html('');
            //sorting:
            this.sorted = app.netcollect.sortBy(function (el) {
                return el.get('id')
            });
            this.sorted.forEach(netTemplateModel=> {
            this.$el.append(this.netTmpl(netTemplateModel.attributes));
            this.$el.find('.toggled').hide();
            this.$el.find('button').css('background-color', 'gold');
            this.$el.find('div').css('background-color', 'beige');
            })
        },
        fetchContent:  function (id) {
            //  await
            return new Promise(resolve =>
                {
            resolve(app.netcollect.fetch({
                type: 'GET',
                success: function(collection, response) {
                    _.each(collection.models, function(model) {
                        console.log('ok');
                    })
                },
                error: function (resp) {
                    console.log('error fetching',arguments)
                }
            }));

        })},
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
