//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const { name } = require("ejs");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://greenarro730_db_user:FtDKk2yECM4ugUWz@cluster0.yd9jrod.mongodb.net/todolistDB');
}

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = {
  name: 'Welcome to your To-Do List.'
};

const item2 = {
  name: 'Hit the + button to add a new item.'
};

const item3 = {
  name: '<-- Hit this to delete an item.'
};

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  list: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.get("/", async function (req, res) {
  const foundItems = await Item.find({});

  if (foundItems.length === 0) {
    await Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  };
});

app.post("/", async function (req, res) {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({ name: itemName });

    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.list.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        res.redirect("/"); // fallback if list not found
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});


app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    await Item.findByIdAndDelete(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({ name: listName }, { $pull: { list: { _id: checkedItemId } } });
    res.redirect("/" + listName);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  let foundList = await List.findOne({ name: customListName });

  if (!foundList) {
    const list = new List({
      name: customListName,
      list: defaultItems
    });
    await list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", { listTitle: foundList.name, newListItems: foundList.list });
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
