/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function () {
    app.networkView = Backbone.View.extend({
        netTmpl: _.template($('#net-content').html()),
        //renderCounter:0,
        initialize: async function(){
            await this.fetchContent();
            //initial rendering
            this.render()
        },
        //on-demand rendering
        render: function(){
            this.$el.html('');
            this.collection = app.netcollect.toJSON();
            this.collection.forEach(netTemplateModel=> {
            //this.netTemplateModel = app.netcollect.get(0);
            //this.netTemplateModel.save();
            this.$el.append(this.netTmpl(netTemplateModel));
            this.$el.find('button').css('background-color', 'gold');
            this.$el.find(".destroy").on('click', this.removeFromAll);
            this.$el.find(".refresh").on('click', this.fetchContent);
            this.$el.find(".save").on('click', this.saveToAll);
            this.$el.find('p').css('background-color', 'beige');
            })
        },

        // events: {
        //     'click': 'fetchContent' },

        fetchContent: async function (e) {
            await  app.netcollect.fetch({
                type: 'GET',
                success: function(collection, response) {
                    _.each(collection.models, function(model) {
                        console.log('ok');
                    })
                },
                error: function (resp) {
                    console.log('error fetching',arguments)
                }
            });

        },

        removeFromAll: function(){
            //console.log('size before',app.netcollect.size());
            this.tobedeleted = app.netcollect.get(0);
            console.log(this.tobedeleted);
            //itsf failing due to no difference between two view objects that has
            //binded to same event listener
            this.fetchContent;
            //initial rendering
            this.render



        },

        saveToAll: function(e){
            console.log(e.id)
        }
})
})(jQuery);
//view for wonderful text

(function (){
    app.SubView = Backbone.View.extend({

        subTmpl: _.template($('#my-place').html()),

        initialize: function (col) {
            this.col=`#00${col}999`;
            this.subtlModeltest = new app.Subtl({subtitle:`wonderful text ${this.col}`});
            this.$el.append(this.subTmpl(this.subtlModeltest.attributes));
            this.$el.css("background-color",this.col);
            return this
        },
        events: {
            'click': 'fontZoomed',
            'dblclick ': 'fontUnZoomed'
        },
        fontZoomed: function (e) {
            //console.log(this.col)
            this.$('div').css("letter-spacing","4px")
            this.$('div').css("background-color","white")
        },
        fontUnZoomed: function (e) {
            this.$('div').css("letter-spacing","0px")
            this.$('div').css("background-color",this.col)
        }

    })})(jQuery);

//main view with subviews
(function ($) {
    'use strict';
    app.AppView = Backbone.View.extend({
        //adding template
        todoTpl: _.template( $('#item-template').html()),
        el: '.todoapp',
        initialize: function () {
          this.todoModeltest= new app.Todo({title:'Model',completed:true});
          //adding network view element
          this.$el.append(new app.networkView().el);

          //adding to-do  clolored  element
          //this.$el.append(this.todoTpl({title:this.todoModeltest.get('title'),completed:this.todoModeltest.get('completed')} ));
          this.views=[];
          for(var g=0; g < 9; g++){
            let view=new app.SubView(g).el;
            this.views.push(view);
            this.$el.append(view);
           }
          $('body').css({"background-image": "linear-gradient(to right, white, black"})
        }
    })

 })(jQuery);




//
// function old ($) {
//     'use strict';
//
//     // The Application
//     // ---------------
//
//     // Our overall **AppView** is the top-level piece of UI.
//     app.AppView = Backbone.View.extend({
//
//         // Instead of generating a new element, bind to the existing skeleton of
//         // the App already present in the HTML.
//         el: '.todoapp',
//
//         // Our template for the line of statistics at the bottom of the app.
//         statsTemplate: _.template($('#stats-template').html()),
//
//         // Delegated events for creating new items, and clearing completed ones.
//         events: {
//             'keypress .new-todo': 'createOnEnter',
//             'click .clear-completed': 'clearCompleted',
//             'click .toggle-all': 'toggleAllComplete'
//         },
//
//         // At initialization we bind to the relevant events on the `Todos`
//         // collection, when items are added or changed. Kick things off by
//         // loading any preexisting todos that might be saved in *localStorage*.
//         initialize: function () {
//             this.allCheckbox = this.$('.toggle-all')[0];
//             this.$input = this.$('.new-todo');
//             this.$footer = this.$('.footer');
//             this.$main = this.$('.main');
//             this.$list = $('.todo-list');
//
//             this.listenTo(app.todos, 'add', this.addOne);
//             this.listenTo(app.todos, 'reset', this.addAll);
//             this.listenTo(app.todos, 'change:completed', this.filterOne);
//             this.listenTo(app.todos, 'filter', this.filterAll);
//             this.listenTo(app.todos, 'all', _.debounce(this.render, 0));
//
//             // Suppresses 'add' events with {reset: true} and prevents the app view
//             // from being re-rendered for every model. Only renders when the 'reset'
//             // event is triggered at the end of the fetch.
//             app.todos.fetch({reset: true});
//         },
//
//         // Re-rendering the App just means refreshing the statistics -- the rest
//         // of the app doesn't change.
//         render: function () {
//             var completed = app.todos.completed().length;
//             var remaining = app.todos.remaining().length;
//
//             if (app.todos.length) {
//                 this.$main.show();
//                 this.$footer.show();
//
//                 this.$footer.html(this.statsTemplate({
//                     completed: completed,
//                     remaining: remaining
//                 }));
//
//                 this.$('.filters li a')
//                     .removeClass('selected')
//                     .filter('[href="#/' + (app.TodoFilter || '') + '"]')
//                     .addClass('selected');
//             } else {
//                 this.$main.hide();
//                 this.$footer.hide();
//             }
//
//             this.allCheckbox.checked = !remaining;
//         },
//
//         // Add a single todo item to the list by creating a view for it, and
//         // appending its element to the `<ul>`.
//         addOne: function (todo) {
//             var view = new app.TodoView({ model: todo });
//             this.$list.append(view.render().el);
//         },
//
//         // Add all items in the **Todos** collection at once.
//         addAll: function () {
//             this.$list.html('');
//             app.todos.each(this.addOne, this);
//         },
//
//         filterOne: function (todo) {
//             todo.trigger('visible');
//         },
//
//         filterAll: function () {
//             app.todos.each(this.filterOne, this);
//         },
//
//         // Generate the attributes for a new Todo item.
//         newAttributes: function () {
//             return {
//                 title: this.$input.val().trim(),
//                 order: app.todos.nextOrder(),
//                 completed: false
//             };
//         },
//
//         // If you hit return in the main input field, create new **Todo** model,
//         // persisting it to *localStorage*.
//         createOnEnter: function (e) {
//             if (e.which === ENTER_KEY && this.$input.val().trim()) {
//                 app.todos.create(this.newAttributes());
//                 this.$input.val('');
//             }
//         },
//
//         // Clear all completed todo items, destroying their models.
//         clearCompleted: function () {
//             _.invoke(app.todos.completed(), 'destroy');
//             return false;
//         },
//
//         toggleAllComplete: function () {
//             var completed = this.allCheckbox.checked;
//
//             app.todos.each(function (todo) {
//                 todo.save({
//                     completed: completed
//                 });
//             });
//         }
//     });
// }
// //(jQuery);