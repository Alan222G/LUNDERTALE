// item.js — Item class for LUNDERTALE
var Item = function(name, description, healAmount, useText, action) {
    this.name = name;
    this.description = description;
    this.healAmount = healAmount;
    this.useText = useText;         // Text displayed when item is used
    this.action = action || function() { Player.heal(healAmount); };
};

// Perform the item's action
Item.prototype.activate = function() {
    this.action();
};

// Get the use text (supports function for dynamic text)
Item.prototype.getText = function() {
    if (typeof this.useText === 'function') return this.useText();
    return this.useText;
};
