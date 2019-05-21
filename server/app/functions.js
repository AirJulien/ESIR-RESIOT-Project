const KNXConfigModel = require('./models/knxConfig');
const ScenarioModel = require('./models/scenario');
const schedule = require('node-schedule');
const knx = require('knx');
let connectionsList = []
let scenarioList = []

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.initConnections = async () => {
    const allConfigs = await KNXConfigModel.find({}, (err, results) => {
        if (err) return []
        return results
    })
    allConfigs.forEach((config) => {
        const connection = new(require('./connection'))()
        connection.ipPort = config.port
        connection.ipAddr = config.ipAddr
        connection._id = config._id
        const myConnection = new knx.Connection(connection)
       // myConnection._id = config._id
        connection.name = config.name
        connection.interval = 1000
        connection.startChain = false
        connection.lights = config.lights
        connection.sensDirect = true
        if (myConnection.connect) connection.connect = true
        connectionsList.push({
            params: connection,
            connection: myConnection
        })
    })
}

exports.addConnection = (config) => {
    const connection = new(require('./connection'))()
    connection.ipPort = config.port
    connection.ipAddr = config.ipAddr
    connection._id = config._id
    const myConnection = new knx.Connection(connection)
    //myConnection._id = config._id
    connection.name = config.name
    connection.interval = 1000
    connection.startChain = false
    connection.lights = config.lights
    connection.sensDirect = true
    if (myConnection.connect) connection.connect = true
    connectionsList.push({
        params: connection,
        connection: myConnection
    })
    exports.connectionsList = connectionsList
}

exports.deleteConfig= (id)=>{
    let tamp = [];
    connectionsList.forEach(element => {
        if(element.params._id  != id){
            tamp.push(element);
        }
    })
    connectionsList = tamp
    exports.connectionsList = connectionsList
}

exports.initScenarios = async () => {
    scenarioList = await ScenarioModel.find({}, (err, results) => {
        if (err) return []
        return results
    })
    const DayInt = [{
        name: "Lundi",
        int: "1"
    }, {
        name: "Mardi",
        int: "2"
    }, {
        name: "Mercredi",
        int: "3"
    }, {
        name: "Jeudi",
        int: "4"
    }, {
        name: "Vendredi",
        int: "5"
    }, {
        name: "Samedi",
        int: "6"
    }, {
        name: "Dimanche",
        int: "7"
    }]
    scenarioList.forEach((scenario) => {
        const cron = schedule.scheduleJob(createRule(scenario), function(scenarioCall){
            console.log("START : " + JSON.stringify(scenarioCall));
            if (scenarioCall.action) startLights(scenarioCall.idKnx, scenarioCall.lights)
            else stopLights(scenarioCall.idKnx, scenarioCall.lights)
          }.bind(null,scenario));
        scenario.cron = cron
    })
}

exports.addScenario = async (scenario) => {
    const DayInt = [{
        name: "Lundi",
        int: "1"
    }, {
        name: "Mardi",
        int: "2"
    }, {
        name: "Mercredi",
        int: "3"
    }, {
        name: "Jeudi",
        int: "4"
    }, {
        name: "Vendredi",
        int: "5"
    }, {
        name: "Samedi",
        int: "6"
    }, {
        name: "Dimanche",
        int: "7"
    }]
    
    const cron = schedule.scheduleJob(createRule(scenario), function(scenarioCall){
        console.log("START : " + JSON.stringify(scenarioCall));
        if (scenarioCall.action) startLights(scenarioCall.idKnx, scenarioCall.lights)
        else stopLights(scenarioCall.idKnx, scenarioCall.lights)
      }.bind(null,scenario));
    scenario.cron = cron
    scenarioList.push(scenario)
    return true
}


