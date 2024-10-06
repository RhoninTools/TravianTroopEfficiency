//Initialize app settings
let appSettings = {

    useRelativeMode: true,
    includeCropCostInCalculations: false,

    sortingSettings: {
        lastCatagory: undefined,
        useReverseOrder: false
    },

    filterSettings: {
        roles: {
            showOffense: true,
            showDefense: true,
            showHybrid: true,
            showScout: false,
            showUtility: false,
        },
        types: {
            showInfantry: true,
            showCavalry: true,
            showSiege: false,
            showSettler: false,
            showChief: false,
        },
        tribes: {
            showRomans: true,
            showGauls: true,
            showTeutons: true,
            showEgyptians: true,
            showHuns: true,
            showSpartans: true,
            showVikings: true,
        }
    }
}

//Get data
const data = getData();

//Update view model with data
updateViewModel(data);

function updateViewModel() {
    viewModel = convertTravianModelToMyModel(data);
    updateTable(viewModel);
}

function updateTable(data) {
    let table = document.getElementById('data-table');

    //Clear old values from table
    let rows = table.children;
    if (rows.length > 1) {

        // > 1 because we dont want to remove the <tr> which contains the <th>
        while (table.children.length > 1) {
            table.removeChild(table.lastChild);
        }
    }

    //Update table headers depending on useRelativeMode
    document.getElementById("th-attack").innerHTML = appSettings.useRelativeMode ? '<div class="pretext">Resources per</div>Attack' : "Attack";
    document.getElementById("th-totalDef").innerHTML = appSettings.useRelativeMode ? '<div class="pretext">Resources per</div> Combined Def' : "Combined def";
    document.getElementById("th-defense").innerHTML = appSettings.useRelativeMode ? '<div class="pretext">Resources per</div> Defense' : "Defense";
    document.getElementById("th-cavDef").innerHTML = appSettings.useRelativeMode ? '<div class="pretext">Resources per</div> Cav Def' : "Cav Def";

    //Fill table with rows
    let rank = 0;
    for (let i = 0; i < data.troopInfo.troops.length; i++) {
        let currentTroop = data.troopInfo.troops[i];

        //Validation
        if (!isValid(currentTroop)) continue;

        rank += 1;
        let row = generateRow(currentTroop, rank);
        table.appendChild(row);
    }
}

function generateRow(troop, rank) {
    let rowString = '<tr>';

    rowString += '<td>' + rank + '</td>';
    rowString += '<td>' + troop.tribe + '</td>';
    rowString += '<td class="td-troopName">' + troop.name + '</td>';
    let roleImgDiv = '<div class="roleTD role-' + troop.role + '" Title="' + troop.role + '">' + '&nbsp;' + '</div>';
    rowString += '<td>' + roleImgDiv + '</td>';

    if (appSettings.useRelativeMode) {
        rowString += '<td>' + troop.statsRelative.attack + '</td>';
        rowString += '<td>' + troop.statsRelative.totalDef + '</td>';
        rowString += '<td>' + troop.statsRelative.defense + '</td>';
        rowString += '<td>' + troop.statsRelative.cavDef + '</td>';
    }
    else {
        rowString += '<td>' + troop.stats.attack + '</td>';
        rowString += '<td>' + troop.stats.totalDef + '</td>';
        rowString += '<td>' + troop.stats.defense + '</td>';
        rowString += '<td>' + troop.stats.cavDef + '</td>';
    }

    rowString += '<td>' + troop.stats.velocity + '</td>';
    rowString += '<td>' + troop.stats.carry + '</td>';
    rowString += '<td>' + troop.stats.formattedTrainingTime + '</td>';
    rowString += '<td>' + troop.stats.upkeep + '</td>';

    rowString += ('</tr>');

    //Create html element
    let tr = document.createElement('tr');
    tr.innerHTML = rowString.trim();
    tr.className = getEven(rank); //Sets a background color depending on the index (rank)

    return tr;
}

function createElementFromHTML(htmlString, tag) {
    var node = document.createElement(tag);
    node.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return node;
}

function getEven(number){
    if( number % 2 == 0 ) return 'even';
    else return 'odd';
}

function convertTravianModelToMyModel(troopInfo) {
    // let troopInfo = data.troopInfo;

    //Initialize empty viewmodel so we can fill it with data
    let viewModel = {
        troopInfo: {
            troops: []
        }
    };

    //Convert travian model to viewModel
    for (let i = 0; i < troopInfo.troops.length; i++) {
        let currentItem = troopInfo.troops[i];

        //Calculate total def of troop
        currentItem.stats.totalDef = currentItem.stats.defense + currentItem.stats.cavDef;

        //Initialize troop model
        let troop = {
            rank: 0, //Gets updated later.
            tribe: currentItem.tribe,
            name: currentItem.name,
            role: currentItem.role,
            type: currentItem.type,
            stats: currentItem.stats,
            statsRelative: getRelativeStats(currentItem.stats, currentItem.resourceCost),
            resourceCost: currentItem.resourceCost,
        }
        troop.stats.formattedTrainingTime = formatTimeFromSeconds(troop.stats.trainingTime);
        viewModel.troopInfo.troops.push(troop);
    }

    return viewModel;
}

function getRelativeStats(stats, resourceCost) {

    //Calculate total cost in resources
    let totalCost = resourceCost.wood + resourceCost.clay + resourceCost.iron;
    if (appSettings.includeCropCostInCalculations) totalCost += resourceCost.crops;

    //Attack
    let relativeAttack = 0;
    if (stats.attack > 0) {
        relativeAttack = round(totalCost / stats.attack);
    }

    //Total Defense
    let relativeTotalDef = 0;
    if (stats.totalDef > 0) {
        //relativeTotalDef = round((troop.statsRelative.defense + troop.statsRelative.cavDef) / 2);
        relativeTotalDef = round(totalCost / stats.totalDef * 2);
    }

    //Defense
    let relativeDefense = 0;
    if (stats.defense > 0) {
        relativeDefense = round(totalCost / stats.defense);
    }

    //CavDef
    let relativeCavDef = 0;
    if (stats.cavDef > 0) {
        relativeCavDef = round(totalCost / stats.cavDef);
    }

    //Result
    let result = {
        attack: relativeAttack,
        totalDef: relativeTotalDef,
        defense: relativeDefense,
        cavDef: relativeCavDef
    }

    return result;
}

function isValid(troop) {

    //Tribe validation
    let isValidTribe = false;
    switch(troop.tribe){
        case "Romans":{
            if (appSettings.filterSettings.tribes.showRomans) isValidTribe = true;
            break;
        }
        case "Gauls":{
            if (appSettings.filterSettings.tribes.showGauls) isValidTribe = true;
            break;
        }
        case "Teutons":{
            if (appSettings.filterSettings.tribes.showTeutons) isValidTribe = true;
            break;
        }
        case "Egyptians":{
            if (appSettings.filterSettings.tribes.showEgyptians) isValidTribe = true;
            break;
        }
        case "Huns":{
            if (appSettings.filterSettings.tribes.showHuns) isValidTribe = true;
            break;
        }
        case "Spartans":{
            if (appSettings.filterSettings.tribes.showSpartans) isValidTribe = true;
            break;
        }
        case "Vikings":{
            if (appSettings.filterSettings.tribes.showVikings) isValidTribe = true;
        }
    }

    //Dont display the troop if its tribe is disabled in filter settings
    if (!isValidTribe) return false;

    //Role validation
    let isValidRole = false; //Is troop valid to show regarding the filters for Role?
    switch (troop.role) {
        case "Offense": {
            if (appSettings.filterSettings.roles.showOffense) isValidRole = true;
            break;
        }
        case "Defense": {
            if (appSettings.filterSettings.roles.showDefense) isValidRole = true;
            break;
        }
        case "Hybrid": {
            if (appSettings.filterSettings.roles.showHybrid) isValidRole = true;
            break;
        }
        case "Scout": {
            if (appSettings.filterSettings.roles.showScout) isValidRole = true;
            break;
        }
        case "Utility": {
            if (appSettings.filterSettings.roles.showUtility) isValidRole = true;
            break;
        }
    }

    //Type validation
    let isValidType = false; //Is troop valid to show regarding the filters for Type?
    switch (troop.type) {
        case "Infantry": {
            if (appSettings.filterSettings.types.showInfantry) isValidType = true;
            break;
        }
        case "Cavalry": {
            if (appSettings.filterSettings.types.showCavalry) isValidType = true;
            break;
        }
        case "Siege": {
            if (appSettings.filterSettings.types.showSiege) isValidType = true;
            break;
        }
        case "Settler": {
            if (appSettings.filterSettings.types.showSettler) isValidType = true;
            break;
        }
        case "Chief": {
            if (appSettings.filterSettings.types.showChief) isValidType = true;
            break;
        }
    }

    return isValidRole && isValidType;
}

