// inventory.js — Inventory module for LUNDERTALE
var Inventory = (function() {
    var items = [];

    function init() {
        items = [
            new Item("Cosmic Pie", "A pie that smells like stardust.", 99,
                "* You ate the Cosmic Pie.\n* Its warmth fills you with DETERMINATION.\n* Your HP was maxed out.",
                function() { Player.heal(Player.getHPMax()); }),
            new Item("Star Potion", "A glowing liquid that tastes like grapes.", 50,
                "* You drank the Star Potion.\n* You recovered 50 HP.",
                function() { Player.heal(50); }),
            new Item("Void Noodles", "Noodles made from dark energy.", 80,
                "* You ate the Void Noodles.\n* You recovered 80 HP.",
                function() { Player.heal(80); }),
            new Item("Nebula Fruit", "A glowing fruit from the void.", 20,
                "* You ate the Nebula Fruit.\n* You recovered 20 HP.",
                function() { Player.heal(20); }),
            new Item("Dark Matter", "Wait, are you supposed to eat this?", 100,
                "* You consumed the Dark Matter.\n* It was surprisingly delicious!\n* You recovered 100 HP.",
                function() { Player.heal(100); })
        ];
        itemsUsedCount = 0;
    }

    function getNames() {
        var names = [];
        for (var i = 0; i < items.length; i++) names.push(items[i].name);
        return names;
    }

    function getText(index) {
        if (typeof items[index].useText === 'function') return items[index].useText();
        return items[index].useText;
    }

    function getLength() { return items.length; }

    function removeItem(index) { items.splice(index, 1); }

    function addItem(item) { items.push(item); }

    var itemsUsedCount = 0;
    function activate(index) {
        items[index].activate();
        itemsUsedCount++;
        if (itemsUsedCount === 2) {
            // Unlock potions!
            items.push(new Item("Speed Potion", "A vial of bubbling green liquid.", 20,
                "* You drank the Speed Potion.\n* You recovered 20 HP.\n* Your SPEED increased by 10%!",
                function() { Player.heal(20); if(Player.addBuffSpd) Player.addBuffSpd(0.1); }));
            items.push(new Item("Iron Potion", "A dense, metallic-tasting syrup.", 20,
                "* You drank the Iron Potion.\n* You recovered 20 HP.\n* Your DEFENSE increased by 10%!",
                function() { Player.heal(20); if(Player.addBuffDef) Player.addBuffDef(0.1); }));
            items.push(new Item("Power Potion", "A spicy red concoction.", 20,
                "* You drank the Power Potion.\n* You recovered 20 HP.\n* Your DAMAGE increased by 10%!",
                function() { Player.heal(20); if(Player.addBuffAtk) Player.addBuffAtk(0.1); }));
        }
    }

    return {
        init: init, getNames: getNames, getText: getText,
        getLength: getLength, removeItem: removeItem,
        activate: activate, addItem: addItem,
    };
}());
