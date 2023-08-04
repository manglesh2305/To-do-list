const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require("mongoose");

const app = express();

 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'ejs');

mongoose.connect("mongodb://127.0.0.1:27017/todolist", { useNewUrlParser: true });

const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your to-do list!"
});

const item2 = new Item({
    name: "Click the + button to add a new item."
});

const item3 = new Item({
    name: "<-- click this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);





app.get("/", (req, res) => {


    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added")
                }
            });
            res.redirect("/");
        }
        else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }

    })

});

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    }
    else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }




})

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        })
    }

})

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //console.log("Doesn't exist!");
                //Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName);
            }
            else {
                //console.log("Exists!");
                //Show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    })



})



app.listen(80, () => {
    console.log("Server is running at port 80");
});