function sortTableBy(category) {
    //Determine whether the same category was clicked
    if (appSettings.sortingSettings.lastCatagory === category) {
        //Reverse Order
        appSettings.sortingSettings.useReverseOrder = !appSettings.sortingSettings.useReverseOrder;
    }

    let troops = viewModel.troopInfo.troops;

    //Initializing key-value pairs for easier sorting later on.
    let keyValuePairs = [];
    for (let i = 0; i < troops.length; i++) {
        let troop = troops[i];
        let keyValuePair = [];
        let key = '';
        switch (category) {
            case "troop": {
                key = troop.name;
                break;
            }
            case "tribe": {
                key = troop.tribe;
                break;
            }
            case "role": {
                key = troop.role;
                break;
            }
            case "attack": {
                key = appSettings.useRelativeMode ? troop.statsRelative.attack : troop.stats.attack;
                break;
            }
            case "defense": {
                key = appSettings.useRelativeMode ? troop.statsRelative.defense : troop.stats.defense;
                break;
            }
            case "cavDef": {
                key = appSettings.useRelativeMode ? troop.statsRelative.cavDef : troop.stats.cavDef;
                break;
            }
            case "totalDef": {
                key = appSettings.useRelativeMode ? troop.statsRelative.totalDef : troop.stats.totalDef;
                break;
            }
            case "speed": {
                key = troop.stats.velocity;
                break;
            }
            case "carry": {
                key = troop.stats.carry;
                break;
            }
            case "trainingTime": {
                key = troop.stats.trainingTime;
                break;
            }
            case "upkeep": {
                key = troop.stats.upkeep;
                break;
            }
        }

        keyValuePair = [key, troop]
        keyValuePairs.push(keyValuePair);
    }

    //Differentiate between strings and numbers for sorting
    switch (category) {

        //Sort strings
        case "tribe":
        case "role":
        case "troop": {
            //Sort
            keyValuePairs.sort(sortString);
            break;
        }

        //Sort numbers
        case "attack":
        case "defense":
        case "cavDef":
        case "totalDef":
        case "speed": 
        case "carry":
        case "trainingTime":
        case "upkeep":{
            //Sort
            keyValuePairs.sort(sortNumber);
            break;
        }
    }

    //TODO: Enable this line of code and repeatedly click a catogy. It will fail. Find out why and resolve this bug.
    //reverseOrder = false; //We finished making use of reverseOrder. Setting it back to its default value again.

    viewModel.troopInfo.troops = []; //Clear troop info

    //Fill model with sorted troops
    for (let i = 0; i < keyValuePairs.length; i++) {
        viewModel.troopInfo.troops.push(keyValuePairs[i][1]);
    }

    updateTable(viewModel);
}

function sortString(a, b) { //String a, String b
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        let result = a[0].localeCompare(b[0]);
        if (appSettings.sortingSettings.useReverseOrder) result = reverseOne(result);
        return result;
    }
}

function sortNumber(a, b) { //Number a, Number b

    let num1 = a[0];
    let num2 = b[0];

    if (num1 === num2) {
        return 0;
    }

    if (num1 == 0) return 1;
    if (num2 == 0) return -1;

    let result = undefined;

    if (num1 > num2) {
        result = -1;
    }
    else {
        result = 1;
    }

    if (appSettings.sortingSettings.useReverseOrder) {
        result = reverseOne(result);
    }

    return result;
}

function reverseOne(number) {
    if (number == -1) return 1;
    if (number == 1) return -1;
    return 0;
}

function formatTimeFromSeconds(seconds){
    let result = '';
    let remainder = seconds;

    //Days
    let secondsInDay = 86400;
    if(remainder >= secondsInDay){
        let days = Math.trunc(remainder / secondsInDay);
        result += days + 'd ';
        remainder -= days*secondsInDay;
    }

    //Hours
    let secondsInHour = 3600;
    if(remainder >= secondsInHour){
        let hours = Math.trunc(remainder / secondsInHour);
        result += hours + 'h ';
        remainder -= hours*secondsInHour;
    }

    //Minutes
    let secondsInMinute = 60;
    if(remainder >= secondsInMinute){
        let minutes = Math.trunc(remainder / secondsInMinute);
        result += minutes + 'm ';
        remainder -= minutes*secondsInMinute;
    }

    //Seconds
    if(remainder > 0){
        result += remainder + 's '
    }

    return result;
}

//Event handlers
function onRelativeModeToggle() {

    //Disable option to toggle resource cost in calculations
    let div = document.getElementById("includeCrops-container");

    appSettings.useRelativeMode = !appSettings.useRelativeMode;

    if (appSettings.useRelativeMode) {
        document.getElementById("includeCrops-container").style.display = "table-row";
    }
    else {
        document.getElementById("includeCrops-container").style.display = "none";
    }
    updateTable(viewModel);
}

function onIncludeCropsToggle() {
    appSettings.includeCropCostInCalculations = !appSettings.includeCropCostInCalculations;
    updateViewModel();
}

function toggleSettings() {
    let settingsContent = document.getElementById("settings-content");

    if (settingsContent.style.display === "none" || settingsContent.style.display === "") {
        settingsContent.style.display = "block"
        document.getElementById("settings-header").innerHTML = "Hide filters &#9660";
    }
    else {
        settingsContent.style.display = "none";
        document.getElementById("settings-header").innerHTML = "Show filters &#9664";
    }


}

function filterRole(role) {
    switch (role) {
        case "offense": {
            appSettings.filterSettings.roles.showOffense = !appSettings.filterSettings.roles.showOffense;
            break;
        }
        case "defense": {
            appSettings.filterSettings.roles.showDefense = !appSettings.filterSettings.roles.showDefense;
            break;
        }
        case "hybrid": {
            appSettings.filterSettings.roles.showHybrid = !appSettings.filterSettings.roles.showHybrid;
            break;
        }
        case "scout": {
            appSettings.filterSettings.roles.showScout = !appSettings.filterSettings.roles.showScout;
            break;
        }
        case "utility": {
            appSettings.filterSettings.roles.showUtility = !appSettings.filterSettings.roles.showUtility;
            break;
        }
    }

    updateTable(viewModel);
}

function filterType(type) {
    switch (type) {
        case "infantry": {
            appSettings.filterSettings.types.showInfantry = !appSettings.filterSettings.types.showInfantry;
            break;
        }
        case "cavalry": {
            appSettings.filterSettings.types.showCavalry = !appSettings.filterSettings.types.showCavalry;
            break;
        }
        case "siege": {
            appSettings.filterSettings.types.showSiege = !appSettings.filterSettings.types.showSiege;
            break;
        }
        case "settler": {
            appSettings.filterSettings.types.showSettler = !appSettings.filterSettings.types.showSettler;
            break;
        }
        case "chief": {
            appSettings.filterSettings.types.showChief = !appSettings.filterSettings.types.showChief;
            break;
        }
    }

    updateTable(viewModel);
}

