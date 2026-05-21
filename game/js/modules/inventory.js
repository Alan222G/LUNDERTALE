// inventory.js — Inventory module for LUNDERTALE
var Inventory = (function() {
    var allItems = [];
    var equippedItems = [];

    function init() {
        allItems = [
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
                function() { Player.heal(100); }),
            new Item("Shield Elixir", "A dense silver liquid. Smells metallic.", 15,
                "* You drank the Shield Elixir.\n* A barrier shimmers around you!\n* +15 HP. DEF +30% for 1 turn.",
                function() { Player.heal(15); Player.addBuffDef(0.3); }),
            new Item("Rage Tonic", "A boiling red vial. Handle with care.", 15,
                "* You drank the Rage Tonic.\n* Your fists burn with power!\n* +15 HP. ATK +30% for 1 turn.",
                function() { Player.heal(15); Player.addBuffAtk(0.3); }),
            new Item("Swift Serum", "A fizzy cyan liquid. Tingles on contact.", 15,
                "* You drank the Swift Serum.\n* The world slows around you!\n* +15 HP. SPD +30% for 1 turn.",
                function() { Player.heal(15); Player.addBuffSpd(0.3); }),
            new Item("Starlight Brew", "Brewed from captured starlight.", 30,
                "* You drank the Starlight Brew.\n* Starlight coats your skin!\n* +30 HP. DEF +30% for 1 turn.",
                function() { Player.heal(30); Player.addBuffDef(0.3); }),
            new Item("Photon Flask", "Pure light in a bottle. Warm.", 10,
                "* You drank the Photon Flask.\n* Light surges through you!\n* +10 HP. SPD & ATK +30% 1 turn.",
                function() { Player.heal(10); Player.addBuffSpd(0.3); Player.addBuffAtk(0.3); }),
            new Item("Void Vial", "Darkness swirls inside. Unsettling.", 20,
                "* You drank the Void Vial.\n* The void shields and empowers!\n* +20 HP. DEF & ATK +30% 1 turn.",
                function() { Player.heal(20); Player.addBuffDef(0.3); Player.addBuffAtk(0.3); }),
            new Item("Eclipse Draught", "Half light, half dark. Balanced.", 25,
                "* You drank the Eclipse Draught.\n* Eclipse energy fills you!\n* +25 HP. DEF & SPD +30% 1 turn.",
                function() { Player.heal(25); Player.addBuffDef(0.3); Player.addBuffSpd(0.3); }),
            new Item("Gravity Gulp", "Incredibly heavy for its size.", 20,
                "* You drank the Gravity Gulp.\n* Gravity bends to your will!\n* +20 HP. All stats +30% 1 turn.",
                function() { Player.heal(20); Player.addBuffDef(0.3); Player.addBuffAtk(0.3); Player.addBuffSpd(0.3); }),
            new Item("Singularity Shot", "A tiny black hole in a glass.", 5,
                "* You drank the Singularity Shot.\n* Infinite density courses through!\n* +5 HP. ATK +30% for 1 turn.",
                function() { Player.heal(5); Player.addBuffAtk(0.3); }),
            new Item("Speed Potion", "A vial of bubbling green liquid.", 20,
                "* You drank the Speed Potion.\n* You recovered 20 HP.\n* Your SPEED increased by 10%!",
                function() { Player.heal(20); if(Player.addBuffSpd) Player.addBuffSpd(0.1); }),
            new Item("Iron Potion", "A dense, metallic-tasting syrup.", 20,
                "* You drank the Iron Potion.\n* You recovered 20 HP.\n* Your DEFENSE increased by 10%!",
                function() { Player.heal(20); if(Player.addBuffDef) Player.addBuffDef(0.1); }),
            new Item("Power Potion", "A spicy red concoction.", 20,
                "* You drank the Power Potion.\n* You recovered 20 HP.\n* Your DAMAGE increased by 10%!",
                function() { Player.heal(20); if(Player.addBuffAtk) Player.addBuffAtk(0.1); })
        ];
        
        equippedItems = [];
        if (allItems.length > 0) equippedItems.push(allItems[0]);
        if (allItems.length > 1) equippedItems.push(allItems[1]);
        if (allItems.length > 2) equippedItems.push(allItems[2]);
    }

    // --- Combat Menu Functions (Equipped Items only) ---
    function getNames() {
        var names = [];
        for (var i = 0; i < equippedItems.length; i++) names.push(equippedItems[i].name);
        return names;
    }

    function getText(index) {
        if (typeof equippedItems[index].useText === 'function') return equippedItems[index].useText();
        return equippedItems[index].useText;
    }

    function getLength() { return equippedItems.length; }

    function removeItem(index) { equippedItems.splice(index, 1); }

    function activate(index) {
        equippedItems[index].activate();
    }

    // --- Catalog Menu Functions (All Items) ---
    function getAllNames() {
        var names = [];
        for (var i = 0; i < allItems.length; i++) names.push(allItems[i].name);
        return names;
    }

    function getAllText(index) {
        if (typeof allItems[index].useText === 'function') return allItems[index].useText();
        return allItems[index].useText;
    }
    
    function getAllLength() { return allItems.length; }

    function isEquipped(index) {
        var item = allItems[index];
        for (var i = 0; i < equippedItems.length; i++) {
            if (equippedItems[i].name === item.name) return true;
        }
        return false;
    }

    function toggleEquip(index) {
        var item = allItems[index];
        for (var i = 0; i < equippedItems.length; i++) {
            if (equippedItems[i].name === item.name) {
                // Unequip
                equippedItems.splice(i, 1);
                return false;
            }
        }
        // Equip
        if (equippedItems.length < 3) {
            equippedItems.push(item);
            return true;
        }
        return false; // Full
    }

    function getEquippedCount() { return equippedItems.length; }

    return {
        init: init, 
        getNames: getNames, getText: getText, getLength: getLength, 
        removeItem: removeItem, activate: activate,
        getAllNames: getAllNames, getAllText: getAllText, getAllLength: getAllLength,
        isEquipped: isEquipped, toggleEquip: toggleEquip, getEquippedCount: getEquippedCount
    };
}());