exports.connectionKnx = (idUser, idKnx) => {
    try {
        const connection = getKNXConfig(idKnx)
        if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
        connection.connection = new knx.Connection(connection.params)
        if (connection.connection.connected) connection.params.connect = true
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

exports.deconnectionKnx = (idKnx) => {
    try {
        const connection = getKNXConfig(idKnx)
        if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
        if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
        connection.connection.Disconnect();
        connection.connection.connect = false
        connection.params.connect = false
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

exports.startLight = (id, idKnx) => {
    try {
        const connection = getKNXConfig(idKnx)
        if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
        if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
            connection.connection.write(id, 1);
            connection.params.lights.find(light => light.id === id).state = true
            return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

exports.stopLight = (id, idKnx) => {
    try {
        const connection = getKNXConfig(idKnx)
        if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
        if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
            connection.connection.write(id, 0);
            connection.params.lights.find(light => light.id === id).state = false
            return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

const startAllLights = (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    for (i = 0; i < connection.params.lights.length; i++) {
        try {
            connection.connection.write(connection.params.lights[i].id, 1); // allumer
            connection.params.lights.forEach((light) => light.state = true)
        } catch (error) {
             return {success:false, errorMessage:error}
        }
    }
    return {success:true};
}

const startLights = (idKnx, lights) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    for (i = 0; i < lights.length; i++) {
        try {
            connection.connection.write(lights[i].id, 1); // allumer    
            connection.params.lights.forEach((light) => {
                if (lights.some(e => e.id === light.id)) {
                    light.state = true
                }
            })
        } catch (error) {
             return {success:false, errorMessage:error}
        }
    }
    return {success:true};
}

const stopLights = (idKnx, lights) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    for (i = 0; i < lights.length; i++) {
        try {
            connection.connection.write(lights[i].id, 0); // eteindre 
            connection.params.lights.forEach((light) => {
                if (lights.some(e => e.id === light.id)) {
                    light.state = false
                }
            })
        } catch (error) {
             return {success:false, errorMessage:error}
        }
    }
    return {success:true};
}

exports.startAllLights = startAllLights

const stopAllLights = (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        console.log("connectionKNX not null")
        for (i = 0; i < connection.params.lights.length; i++) {
            connection.connection.write(connection.params.lights[i].id, 0); // eteindre
            connection.params.lights.forEach((light) => light.state = false)
        }
        return {success:true};
    } catch (error) {
        console.log("errorStopallLights "+error)
         return {success:false, errorMessage:error}
    }
}
exports.stopAllLights = stopAllLights

exports.startChase = async (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        await stopAllLights(idKnx)
        connection.params.startChain = true;
        while (connection.params.startChain) {
            var index = 0;
            for (i = 0; i < connection.params.lights.length; i++) {
                index = (!connection.params.sensDirect) ? connection.params.lights.length - 1 - i : i; // si connection.sensDirect = true connection.sensDirect normal sinon connection.sensDirect à l envers!
                connection.connection.write(connection.params.lights[index].id, 1); // allumer
                await sleep(connection.params.interval);
                connection.connection.write(connection.params.lights[index].id, 0); // allumer
            }
        }
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }

}

exports.stopChase = (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        connection.params.startChain = false;
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

exports.setInterval = (newInterval, idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        newInterval >= 500 ? connection.params.interval = newInterval : connection.params.interval = 500;
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

exports.setUpInterval = (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        connection.params.interval += 1000;
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }

};

exports.setDownInterval = (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        if (connection.params.interval > 1000) connection.params.interval -= 1000;
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }

};

exports.reverse = (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        connection.params.sensDirect = (connection.params.sensDirect) ? false : true;
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }

}

exports.getAllLight = (idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        return {
            'success': true,
            'data': connection.params.lights
        };
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

exports.addLight = (name, idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        connection.params.lights.push(name);
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

exports.removeLight = (name, idKnx) => {
    const connection = getKNXConfig(idKnx)
    if (!connection.connection) return {success:false, errorMessage:"Knx machine not found"}
    if (!connection.connection.connect) return {success:false, errorMessage:"Knx machine not connected"}
    try {
        let index = connection.params.lights.indexOf(name);
        connection.params.lights.splice(index, 1);
        return {success:true};
    } catch (error) {
         return {success:false, errorMessage:error}
    }
}

getKNXConfig = (idConfigKNX) => {
    return connectionsList.find(function (element) {
        return element.connection._id == idConfigKNX;
    });
}

createRule = (scenario) =>{

    var rule = new schedule.RecurrenceRule();
    if(scenario.repetition.includes(-1)){
        rule.dayOfWeek = [new schedule.Range(0, 6)];
    }else{
        rule.dayOfWeek = scenario.repetition;
    }
    rule.hour = scenario.time.hours;
    rule.minute = scenario.time.minutes;
    console.log("RULE : " + JSON.stringify(rule));

   return rule
}



exports.connectionsList = connectionsList
exports.scenarioList = scenarioList