function filterTribe(tribe){
    switch(tribe){
        case "romans":{
            appSettings.filterSettings.tribes.showRomans = !appSettings.filterSettings.tribes.showRomans;
            break;
        }
        case "gauls":{
            appSettings.filterSettings.tribes.showGauls = !appSettings.filterSettings.tribes.showGauls;
            break;
        }
        case "teutons":{
            appSettings.filterSettings.tribes.showTeutons = !appSettings.filterSettings.tribes.showTeutons;
            break;
        }
        case "egyptians":{
            appSettings.filterSettings.tribes.showEgyptians = !appSettings.filterSettings.tribes.showEgyptians;
            break;
        }
        case "huns":{
            appSettings.filterSettings.tribes.showHuns = !appSettings.filterSettings.tribes.showHuns;
            break;
        }
        case "spartans":{
            appSettings.filterSettings.tribes.showSpartans = !appSettings.filterSettings.tribes.showSpartans;
            break;
        }
        case "vikings":{
            appSettings.filterSettings.tribes.showVikings = !appSettings.filterSettings.tribes.showVikings;
        }
    }

    updateTable(viewModel);
}

function onThClick(category) {
    sortTableBy(category);
    appSettings.sortingSettings.lastCatagory = category;
}
//End of Event handlers

function round(number) {
    //Rounds a number at 2 decimals
    return Math.round(number * 100) / 100;
}

