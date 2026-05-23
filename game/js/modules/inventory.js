// inventory.js — Inventory module for LUNDERTALE
var Inventory = (function() {
    var allItems = [];
    var equippedItems = [];

    function init() {
        allItems = [
            new Item("Cosmic Pie", "A pie that smells like stardust.", 99,
                "* You ate the Cosmic Pie.\n* Its warmth fills you with DETERMINATION.\n* Your HP was maxed out.",
                function() { Player.heal(Player.getHPMax()); }),
            new Item("Void Noodles", "Noodles made from dark energy.", 80,
                "* You ate the Void Noodles.\n* You recovered 80 HP.",
                function() { Player.heal(80); }),
            new Item("Dark Matter", "Wait, are you supposed to eat this?", 100,
                "* You consumed the Dark Matter.\n* It was surprisingly delicious!\n* You recovered 100 HP.",
                function() { Player.heal(100); }),
            new Item("Shield Elixir", "A dense silver liquid. Smells metallic.", 15,
                "* You drank the Shield Elixir.\n* A barrier shimmers around you!\n* +15 HP. DEF +30% for 1 turn.",
                function() { Player.heal(15); Player.addBuffDef(0.3, 1); }),
            new Item("Rage Tonic", "A boiling red vial. Handle with care.", 15,
                "* You drank the Rage Tonic.\n* Your fists burn with power!\n* +15 HP. ATK +30% for 1 turn.",
                function() { Player.heal(15); Player.addBuffAtk(0.3, 1); }),
            new Item("Swift Serum", "A fizzy cyan liquid. Tingles on contact.", 15,
                "* You drank the Swift Serum.\n* The world slows around you!\n* +15 HP. SPD +30% for 1 turn.",
                function() { Player.heal(15); Player.addBuffSpd(0.3, 1); }),
            new Item("Starlight Brew", "Brewed from captured starlight.", 30,
                "* You drank the Starlight Brew.\n* Starlight coats your skin!\n* +30 HP. DEF +30% for 1 turn.",
                function() { Player.heal(30); Player.addBuffDef(0.3, 1); }),
            new Item("Photon Flask", "Pure light in a bottle. Warm.", 10,
                "* You drank the Photon Flask.\n* Light surges through you!\n* +10 HP. SPD & ATK +30% 1 turn.",
                function() { Player.heal(10); Player.addBuffSpd(0.3, 1); Player.addBuffAtk(0.3, 1); }),
            new Item("Void Vial", "Darkness swirls inside. Unsettling.", 20,
                "* You drank the Void Vial.\n* The void shields and empowers!\n* +20 HP. DEF & ATK +30% 1 turn.",
                function() { Player.heal(20); Player.addBuffDef(0.3, 1); Player.addBuffAtk(0.3, 1); }),
            new Item("Eclipse Draught", "Half light, half dark. Balanced.", 25,
                "* You drank the Eclipse Draught.\n* Eclipse energy fills you!\n* +25 HP. DEF & SPD +30% 1 turn.",
                function() { Player.heal(25); Player.addBuffDef(0.3, 1); Player.addBuffSpd(0.3, 1); }),
            new Item("Gravity Gulp", "Incredibly heavy for its size.", 20,
                "* You drank the Gravity Gulp.\n* Gravity bends to your will!\n* +20 HP. All stats +30% 1 turn.",
                function() { Player.heal(20); Player.addBuffDef(0.3, 1); Player.addBuffAtk(0.3, 1); Player.addBuffSpd(0.3, 1); }),
            new Item("Singularity Shot", "A tiny black hole in a glass.", 5,
                "* You drank the Singularity Shot.\n* Infinite density courses through!\n* +5 HP. ATK +30% for 1 turn.",
                function() { Player.heal(5); Player.addBuffAtk(0.3, 1); }),
                
            // NEW CRAZY ITEMS
            new Item("Fruto de Cristal", "Te vuelve invulnerable pero muy lento.", 20,
                "* Te comes el Fruto de Cristal.\n* Te vuelves INMUNE por 1 turno.\n* Pero tu velocidad se desploma.",
                function() { Player.heal(20); Player.setInvulnerable(1); Player.addBuffSpd(-0.6, 2); }),
            new Item("Espejo del Vacío", "Un cristal oscuro y reflectante.", 0,
                "* Usas el Espejo del Vacío.\n* Reflejarás el 50% del daño en el\npróximo turno (daña piedad del jefe).",
                function() { Player.setReflection(0.5, 1); }),
            new Item("Pildora Aceleradora", "Pastilla brillante con símbolo de rayo.", 0,
                "* Tragas la Píldora Aceleradora.\n* Tu velocidad se DUPLICA por 3 turnos.\n* ¡Pero tu defensa baja a la mitad!",
                function() { Player.addBuffSpd(1.0, 3); Player.addBuffDef(-0.5, 3); }),
            new Item("Corazón Sangrante", "Late rítmicamente en tu mano.", 999,
                "* Absorbes el Corazón Sangrante.\n* ¡HP MÁXIMO RECUPERADO!\n* Pero ya no podrás usar curas pequeñas.",
                function() { Player.heal(999); Player.setNoSmallHeals(true); }),
            new Item("Polvo de Gravedad", "Polvo de enana blanca triturada.", 0,
                "* Inhalas el Polvo de Gravedad.\n* Tu alma es más rápida PERMANENTEMENTE.\n* (Recibes 20% más de daño).",
                function() { Player.setPermanentGravityDust(); }),
            new Item("Materia Inestable", "Peligrosamente radiactiva.", 0,
                "* Tragas la Materia Inestable.\n* Su energía fluctúa violentamente...",
                function() { 
                    if (Math.random() > 0.5) { 
                        Player.heal(500); 
                    } else { 
                        Player.damage(150); 
                    } 
                }),
            new Item("Reloj Roto", "Sus manecillas giran sin sentido.", 0,
                "* Rompes el Reloj Roto.\n* ¡El tiempo se fragmenta!\n* El próximo ataque del jefe durará la MITAD.",
                function() { Player.setNextAttackHalfDuration(); }),
            new Item("Alma Artificial", "Un contenedor de alma vacío.", 0,
                "* Usas el Alma Artificial.\n* ¡Ganas un ESCUDO de 3 cargas\ndurante los próximos 2 turnos!",
                function() { Player.setShieldCharges(3, 2); }),
            new Item("Té de Resonancia", "Té servido en una taza humeante.", 30,
                "* Bebes el Té de Resonancia.\n* Recibes 30 HP.\n* Todo objeto futuro te curará un 25% MÁS.",
                function() { Player.heal(30); Player.addHealMultiplier(0.25); }),
            new Item("Brebaje Tóxico", "Una calavera en la etiqueta.", 0,
                "* Te bebes el Brebaje Tóxico.\n* El veneno afecta a tu enemigo...\n* ...¡Pero también te hiere a ti!",
                function() { Player.setPoisonEnemy(true); Player.setSelfPoison(10); }),
            new Item("Estrella Fugaz", "Brilla intensamente. Muy caliente.", 0,
                "* Pides un deseo a la Estrella Fugaz.\n* Tu HP se REGENERARÁ (20 HP por turno)\ndurante los próximos 5 turnos.",
                function() { Player.setRegen(20, 5); }),
            new Item("Ojo del Ángel", "Parece observarte fijamente.", 0,
                "* Usas el Ojo del Ángel.\n* Amplías tu visión del campo de batalla.\n* ¡La próxima caja será un 50% MÁS GRANDE!",
                function() { Player.setNextBoxBigger(true); })
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
        if (equippedItems.length < 6) {
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
