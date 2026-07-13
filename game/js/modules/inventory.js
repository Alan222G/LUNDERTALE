// inventory.js — Inventory module for LUNDERTALE
var Inventory = (function() {
    var allItems = [];
    var equippedItems = [];

    function init() {
        allItems = [
            new Item("Fruto de Cristal", "Te vuelve inmune pero te ralentiza 60% por 2 turnos.", 20,
                "* Te comes el Fruto de Cristal.\n* Te vuelves INMUNE por 1 turno.\n* Pero tu velocidad se desploma.",
                function() { Player.heal(20); Player.setInvulnerable(1); Player.addBuffSpd(-0.6, 2); }),
            new Item("Espejo del Vacío", "Reflejas el 50% de daño recibido el próximo turno.", 0,
                "* Usas el Espejo del Vacío.\n* Reflejarás el 50% del daño en el\npróximo turno (daña piedad del jefe).",
                function() { Player.setReflection(0.5, 1); }),
            new Item("Píldora Veloz", "Velocidad x2 por 3 turnos, pero defensa -50%.", 0,
                "* Tragas la Píldora Veloz.\n* Tu velocidad se DUPLICA por 3 turnos.\n* ¡Pero tu defensa baja a la mitad!",
                function() { Player.addBuffSpd(1.0, 3); Player.addBuffDef(-0.5, 3); }),
            new Item("Corazón Sangrante", "Cura al máximo, pero bloquea curaciones < 999.", 999,
                "* Absorbes el Corazón Sangrante.\n* ¡HP MÁXIMO RECUPERADO!\n* Pero ya no podrás usar curas pequeñas.",
                function() { Player.heal(999); Player.setNoSmallHeals(true); }),
            new Item("Polvo Gravitatorio", "Velocidad +30% permanente, pero recibes +20% daño.", 0,
                "* Inhalas el Polvo Gravitatorio.\n* Tu alma es más rápida PERMANENTEMENTE.\n* (Recibes 20% más de daño).",
                function() { Player.setPermanentGravityDust(); }),
            new Item("Materia Inestable", "50% de probabilidad de curar 500 HP o herir 150 HP.", 0,
                "* Tragas la Materia Inestable.\n* Su energía fluctúa violentamente...",
                function() { 
                    if (Math.random() > 0.5) { 
                        Player.heal(500); 
                    } else { 
                        Player.damage(150); 
                    } 
                }),
            new Item("Reloj Detenido", "El próximo ataque del jefe durará la MITAD.", 0,
                "* Rompes el Reloj Detenido.\n* ¡El tiempo se fragmenta!\n* El próximo ataque del jefe durará la MITAD.",
                function() { Player.setNextAttackHalfDuration(); }),
            new Item("Alma Sintética", "Ganas escudo de 3 cargas por 2 turnos.", 0,
                "* Usas el Alma Sintética.\n* ¡Ganas un ESCUDO de 3 cargas\ndurante los próximos 2 turnos!",
                function() { Player.setShieldCharges(3, 2); }),
            new Item("Té de Resonancia", "Recupera 30 HP y +25% curas futuras permanentemente.", 30,
                "* Bebes el Té de Resonancia.\n* Recibes 30 HP.\n* Todo objeto futuro te curará un 25% MÁS.",
                function() { Player.heal(30); Player.addHealMultiplier(0.25); }),
            new Item("Brebaje Tóxico", "Envenena al jefe, pero te inflige veneno leve.", 0,
                "* Te bebes el Brebaje Tóxico.\n* El veneno afecta a tu enemigo...\n* ...¡Pero también te hiere a ti!",
                function() { Player.setPoisonEnemy(true); Player.setSelfPoison(6); }),
            new Item("Estrella Fugaz", "Regenera 20 HP por turno durante 5 turnos.", 0,
                "* Pides un deseo a la Estrella Fugaz.\n* Tu HP se REGENERARÁ (20 HP por turno)\ndurante los próximos 5 turnos.",
                function() { Player.setRegen(20, 5); }),
            new Item("Ojo del Ángel", "La próxima caja de combate será 50% más grande.", 0,
                "* Usas el Ojo del Ángel.\n* ¡La próxima caja será un 50% MÁS GRANDE!",
                function() { Player.setNextBoxBigger(true); }),
            new Item("Inversor Fatal", "Baja tu HP actual a 1. Otorga +300% DEF por 2 turnos.", 0,
                "* Usas el Inversor Fatal.\n* Tu HP cae a 1.\n* ¡Pero tu defensa se multiplica por 4 por 2 turnos!",
                function() { Player.setHP(1); Player.addBuffDef(3.0, 2); }),
            new Item("Tónico Berserker", "Aumenta ATK en 150% por 3 turnos, pero pierdes 10 HP por segundo.", 0,
                "* Bebes el Tónico Berserker.\n* Entras en una furia ciega.\n* ATK +150% por 3 turnos, pero sufres sangrado leve.",
                function() { Player.addBuffAtk(1.5, 3); Player.addBleed(3); }),
            new Item("Huevo de Fénix", "Resucitas con 50% HP si mueres, pero reduce HP Máx al 50%.", 0,
                "* Llevas el Huevo de Fénix.\n* Si eres derrotado en esta batalla, resucitarás al instante.\n* ¡Pero tu HP Máximo se reduce permanentemente a la mitad!",
                function() { Player.setPhoenixEggActive(true); }),
            new Item("Café Hiperactivo", "Aumenta tu velocidad +100% por 2 turnos.", 0,
                "* Bebes el Café Hiperactivo.\n* ¡Tus reflejos se disparan al límite!\n* Velocidad del alma +100% por 2 turnos.",
                function() { Player.setHyperCoffee(true); }),
            new Item("Escudo Espinoso", "Bloquea 1 golpe y daña la piedad del jefe en 30.", 0,
                "* Activas el Escudo Espinoso.\n* El siguiente golpe será bloqueado.\n* ¡Se devuelve daño en forma de 30 de Piedad al enemigo!",
                function() { Player.setThornShield(true); }),
            new Item("Poción de Canje", "Intercambia tu vida (HP) por la piedad restante del jefe.", 0,
                "* Bebes la Poción de Canje.\n* ¡Tu vida y el perdón del enemigo se intercambian!",
                function() { 
                    var temp = Player.getHPCur(); 
                    var enemy = Cgroup.getEnemy(0); 
                    if (enemy) { 
                        Player.setHP(enemy.mercyHP); 
                        enemy.mercyHP = Math.min(100, temp); 
                    } 
                }),
            new Item("Ancla Gravitatoria", "Te ancla al centro 2 turnos. Jefe hace 50% menos daño.", 0,
                "* Detonas el Ancla Gravitatoria.\n* Tu alma queda fija en el centro de la caja.\n* El daño recibido se reduce un 50% por 2 turnos.",
                function() { Player.setGravityAnchor(true); Player.addBuffDef(1.0, 2); }),
            new Item("Tónico Necrótico", "Cura 150 HP, pero sufres sangrado continuo por 10 segundos.", 150,
                "* Bebes el Tónico Necrótico.\n* +150 HP, pero sufres un doloroso sangrado por 10s.",
                function() { Player.heal(150); Player.addBleed(10); }),
            new Item("Amuleto Caótico", "Cambia el color de tu alma (clase) aleatoriamente.", 20,
                "* Activas el Amuleto Caótico.\n* ¡Tu alma cambia a una clase aleatoria!",
                function() { 
                    var newClass = Math.floor(Math.random() * 4); 
                    Player.setSoulClass(newClass); 
                    Player.heal(20); 
                }),
            new Item("Daga de Sacrificio", "Aumenta ATK en 50% permanente, pero reduce 20 HP Máx.", 0,
                "* Te cortas con la Daga de Sacrificio.\n* ATK +50% permanente, pero HP Máximo -20.",
                function() { Player.addBuffAtk(0.5, 99); Player.reduceMaxHP(20); }),
            new Item("Elixir Caducado", "Cura 80 HP, pero reduce tu velocidad 50% por 1 turno.", 80,
                "* Bebes el Elixir Caducado.\n* Te curas 80 HP, pero entras en letargo (velocidad -50%).",
                function() { Player.heal(80); Player.addBuffSpd(-0.5, 1); }),
            new Item("Capa del Espectro", "Te vuelve inmune por 1 turno, pero tu ataque baja a 0.", 0,
                "* Te colocas la Capa del Espectro.\n* Eres INMUNE este turno, pero no infligirás daño en el siguiente.",
                function() { Player.setInvulnerable(1); Player.addBuffAtk(-1.0, 1); }),
            new Item("Brebaje Encojedor", "Alma 50% más pequeña por toda la batalla, pero HP Máx -30%.", 0,
                "* Bebes el Brebaje Encojedor.\n* Tu tamaño de alma se reduce a la mitad. HP Máximo -30%.",
                function() { Player.setShrunk(true); Player.reduceMaxHP(Math.floor(Player.getHPMax() * 0.3)); }),
            new Item("Poción de Gigante", "Alma 1.8x más grande, pero ganas +80% defensa.", 50,
                "* Bebes la Poción de Gigante.\n* Te vuelves gigante. HP +50. DEF +80% por 2 turnos.",
                function() { Player.setGiant(true); Player.addBuffDef(0.8, 2); Player.heal(50); }),
            new Item("Imán Radiactivo", "Atrae balas del jefe hacia ti, pero rozarlas te cura 5 HP.", 0,
                "* Enciendes el Imán Radiactivo.\n* Las balas te buscan. ¡Esquivar rozándolas te cura 5 HP!",
                function() { Player.setMagnetActive(true); }),
            new Item("Pacto del Titán", "HP máximo recuperado. Jefe inflige +40% daño permanente.", 999,
                "* Haces el Pacto del Titán.\n* HP MÁXIMO RECUPERADO. El jefe se enfurece (+40% daño).",
                function() { 
                    Player.heal(999); 
                    var em = Cgroup.getEnemy(0); 
                    if (em) { em.atk = Math.floor(em.atk * 1.4); } 
                }),
            new Item("Néctar del Olimpo", "Cura 60 HP, pero bloquea tu movimiento horizontal por 1 turno.", 60,
                "* Bebes el Néctar del Olimpo.\n* +60 HP, pero tus pies se petrifican (sin movimiento lateral).",
                function() { Player.heal(60); Player.setNoHorizontalMovement(true); }),
            new Item("Agujero Negro", "Reduce piedad al 10%. Tu HP cae a 10 y no curas por 2 turnos.", 0,
                "* Activas el Agujero Negro.\n* La piedad cae a 10. Tu HP baja a 10 y no puedes curar.",
                function() { 
                    var em = Cgroup.getEnemy(0); 
                    if (em) { em.mercyHP = Math.min(10, em.mercyHP); } 
                    Player.setHP(10); 
                    Player.setNoSmallHeals(true); 
                }),
            new Item("Pie Cósmico", "Un pastel celestial que huele a polvo de estrellas.", 999,
                "* Te comes el Pie Cósmico.\n* Su calidez te llena de DETERMINACIÓN.\n* ¡HP recuperado al máximo!",
                function() { Player.heal(999); }),
            new Item("Materia Oscura", "Materia extraña del espacio. ¿Se supone que se come?", 100,
                "* Consumes la Materia Oscura.\n* ¡Es sorprendentemente deliciosa!\n* Recuperas 100 HP.",
                function() { Player.heal(100); }),
            new Item("Fideos del Vacío", "Fideos instantáneos hechos de energía oscura.", 80,
                "* Te comes los Fideos del Vacío.\n* Sienten frío pero te llenan.\n* Recuperas 80 HP.",
                function() { Player.heal(80); }),
            new Item("Fruta de Nebulosa", "Una baya brillante que flota en el espacio.", 20,
                "* Muerdes la Fruta de Nebulosa.\n* Una explosión galáctica de sabor.\n* Recuperas 20 HP.",
                function() { Player.heal(20); }),
            new Item("Poción Estelar", "Líquido brillante que sabe a uvas espaciales.", 50,
                "* Bebes la Poción Estelar.\n* Brillas brevemente.\n* Recuperas 50 HP.",
                function() { Player.heal(50); })
        ];
        
        equippedItems = [];
        if (allItems.length > 0) equippedItems.push(allItems[0]);
        if (allItems.length > 1) equippedItems.push(allItems[1]);
        if (allItems.length > 2) equippedItems.push(allItems[2]);
        if (allItems.length > 3) equippedItems.push(allItems[3]);
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
        if (equippedItems.length < 8) {
            equippedItems.push(item);
            return true;
        }
        return false; // Full
    }

    function getEquippedCount() { return equippedItems.length; }

    function getEquippedItemObject(index) {
        return equippedItems[index];
    }

    function addItem(item) {
        if (equippedItems.length < 8) {
            equippedItems.push(item);
            return true;
        }
        return false;
    }

    function addPotionByName(name) {
        var item = allItems.find(function(i) { return i.name === name; });
        if (item) {
            return addItem(item);
        }
        return false;
    }

    var battleStartEquipped = [];

    function saveBattleStartEquipped() {
        battleStartEquipped = [];
        for (var i = 0; i < equippedItems.length; i++) {
            battleStartEquipped.push(equippedItems[i]);
        }
    }

    function restoreBattleStartEquipped() {
        equippedItems = [];
        for (var i = 0; i < battleStartEquipped.length; i++) {
            equippedItems.push(battleStartEquipped[i]);
        }
    }

    function wasAnyItemUsed() {
        if (equippedItems.length !== battleStartEquipped.length) return true;
        for (var i = 0; i < equippedItems.length; i++) {
            if (equippedItems[i].name !== battleStartEquipped[i].name) return true;
        }
        return false;
    }

    return {
        init: init, 
        getNames: getNames, getText: getText, getLength: getLength, 
        removeItem: removeItem, activate: activate,
        getAllNames: getAllNames, getAllText: getAllText, getAllLength: getAllLength,
        isEquipped: isEquipped, toggleEquip: toggleEquip, getEquippedCount: getEquippedCount,
        getEquippedItemObject: getEquippedItemObject, addItem: addItem,
        addPotionByName: addPotionByName,
        saveBattleStartEquipped: saveBattleStartEquipped,
        restoreBattleStartEquipped: restoreBattleStartEquipped,
        wasAnyItemUsed: wasAnyItemUsed
    };
}());