function getData(){
    return {
        "troops":[
            {
                "tribe": "Romans",
                "name": "Legionaire",
                "type": "Infantry",
                "role": "Hybrid",
                "resourceCost": {
                    "wood": 120,
                    "clay": 100,
                    "iron": 150,
                    "crops": 30
                },
                "stats": {
                    "attack": 40,
                    "defense": 35,
                    "cavDef": 50,
                    "velocity": 6,
                    "carry": 50,
                    "upkeep": 1,
                    "trainingTime": 1600
                },
                "travian description": "The Legionnaire is the simple and all-purpose infantry of the Roman Empire. With his well-rounded training, he is good at both defence and offence. However, the Legionnaire will never reach the levels of the more specialized troops.",
                "pre-requisites": "Barracks level 1"
            },
            {
                "tribe": "Romans",
                "name": "Praetorian",
                "type": "Infantry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 100,
                    "clay": 130,
                    "iron": 160,
                    "crops": 70
                },
                "stats": {
                    "attack": 30,
                    "defense": 65,
                    "cavDef": 35,
                    "velocity": 5,
                    "carry": 20,
                    "upkeep": 1,
                    "trainingTime": 1760
                },
                "travian description": "The Praetorians are the emperor's guard and they defend him with their life. Because their training is specialized for defence, they are very weak attackers.",
                "pre-requisites": "Academy level 1, Smithy level 1"
            },
            {
                "tribe": "Romans",
                "name": "Imperian",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 150,
                    "clay": 160,
                    "iron": 210,
                    "crops": 80
                },
                "stats": {
                    "attack": 70,
                    "defense": 40,
                    "cavDef": 25,
                    "velocity": 7,
                    "carry": 50,
                    "upkeep": 1,
                    "trainingTime": 1920
                },
                "travian description": "The Imperian is the ultimate attacker of the Roman Empire. He is quick, strong, and the nightmare of all defenders. However, his training is expensive and time-intensive.",
                "pre-requisites": "Academy Level 5, Smithy Level 1"
            },
            {
                "tribe": "Romans",
                "name": "Equites Legati",
                "type": "Cavalry",
                "role": "Scout",
                "resourceCost": {
                    "wood": 140,
                    "clay": 160,
                    "iron": 20,
                    "crops": 40
                },
                "stats": {
                    "attack": 0,
                    "defense": 20,
                    "cavDef": 10,
                    "velocity": 16,
                    "carry": 0,
                    "upkeep": 2,
                    "trainingTime": 1360
                },
                "travian description": "The Equites Legati are the roman reconnaissance troops. They are pretty fast and can spy on enemy villages in order to see resources and troops. If there are no Scouts, Equites Legati or Pathfinders in the scouted village, the scouting remains unnoticed.",
                "pre-requisites": "Stable Level 1, Academy Level 5"
            },
            {
                "tribe": "Romans",
                "name": "Equites Imperatoris",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 550,
                    "clay": 440,
                    "iron": 320,
                    "crops": 100
                },
                "stats": {
                    "attack": 120,
                    "defense": 65,
                    "cavDef": 50,
                    "velocity": 14,
                    "carry": 100,
                    "upkeep": 3,
                    "trainingTime": 2640
                },
                "travian description": "The Equites Imperatoris are the standard cavalry of the roman army and are very well armed. They are not the fastest troops, but are a horror for unprepared enemies. You should, however, always keep in mind that catering for horse and rider isn't cheap.",
                "pre-requisites": "Stable Level 5, Academy Level 5"
            },
            {
                "tribe": "Romans",
                "name": "Equites Caesaris",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 550,
                    "clay": 640,
                    "iron": 800,
                    "crops": 180
                },
                "stats": {
                    "attack": 180,
                    "defense": 80,
                    "cavDef": 105,
                    "velocity": 10,
                    "carry": 70,
                    "upkeep": 4,
                    "trainingTime": 3520
                },
                "travian description": "The Equites Caesaris are the heavy cavalry of Rome. They are very well armored and deal great amounts of damage, but all that armor and weaponry comes with a price. They are slow, carry less resources and feeding them is expensive.",
                "pre-requisites": "Stable Level 10, Academy Level 15"
            },
            {
                "tribe": "Romans",
                "name": "Battering Ram",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 900,
                    "clay": 360,
                    "iron": 500,
                    "crops": 70
                },
                "stats": {
                    "attack": 60,
                    "defense": 30,
                    "cavDef": 75,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 4,
                    "trainingTime": 4600
                },
                "travian description": "The Battering ram is a heavy support weapon for your infantry and cavalry. Its task is to destroy the enemy walls and therefore increase your troops’ chances of overcoming the enemy's fortifications.",
                "pre-requisites": "Academy Level 10, Workshop Level 1"
            },
            {
                "tribe": "Romans",
                "name": "Fire Catapult",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 950,
                    "clay": 1350,
                    "iron": 600,
                    "crops": 90
                },
                "stats": {
                    "attack": 75,
                    "defense": 60,
                    "cavDef": 10,
                    "velocity": 3,
                    "carry": 0,
                    "upkeep": 6,
                    "trainingTime": 9000
                },
                "travian description": "The Catapult is an excellent long-distance weapon; it is used to destroy the fields and buildings of enemy villages. However, without escorting troops, it is virtually defenseless, so don't forget to send some of your troops with it.    Having a high-level rally point makes your catapults more accurate and gives you the option to target additional enemy buildings. More information is available here.            HINT: Catapults CAN hit the cranny, trappers or stonemason's lodges when they target randomly.",
                "pre-requisites": "Workshop Level 10, Academy Level 15"
            },
            {
                "tribe": "Romans",
                "name": "Senator",
                "type": "Chief",
                "role": "Utility",
                "resourceCost": {
                    "wood": 30750,
                    "clay": 27200,
                    "iron": 45000,
                    "crops": 37500
                },
                "stats": {
                    "attack": 50,
                    "defense": 40,
                    "cavDef": 30,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 5,
                    "trainingTime": 90700
                },
                "travian description": "The Senator is the tribe's chosen leader. He's a good speaker and knows how to convince others. He is able to persuade other villages to fight for your empire.            Every time the Senator speaks to the inhabitants of a village, the enemy's loyalty value decreases until the village is yours.",
                "pre-requisites": "Rally Point Level 10, Academy Level 20"
            },
            {
                "tribe": "Romans",
                "name": "Settler",
                "type": "Settler",
                "role": "Utility",
                "resourceCost": {
                    "wood": 4600,
                    "clay": 4200,
                    "iron": 5800,
                    "crops": 4400
                },
                "stats": {
                    "attack": 0,
                    "defense": 80,
                    "cavDef": 80,
                    "velocity": 5,
                    "carry": 3000,
                    "upkeep": 1,
                    "trainingTime": 26900
                },
                "travian description": "Settlers are brave and daring citizens who move out of the village after much training to establish a new village in your honor.            As both the journey and the founding of the new village are very difficult, three settlers must stick together. They need a basic supplies of 750 units per resource.            ",
                "pre-requisites": "Palace Level 10 or Residence Level 10"
            },
            {
                "tribe": "Teutons",
                "name": "Clubswinger",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 95,
                    "clay": 75,
                    "iron": 40,
                    "crops": 40
                },
                "stats": {
                    "attack": 40,
                    "defense": 20,
                    "cavDef": 5,
                    "velocity": 7,
                    "carry": 60,
                    "upkeep": 1,
                    "trainingTime": 720
                },
                "travian description": "Clubswingers are the cheapest unit in Travian. They are quickly trained and have medium attack capabilities, but their armor isn’t the best. Clubswingers are almost defenceless against cavalry and will be ridden down with ease.",
                "pre-requisites": "Barracks level 1"
            },
            {
                "tribe": "Teutons",
                "name": "Spearman",
                "type": "Infantry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 145,
                    "clay": 70,
                    "iron": 85,
                    "crops": 40
                },
                "stats": {
                    "attack": 10,
                    "defense": 35,
                    "cavDef": 60,
                    "velocity": 7,
                    "carry": 40,
                    "upkeep": 1,
                    "trainingTime": 1120
                },
                "travian description": "In the Teuton army, the Spearman’s task is defence. He is especially good against cavalry thanks to his weapons' length.",
                "pre-requisites": "Academy Level 1, Barracks Level 3"
            },
            {
                "tribe": "Teutons",
                "name": "Axeman",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 130,
                    "clay": 120,
                    "iron": 170,
                    "crops": 70
                },
                "stats": {
                    "attack": 60,
                    "defense": 30,
                    "cavDef": 30,
                    "velocity": 6,
                    "carry": 50,
                    "upkeep": 1,
                    "trainingTime": 1200
                },
                "travian description": "This is the Teuton's strongest infantry unit. He is strong at both offence and defence but he is slower and more expensive than other units.",
                "pre-requisites": "Academy Level 3, Smithy Level 1"
            },
            {
                "tribe": "Teutons",
                "name": "Scout",
                "type": "Cavalry",
                "role": "Scout",
                "resourceCost": {
                    "wood": 160,
                    "clay": 100,
                    "iron": 50,
                    "crops": 50
                },
                "stats": {
                    "attack": 0,
                    "defense": 10,
                    "cavDef": 5,
                    "velocity": 9,
                    "carry": 0,
                    "upkeep": 1,
                    "trainingTime": 1120
                },
                "travian description": "The Scout moves far ahead of the Teuton troops in order to get an impression of the enemy's strength and his villages. He moves on foot, which makes him slower than his Roman or Gaul counterparts. He scouts the enemy units, resources and fortifications. If there are no enemy Scouts, Pathfinders or Equites Legati in the scouted village then the scouting remains unnoticed.",
                "pre-requisites": "Academy Level 1, Main Building Level 5"
            },
            {
                "tribe": "Teutons",
                "name": "Paladin",
                "type": "Cavalry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 370,
                    "clay": 270,
                    "iron": 290,
                    "crops": 75
                },
                "stats": {
                    "attack": 55,
                    "defense": 100,
                    "cavDef": 40,
                    "velocity": 10,
                    "carry": 110,
                    "upkeep": 2,
                    "trainingTime": 2400
                },
                "travian description": "As they are equipped with heavy armor, Paladins are a great defensive unit. Infantry will find it especially difficult to overcome his mighty shield. Unfortunately, their attacking capabilities are rather low and their speed, compared to other cavalry units, is below average. Their training takes very long and is rather expensive.",
                "pre-requisites": "Academy Level 5, Stable Level 3"
            },
            {
                "tribe": "Teutons",
                "name": "Teutonic Knight",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 450,
                    "clay": 515,
                    "iron": 480,
                    "crops": 80
                },
                "stats": {
                    "attack": 150,
                    "defense": 50,
                    "cavDef": 75,
                    "velocity": 9,
                    "carry": 80,
                    "upkeep": 3,
                    "trainingTime": 2960
                },
                "travian description": "The Teutonic Knight is a formidable warrior and instills fear and despair in his foes. In defence, he stands out against enemy cavalry. However, the cost of training and feeding him is extraordinary.",
                "pre-requisites": "Academy Level 15, Stable Level 10"
            },
            {
                "tribe": "Teutons",
                "name": "Ram",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 1000,
                    "clay": 300,
                    "iron": 350,
                    "crops": 70
                },
                "stats": {
                    "attack": 65,
                    "defense": 30,
                    "cavDef": 80,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 3,
                    "trainingTime": 4200
                },
                "travian description": "The Ram is a heavy support weapon for your infantry and cavalry. Its task is to destroy enemy walls and therefore increase your troops’ chances of overcoming the enemy's fortifications.",
                "pre-requisites": "Academy Level 10, Workshop Level 1"
            },
            {
                "tribe": "Teutons",
                "name": "Catapult",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 900,
                    "clay": 1200,
                    "iron": 600,
                    "crops": 60
                },
                "stats": {
                    "attack": 50,
                    "defense": 60,
                    "cavDef": 10,
                    "velocity": 3,
                    "carry": 0,
                    "upkeep": 6,
                    "trainingTime": 9000
                },
                "travian description": "The Catapult is an excellent long-distance weapon; it is used to destroy the fields and buildings of enemy villages. However, without escorting troops it is almost defenceless, so don't forget to send some of your troops with it. Having a high-level rally point makes your catapults more accurate and gives you the option to target additional enemy buildings. More information is available here. HINT: Catapults CAN hit the cranny, trappers or stonemason's lodges when they target randomly.",
                "pre-requisites": "Workshop Level 10, Academy Level 15"
            },
            {
                "tribe": "Teutons",
                "name": "Chief",
                "type": "Chief",
                "role": "Utility",
                "resourceCost": {
                    "wood": 35500,
                    "clay": 26600,
                    "iron": 25000,
                    "crops": 27200
                },
                "stats": {
                    "attack": 40,
                    "defense": 60,
                    "cavDef": 40,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 4,
                    "trainingTime": 70500
                },
                "travian description": "Among their best, the Teutons choose their Chief. To be chosen, bravery and strategy aren't enough; you also have to be a formidable speaker as it is the Chief's primary objective to convince the population of foreign villages to join the Chief's tribe. The more often the Chief speaks to the population of a village, the more the loyalty of the village sinks until it finally joins the chief's tribe.",
                "pre-requisites": "Rally Point Level 5, Academy Level 20"
            },
            {
                "tribe": "Teutons",
                "name": "Settler",
                "type": "Settler",
                "role": "Utility",
                "resourceCost": {
                    "wood": 5800,
                    "clay": 4400,
                    "iron": 4600,
                    "crops": 5200
                },
                "stats": {
                    "attack": 10,
                    "defense": 80,
                    "cavDef": 80,
                    "velocity": 5,
                    "carry": 3000,
                    "upkeep": 1,
                    "trainingTime": 31000
                },
                "travian description": "Settlers are brave and daring citizens who move out of the village after much training to establish a new village in your honor.            As both the journey and the founding of the new village are very difficult, three settlers must stick together. They need a basic supplies of 750 units per resource.            ",
                "pre-requisites": "Palace Level 10 or Residence Level 10"
            },
            {
                "tribe": "Gauls",
                "name": "Phalanx",
                "type": "Infantry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 100,
                    "clay": 130,
                    "iron": 55,
                    "crops": 30
                },
                "stats": {
                    "attack": 15,
                    "defense": 40,
                    "cavDef": 50,
                    "velocity": 7,
                    "carry": 35,
                    "upkeep": 1,
                    "trainingTime": 1040
                },
                "travian description": "Since they are infantry, the Phalanx is cheap and fast to produce. Though their attack power is low, in defence they are quite strong against both infantry and cavalry.",
                "pre-requisites": "Barracks Level 1"
            },
            {
                "tribe": "Gauls",
                "name": "Swordsman",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 140,
                    "clay": 150,
                    "iron": 185,
                    "crops": 60
                },
                "stats": {
                    "attack": 65,
                    "defense": 35,
                    "cavDef": 25,
                    "velocity": 6,
                    "carry": 45,
                    "upkeep": 1,
                    "trainingTime": 1440
                },
                "travian description": "The Swordsmen are more expensive than the Phalanx, but they are an offensive unit. They are quite weak in defence, especially against cavalry.",
                "pre-requisites": "Academy Level 3, Smithy Level 1"
            },
            {
                "tribe": "Gauls",
                "name": "Pathfinder",
                "type": "Cavalry",
                "role": "Scout",
                "resourceCost": {
                    "wood": 170,
                    "clay": 150,
                    "iron": 20,
                    "crops": 40
                },
                "stats": {
                    "attack": 0,
                    "defense": 20,
                    "cavDef": 10,
                    "velocity": 17,
                    "carry": 0,
                    "upkeep": 2,
                    "trainingTime": 1360
                },
                "travian description": "The Pathfinder is the Gaul's reconnaissance unit. They are very fast and they can make a surreptitious advance on enemy units, resources or buildings in order to spy on them.            If there aren't any Scouts, Equites Legati or Pathfinders in the scouted village, the scouting remains unnoticed.",
                "pre-requisites": "Academy Level 5, Stable Level 1"
            },
            {
                "tribe": "Gauls",
                "name": "Theutates Thunder",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 350,
                    "clay": 450,
                    "iron": 230,
                    "crops": 60
                },
                "stats": {
                    "attack": 100,
                    "defense": 25,
                    "cavDef": 40,
                    "velocity": 19,
                    "carry": 75,
                    "upkeep": 2,
                    "trainingTime": 2480
                },
                "travian description": "Theutates Thunders are very fast and powerful cavalry units. They can carry a large amount of resources which makes them excellent raiders too.            When it comes to defence, their abilities are average at best.",
                "pre-requisites": "Academy Level 5, Stable Level 3"
            },
            {
                "tribe": "Gauls",
                "name": "Druidrider",
                "type": "Cavalry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 360,
                    "clay": 330,
                    "iron": 280,
                    "crops": 120
                },
                "stats": {
                    "attack": 45,
                    "defense": 115,
                    "cavDef": 55,
                    "velocity": 16,
                    "carry": 35,
                    "upkeep": 2,
                    "trainingTime": 2480
                },
                "travian description": "This medium cavalry unit is brilliant at defence. The main purpose of the Druidrider is to defend against enemy infantry. Its training cost and food supply are relatively expensive.",
                "pre-requisites": "Academy Level 5, Stable Level 5"
            },
            {
                "tribe": "Gauls",
                "name": "Haeduan",
                "type": "Cavalry",
                "role": "Hybrid",
                "resourceCost": {
                    "wood": 500,
                    "clay": 620,
                    "iron": 675,
                    "crops": 170
                },
                "stats": {
                    "attack": 140,
                    "defense": 60,
                    "cavDef": 165,
                    "velocity": 13,
                    "carry": 65,
                    "upkeep": 3,
                    "trainingTime": 3120
                },
                "travian description": "SThe Haeduans are the Gaul's ultimate weapon for both offence and defence against cavalry. Few units can match their prowess.            However, their training and equipment are very expensive. So you should think very carefully if they will be worth the effort and expenses.",
                "pre-requisites": "Academy Level 15, Stable Level 10"
            },
            {
                "tribe": "Gauls",
                "name": "Ram",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 950,
                    "clay": 555,
                    "iron": 330,
                    "crops": 75
                },
                "stats": {
                    "attack": 50,
                    "defense": 30,
                    "cavDef": 105,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 3,
                    "trainingTime": 5000
                },
                "travian description": "The Ram is a heavy support weapon for your infantry and cavalry. Its task is to destroy the enemy walls and thus increase your troops’ chances of overcoming the enemy's fortifications.",
                "pre-requisites": "Academy Level 10, Workshop Level 1"
            },
            {
                "tribe": "Gauls",
                "name": "Trebuchet",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 960,
                    "clay": 1450,
                    "iron": 630,
                    "crops": 90
                },
                "stats": {
                    "attack": 70,
                    "defense": 45,
                    "cavDef": 10,
                    "velocity": 3,
                    "carry": 0,
                    "upkeep": 6,
                    "trainingTime": 9000
                },
                "travian description": "The Trebuchet is an excellent long-distance weapon; it is used to destroy the fields and buildings of enemy villages. However, without escorting troops it is almost defenceless, so don't forget to send some of your troops with it.            Having a high-level rally point makes your catapults more accurate and gives you the option to target additional enemy buildings. More information is available here.            HINT: Catapults CAN hit the cranny, trappers or stonemason's lodges when they target randomly.",
                "pre-requisites": "Workshop Level 10, Academy Level 15"
            },
            {
                "tribe": "Gauls",
                "name": "Chieftain",
                "type": "Chief",
                "role": "Utility",
                "resourceCost": {
                    "wood": 30750,
                    "clay": 45400,
                    "iron": 31000,
                    "crops": 37500
                },
                "stats": {
                    "attack": 40,
                    "defense": 50,
                    "cavDef": 50,
                    "velocity": 5,
                    "carry": 0,
                    "upkeep": 4,
                    "trainingTime": 90700
                },
                "travian description": "Each tribe has an ancient and experienced fighter whose presence and speeches are able to convince the population of enemy villages to join his tribe.            The more often the Chieftain speaks in front of the walls of an enemy village, the more its loyalty sinks until it joins the Chieftain's tribe.",
                "pre-requisites": "Rally Point Level 10, Academy Level 20"
            },
            {
                "tribe": "Gauls",
                "name": "Settler",
                "type": "Settler",
                "role": "Utility",
                "resourceCost": {
                    "wood": 4400,
                    "clay": 5600,
                    "iron": 4200,
                    "crops": 3900
                },
                "stats": {
                    "attack": 0,
                    "defense": 80,
                    "cavDef": 80,
                    "velocity": 5,
                    "carry": 3000,
                    "upkeep": 1,
                    "trainingTime": 22700
                },
                "travian description": "Settlers are brave and daring citizens who move out of the village after much training to establish a new village in your honor.            As both the journey and the founding of the new village are very difficult, three settlers must stick together. They need a basic supplies of 750 units per resource.            ",
                "pre-requisites": "Palace Level 10 or Residence Level 10"
            },
            {
                "tribe": "Egyptians",
                "name": "Slave Militia",
                "type": "Infantry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 45,
                    "clay": 60,
                    "iron": 30,
                    "crops": 15
                },
                "stats": {
                    "attack": 10,
                    "defense": 30,
                    "cavDef": 20,
                    "velocity": 7,
                    "carry": 15,
                    "upkeep": 1,
                    "trainingTime": 530
                },
                "travian description": "The Slave Militia is the cheapest unit with the shortest production time in the game. While this allows you to raise a defense very quickly, it compares poorly in fighting strength to other defensive troops.",
                "pre-requisites": "Barracks Level 1"
            },
            {
                "tribe": "Egyptians",
                "name": "Ash Warden",
                "type": "Infantry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 115,
                    "clay": 100,
                    "iron": 145,
                    "crops": 60
                },
                "stats": {
                    "attack": 30,
                    "defense": 55,
                    "cavDef": 40,
                    "velocity": 6,
                    "carry": 50,
                    "upkeep": 1,
                    "trainingTime": 1380
                },
                "travian description": "The Ash Warden is your standard defensive foot soldier with solid combat power. They fare exceptionally well against other infantry, yet its defense against cavalry should not be overlooked.",
                "pre-requisites": "Academy Level 1, Smithy Level 1"
            },
            {
                "tribe": "Egyptians",
                "name": "Khopesh Warrior",
                "type": "Infantry",
                "role": "Hybrid",
                "resourceCost": {
                    "wood": 170,
                    "clay": 180,
                    "iron": 220,
                    "crops": 80
                },
                "stats": {
                    "attack": 65,
                    "defense": 50,
                    "cavDef": 20,
                    "velocity": 7,
                    "carry": 45,
                    "upkeep": 1,
                    "trainingTime": 1440
                },
                "travian description": "The Khopesh Warrior is an elite soldier boasting a strong offense and remarkable defense against other warriors on foot.",
                "pre-requisites": "Academy Level 5, Smithy Level 1"
            },
            {
                "tribe": "Egyptians",
                "name": "Sopdu Explorer",
                "type": "Cavalry",
                "role": "Scout",
                "resourceCost": {
                    "wood": 170,
                    "clay": 150,
                    "iron": 20,
                    "crops": 40
                },
                "stats": {
                    "attack": 0,
                    "defense": 20,
                    "cavDef": 10,
                    "velocity": 16,
                    "carry": 0,
                    "upkeep": 2,
                    "trainingTime": 1360
                },
                "travian description": "The Sopdu Explorer rides out into unknown territory to explore the area and count the soldiers of your enemies. They are also able to critically examine opposing villages and detect any weak points.",
                "pre-requisites": "Stable Level 1, Academy Level 5"
            },
            {
                "tribe": "Egyptians",
                "name": "Anhur Guard",
                "type": "Cavalry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 360,
                    "clay": 330,
                    "iron": 280,
                    "crops": 120
                },
                "stats": {
                    "attack": 50,
                    "defense": 110,
                    "cavDef": 50,
                    "velocity": 15,
                    "carry": 50,
                    "upkeep": 2,
                    "trainingTime": 2560
                },
                "travian description": "The Anhur Guard is a mounted defender that dominates any attacking infantry. In addition to moderate prowess in offense and defense against cavalry, they are the fastest Egyptian unit after the Sopdu Explorer.",
                "pre-requisites": "Stable Level 5, Academy Level 5"
            },
            {
                "tribe": "Egyptians",
                "name": "Resheph Chariot",
                "type": "Cavalry",
                "role": "Hybrid",
                "resourceCost": {
                    "wood": 450,
                    "clay": 560,
                    "iron": 610,
                    "crops": 180
                },
                "stats": {
                    "attack": 110,
                    "defense": 120,
                    "cavDef": 150,
                    "velocity": 10,
                    "carry": 70,
                    "upkeep": 3,
                    "trainingTime": 3240
                },
                "travian description": "The Resheph Chariot is well-versed in all fields of combat. It packs a heavy offensive punch as well as a very solid defense against infantry, though it truly excels at defending against cavalry. In return, they are very costly to train and consume plenty of crop.",
                "pre-requisites": "Stable Level 10, Academy Level 15"
            },
            {
                "tribe": "Egyptians",
                "name": "Ram",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 995,
                    "clay": 575,
                    "iron": 340,
                    "crops": 80
                },
                "stats": {
                    "attack": 55,
                    "defense": 30,
                    "cavDef": 95,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 3,
                    "trainingTime": 4800
                },
                "travian description": "The Ram is a heavy support weapon for your infantry and cavalry. Its task is to destroy the enemy walls and therefore increase your troops’ chances of overcoming the enemy's fortifications.",
                "pre-requisites": "Academy Level 10, Workshop Level 1"
            },
            {
                "tribe": "Egyptians",
                "name": "Stone Catapult",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 980,
                    "clay": 1510,
                    "iron": 660,
                    "crops": 100
                },
                "stats": {
                    "attack": 65,
                    "defense": 55,
                    "cavDef": 10,
                    "velocity": 3,
                    "carry": 0,
                    "upkeep": 6,
                    "trainingTime": 9000
                },
                "travian description": "The Stone Catapult is an excellent long-distance weapon; it is used to destroy the fields and buildings of enemy villages. However, without escorting troops, it is virtually defenseless, so don't forget to send some of your troops with it.            Having a high-level rally point makes your catapults more accurate and gives you the option to target additional enemy buildings. More information is available here. HINT: Catapults CAN hit the cranny, trappers or stonemason's lodges when they target randomly.",
                "pre-requisites": "Workshop Level 10, Academy Level 15"
            },
            {
                "tribe": "Egyptians",
                "name": "Nomarch",
                "type": "Chief",
                "role": "Utility",
                "resourceCost": {
                    "wood": 34000,
                    "clay": 50000,
                    "iron": 34000,
                    "crops": 42000
                },
                "stats": {
                    "attack": 40,
                    "defense": 50,
                    "cavDef": 50,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 4,
                    "trainingTime": 90700
                },
                "travian description": "The Nomarch is the administrative leader of the Egyptians. They negotiate terms of surrender and, thanks to their charisma, they can win over enemy people to join your empire.            With every visit of the Nomarch, the loyalty of the enemy’s population decreases until it is reduced to nothing and the people accept your rule.",
                "pre-requisites": "Rally Point Level 10, Academy Level 20"
            },
            {
                "tribe": "Egyptians",
                "name": "Settler",
                "type": "Settler",
                "role": "Utility",
                "resourceCost": {
                    "wood": 5040,
                    "clay": 6510,
                    "iron": 4830,
                    "crops": 4620
                },
                "stats": {
                    "attack": 0,
                    "defense": 80,
                    "cavDef": 80,
                    "velocity": 10,
                    "carry": 3000,
                    "upkeep": 1,
                    "trainingTime": 24800
                },
                "travian description": "Settlers are brave and daring citizens who move out of the village after much training to establish a new village in your honor.            As both the journey and the founding of the new village are very difficult, three settlers must stick together. They need a basic supplies of 750 units per resource.            ",
                "pre-requisites": "Palace Level 10 or Residence Level 10"
            },
            {
                "tribe": "Huns",
                "name": "Mercenary",
                "type": "Infantry",
                "role": "Hybrid",
                "resourceCost": {
                    "wood": 130,
                    "clay": 80,
                    "iron": 40,
                    "crops": 40
                },
                "stats": {
                    "attack": 35,
                    "defense": 40,
                    "cavDef": 30,
                    "velocity": 6,
                    "carry": 50,
                    "upkeep": 1,
                    "trainingTime": 810
                },
                "travian description": "The Mercenary is a jack-of-all-trades. Their offensive and defensive performance can easily be compared to other units, but they do not excel in any form of combat. However, their moderate abilities are reflected by their moderate training costs.",
                "pre-requisites": "Barracks Level 1"
            },
            {
                "tribe": "Huns",
                "name": "Bowman",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 140,
                    "clay": 110,
                    "iron": 60,
                    "crops": 60
                },
                "stats": {
                    "attack": 50,
                    "defense": 30,
                    "cavDef": 10,
                    "velocity": 6,
                    "carry": 30,
                    "upkeep": 1,
                    "trainingTime": 1120
                },
                "travian description": "The Bowman is your first choice for large offensive strikes. They love to be at the front lines, which is fortunate because of their puny defensive skills.",
                "pre-requisites": "Academy Level 3, Smithy Level 1"
            },
            {
                "tribe": "Huns",
                "name": "Spotter",
                "type": "Cavalry",
                "role": "Scout",
                "resourceCost": {
                    "wood": 170,
                    "clay": 150,
                    "iron": 20,
                    "crops": 40
                },
                "stats": {
                    "attack": 0,
                    "defense": 20,
                    "cavDef": 10,
                    "velocity": 19,
                    "carry": 0,
                    "upkeep": 2,
                    "trainingTime": 1360
                },
                "travian description": "The Spotter is a lightning-fast scout unit who detects the military and economic secrets of your enemies‘ villages and relays them back to you.",
                "pre-requisites": "Academy Level 5, Stable Level 1"
            },
            {
                "tribe": "Huns",
                "name": "Steppe Rider",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 290,
                    "clay": 370,
                    "iron": 190,
                    "crops": 45
                },
                "stats": {
                    "attack": 120,
                    "defense": 30,
                    "cavDef": 15,
                    "velocity": 16,
                    "carry": 75,
                    "upkeep": 2,
                    "trainingTime": 2400
                },
                "travian description": "The Steppe Rider is an outstanding attacker who undergoes training faster than most other mounted warriors. As a result, however, they are very weak in defensive combat.",
                "pre-requisites": "Academy Level 5, Stable Level 3"
            },
            {
                "tribe": "Huns",
                "name": "Marksman",
                "type": "Cavalry",
                "role": "Hybrid",
                "resourceCost": {
                    "wood": 320,
                    "clay": 350,
                    "iron": 330,
                    "crops": 50
                },
                "stats": {
                    "attack": 110,
                    "defense": 80,
                    "cavDef": 70,
                    "velocity": 15,
                    "carry": 105,
                    "upkeep": 2,
                    "trainingTime": 2480
                },
                "travian description": "The Marksman is a well-rounded cavalry unit. Their solid attacking power is overshadowed by the fact that they are the only proficient defensive soldier of the Huns.",
                "pre-requisites": "Academy Level 5, Stable Level 5"
            },
            {
                "tribe": "Huns",
                "name": "Marauder",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 450,
                    "clay": 560,
                    "iron": 610,
                    "crops": 140
                },
                "stats": {
                    "attack": 180,
                    "defense": 60,
                    "cavDef": 40,
                    "velocity": 14,
                    "carry": 80,
                    "upkeep": 3,
                    "trainingTime": 2990
                },
                "travian description": "The Marauder is an absolute force to be reckoned with. With incredible attacking power and impressive speed, it overruns most defenses without a scratch on its armor.",
                "pre-requisites": "Academy Level 15, Stable Level 10"
            },
            {
                "tribe": "Huns",
                "name": "Ram",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 1060,
                    "clay": 330,
                    "iron": 360,
                    "crops": 70
                },
                "stats": {
                    "attack": 65,
                    "defense": 30,
                    "cavDef": 90,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 3,
                    "trainingTime": 4400
                },
                "travian description": "The Ram is a heavy support weapon for your infantry and cavalry. Its task is to destroy the enemy walls and therefore increase your troops’ chances of overcoming the enemy's fortifications.",
                "pre-requisites": "Academy Level 10, Workshop Level 1"
            },
            {
                "tribe": "Huns",
                "name": "Catapult",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 950,
                    "clay": 1280,
                    "iron": 620,
                    "crops": 60
                },
                "stats": {
                    "attack": 45,
                    "defense": 55,
                    "cavDef": 10,
                    "velocity": 3,
                    "carry": 0,
                    "upkeep": 6,
                    "trainingTime": 9000
                },
                "travian description": "The Catapult is an excellent long-distance weapon; it is used to destroy the fields and buildings of enemy villages. However, without escorting troops, it is virtually defenseless, so don't forget to send some of your troops with it.            Having a high-level rally point makes your catapults more accurate and gives you the option to target additional enemy buildings. More information is available here. HINT: Catapults CAN hit the cranny, trappers or stonemason's lodges when they target randomly.",
                "pre-requisites": "Workshop Level 10, Academy Level 15"
            },
            {
                "tribe": "Huns",
                "name": "Logades",
                "type": "Chief",
                "role": "Utility",
                "resourceCost": {
                    "wood": 37200,
                    "clay": 27600,
                    "iron": 25200,
                    "crops": 27600
                },
                "stats": {
                    "attack": 50,
                    "defense": 40,
                    "cavDef": 30,
                    "velocity": 5,
                    "carry": 0,
                    "upkeep": 4,
                    "trainingTime": 90700
                },
                "travian description": "The Logades have earned their position by defeating all challengers in a deadly battle of physical and mental prowess. Now they only leave home to conquer. Every time they step into the village of an enemy, their powerful presence reduces the loyalty of the people to their previous owner, until they decide to join your command.",
                "pre-requisites": "Rally Point Level 10, Academy Level 20"
            },
            {
                "tribe": "Huns",
                "name": "Settler",
                "type": "Settler",
                "role": "Utility",
                "resourceCost": {
                    "wood": 6100,
                    "clay": 4600,
                    "iron": 4800,
                    "crops": 5400
                },
                "stats": {
                    "attack": 10,
                    "defense": 80,
                    "cavDef": 80,
                    "velocity": 5,
                    "carry": 3000,
                    "upkeep": 1,
                    "trainingTime": 28950
                },
                "travian description": "Settlers are brave and daring citizens who move out of the village after much training to establish a new village in your honor.            As both the journey and the founding of the new village are very difficult, three settlers must stick together. They need a basic supplies of 750 units per resource.",
                "pre-requisites": "Palace Level 10 or Residence Level 10 or Command Center Level 10"
            },
            {
                "tribe": "Spartans",
                "name": "Hoplite",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 110,
                    "clay": 185,
                    "iron": 110,
                    "crops": 35
                },
                "stats": {
                    "attack": 50,
                    "defense": 35,
                    "cavDef": 30,
                    "velocity": 6,
                    "carry": 60,
                    "upkeep": 1,
                    "trainingTime": 1700
                },
                "travian description": "",
                "pre-requisites": "Barracks level 1"
            },
            {
                "tribe": "Spartans",
                "name": "Sentinel",
                "type": "Infantry",
                "role": "Scout",
                "resourceCost": {
                    "wood": 185,
                    "clay": 150,
                    "iron": 35,
                    "crops": 75
                },
                "stats": {
                    "attack": 0,
                    "defense": 40,
                    "cavDef": 22,
                    "velocity": 9,
                    "carry": 0,
                    "upkeep": 1,
                    "trainingTime": 1232
                },
                "travian description": "",
                "pre-requisites": "Smithy level 1, Acedemy level 1"
            },
            {
                "tribe": "Spartans",
                "name": "Shieldsman",
                "type": "Infantry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 145,
                    "clay": 95,
                    "iron": 245,
                    "crops": 45
                },
                "stats": {
                    "attack": 40,
                    "defense": 85,
                    "cavDef": 45,
                    "velocity": 8,
                    "carry": 40,
                    "upkeep": 1,
                    "trainingTime": 1936
                },
                "travian description": "",
                "pre-requisites": "Smithy level 1, Academy level 5"
            },
            {
                "tribe": "Spartans",
                "name": "Twinsteel Therion",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 130,
                    "clay": 200,
                    "iron": 400,
                    "crops": 65
                },
                "stats": {
                    "attack": 90,
                    "defense": 55,
                    "cavDef": 40,
                    "velocity": 6,
                    "carry": 50,
                    "upkeep": 1,
                    "trainingTime": 2112
                },
                "travian description": "",
                "pre-requisites": "Smithy level 5, Academy level 10"
            },
            {
                "tribe": "Spartans",
                "name": "Eplida Rider",
                "type": "Cavalry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 555,
                    "clay": 445,
                    "iron": 330,
                    "crops": 110
                },
                "stats": {
                    "attack": 55,
                    "defense": 120,
                    "cavDef": 90,
                    "velocity": 16,
                    "carry": 110,
                    "upkeep": 2,
                    "trainingTime": 2756
                },
                "travian description": "",
                "pre-requisites": "Stable level 1, Academy level 5"
            },
            {
                "tribe": "Spartans",
                "name": "Corinthian Crusher",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 660,
                    "clay": 495,
                    "iron": 995,
                    "crops": 165
                },
                "stats": {
                    "attack": 195,
                    "defense": 80,
                    "cavDef": 75,
                    "velocity": 9,
                    "carry": 80,
                    "upkeep": 3,
                    "trainingTime": 3432
                },
                "travian description": "",
                "pre-requisites": "Stable level 10, Academy level 5"
            },
            {
                "tribe": "Spartans",
                "name": "Ram",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 525,
                    "clay": 260,
                    "iron": 790,
                    "crops": 130
                },
                "stats": {
                    "attack": 65,
                    "defense": 30,
                    "cavDef": 80,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 3,
                    "trainingTime": 4620
                },
                "travian description": "",
                "pre-requisites": "Workshop level 10, Academy level 15"
            },
            {
                "tribe": "Spartans",
                "name": "Ephor",
                "type": "Chief",
                "role": "Utility",
                "resourceCost": {
                    "wood": 33450,
                    "clay": 30665,
                    "iron": 36240,
                    "crops": 13935
                },
                "stats": {
                    "attack": 40,
                    "defense": 60,
                    "cavDef": 40,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 4,
                    "trainingTime": 76890
                },
                "travian description": "",
                "pre-requisites": "Rally point level 10, Academy level 20"
            },
            {
                "tribe": "Spartans",
                "name": "Settler",
                "type": "Settler",
                "role": "Utility",
                "resourceCost": {
                    "wood": 5115,
                    "clay": 5580,
                    "iron": 6045,
                    "crops": 3255
                },
                "stats": {
                    "attack": 10,
                    "defense": 80,
                    "cavDef": 80,
                    "velocity": 5,
                    "carry": 3000,
                    "upkeep": 1,
                    "trainingTime": 34100
                },
                "travian description": "",
                "pre-requisites": "Palace Level 10 or Residence Level 10"
            },
            {
                "tribe": "Vikings",
                "name": "Thrall",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 95,
                    "clay": 80,
                    "iron": 50,
                    "crops": 40
                },
                "stats": {
                    "attack": 45,
                    "defense": 22,
                    "cavDef": 5,
                    "velocity": 7,
                    "carry": 55,
                    "upkeep": 1,
                    "trainingTime": 800
                },
                "travian description": "",
                "pre-requisites": "Barracks level 1"
            },
            {
                "tribe": "Vikings",
                "name": "Shield Maiden",
                "type": "Infantry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 125,
                    "clay": 70,
                    "iron": 85,
                    "crops": 40
                },
                "stats": {
                    "attack": 20,
                    "defense": 50,
                    "cavDef": 30,
                    "velocity": 7,
                    "carry": 40,
                    "upkeep": 1,
                    "trainingTime": 1080
                },
                "travian description": "",
                "pre-requisites": "Academy Level 1, Smithy Level 1"
            },
            {
                "tribe": "Vikings",
                "name": "Berserker",
                "type": "Infantry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 235,
                    "clay": 220,
                    "iron": 200,
                    "crops": 70
                },
                "stats": {
                    "attack": 70,
                    "defense": 30,
                    "cavDef": 25,
                    "velocity": 5,
                    "carry": 75,
                    "upkeep": 2,
                    "trainingTime": 1550
                },
                "travian description": "",
                "pre-requisites": "Academy Level 10, Smithy Level 5"
            },
            {
                "tribe": "Vikings",
                "name": "Heimdall's Eye",
                "type": "Cavalry",
                "role": "Scout",
                "resourceCost": {
                    "wood": 155,
                    "clay": 95,
                    "iron": 50,
                    "crops": 50
                },
                "stats": {
                    "attack": 0,
                    "defense": 10,
                    "cavDef": 5,
                    "velocity": 9,
                    "carry": 0,
                    "upkeep": 1,
                    "trainingTime": 1120
                },
                "travian description": "",
                "pre-requisites": "Smithy level 1, Acedemy level 1"
            },
            {
                "tribe": "Vikings",
                "name": "Huskarl Rider",
                "type": "Cavalry",
                "role": "Defense",
                "resourceCost": {
                    "wood": 385,
                    "clay": 295,
                    "iron": 290,
                    "crops": 85
                },
                "stats": {
                    "attack": 45,
                    "defense": 95,
                    "cavDef": 100,
                    "velocity": 12,
                    "carry": 110,
                    "upkeep": 2,
                    "trainingTime": 2650
                },
                "travian description": "",
                "pre-requisites": "Stable Level 1, Academy Level 5"
            },
            {
                "tribe": "Vikings",
                "name": "Valkyrie's Blessing",
                "type": "Cavalry",
                "role": "Offense",
                "resourceCost": {
                    "wood": 475,
                    "clay": 535,
                    "iron": 515,
                    "crops": 100
                },
                "stats": {
                    "attack": 160,
                    "defense": 50,
                    "cavDef": 75,
                    "velocity": 9,
                    "carry": 80,
                    "upkeep": 2,
                    "trainingTime": 3060
                },
                "travian description": "",
                "pre-requisites": "Stable level 10, Academy level 5"
            },
            {
                "tribe": "Vikings",
                "name": "Ram",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 950,
                    "clay": 325,
                    "iron": 375,
                    "crops": 70
                },
                "stats": {
                    "attack": 65,
                    "defense": 30,
                    "cavDef": 80,
                    "velocity": 4,
                    "carry": 0,
                    "upkeep": 3,
                    "trainingTime": 4200
                },
                "travian description": "",
                "pre-requisites": "Academy Level 10, Workshop Level 1"
            },
            {
                "tribe": "Vikings",
                "name": "Catapult",
                "type": "Siege",
                "role": "Utility",
                "resourceCost": {
                    "wood": 850,
                    "clay": 1225,
                    "iron": 625,
                    "crops": 60
                },
                "stats": {
                    "attack": 50,
                    "defense": 60,
                    "cavDef": 10,
                    "velocity": 3,
                    "carry": 0,
                    "upkeep": 6,
                    "trainingTime": 9000
                },
                "travian description": "",
                "pre-requisites": "Academy Level 10, Workshop Level 1"
            },
            {
                "tribe": "Vikings",
                "name": "Jarl",
                "type": "Chief",
                "role": "Utility",
                "resourceCost": {
                    "wood": 35500,
                    "clay": 26600,
                    "iron": 25000,
                    "crops": 27200
                },
                "stats": {
                    "attack": 40,
                    "defense": 40,
                    "cavDef": 60,
                    "velocity": 5,
                    "carry": 0,
                    "upkeep": 4,
                    "trainingTime": 70500
                },
                "travian description": "",
                "pre-requisites": "Rally Point Level 10, Academy Level 20"
            },
            {
                "tribe": "Vikings",
                "name": "Vikings",
                "type": "Settler",
                "role": "Utility",
                "resourceCost": {
                    "wood": 5800,
                    "clay": 4600,
                    "iron": 4800,
                    "crops": 4800
                },
                "stats": {
                    "attack": 10,
                    "defense": 80,
                    "cavDef": 80,
                    "velocity": 5,
                    "carry": 3000,
                    "upkeep": 1,
                    "trainingTime": 31000
                },
                "travian description": "",
                "pre-requisites": "Palace Level 10 or Residence Level 10"
            }
        ]
    }
}