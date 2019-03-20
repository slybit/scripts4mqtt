export function flattenConditions(nested) {    
    let list = [];
    let parent = {path: []};
    if (Array.isArray(nested)) {
        for (let n of nested)
            flattenConditionsIteratively(n, list, parent);
    } else 
        flattenConditionsIteratively(nested, list, parent);
    return list;
}

function flattenConditionsIteratively(nested, list, parent) {
    let id = list.length > 0 ? list[list.length-1].id + 1 : 1;
    let path = parent.path.slice(0);
    if (parent.id) path.push(parent.id);
    let item = {id: id, type: nested.type, options: nested.options, path: path, isMarked: false};
    list.push(item);
    if (nested.type === 'or' || nested.type === 'and') {
        for (let n of nested.condition)
            flattenConditionsIteratively(n, list, item);
    }
}

export function deleteCondition(flatList, id) {
    console.log("deleting " + id);
    const newList = flatList.filter( item  => {
        if (item.id === id || item.path.indexOf(id) !== -1)
            return false;
        else
            return true;
    });
    console.log(newList);
    return newList;
}

export function addIds(list, itemType) {
    for (let item of list) {
        item._id = uuid();
        item._type = itemType;
    }
    return list;
}

export function uuid(a) {
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid)
}

export const staticData = {
    conditions: {        
        mqtt: "MQTT",
        cron: "Cron expression"
    },
    editor: {
        condition: {
            logic: [
                { key: "type", label: "Logic Operator", type: "select", options: [
                    {value: "or", label: "OR"},
                    {value: "and", label: "AND"}     
                ] },
            ],
            mqtt: [
                { key: "type", label: "Condition Type", type: "select", options: [
                    {value: "mqtt", label: "MQTT"},
                    {value: "cron", label: "Cron expression"}     
                ] },
                { key: "options", label: "Condition Options", type: "textarea", props: {rows: 10} }
            ],
        },
        action: {
            mqtt: [
                { key: "topic", label: "Topic", props: {required: true} },
                { key: "value", label: "Value", props: {required: true} },
            ],
            pushover: [
                { key: "title", label: "Title", props: {required: true} },
                { key: "message", label: "Message", type: "textarea", props: {rows: 5} },
                { key: "sound", label: "Sound", type: "select", options: [
                    {value: "pushover", label: "Pushover"},
                    {value: "bike", label: "Bike"},
                    {value: "bugle", label: "Bugle"},
                    {value: "cashregister", label: "Cash Register"},
                    {value: "classical", label: "Classical"},
                    {value: "cosmic", label: "Cosmic"},
                    {value: "falling", label: "Falling"},
                    {value: "gamelan", label: "Gamelan"},
                    {value: "incoming", label: "Incoming"},
                    {value: "intermission", label: "Intermission"},
                    {value: "magic", label: "Magic"},
                    {value: "mechanical", label: "Mechanical"},
                    {value: "pianobar", label: "Piano Bar"},
                    {value: "siren", label: "Siren"},
                    {value: "spacealarm", label: "Space Alarm"},
                    {value: "tugboat", label: "Tug Boat"},
                    {value: "alien", label: "Alien Alarm (long)"},
                    {value: "climb", label: "Climb (long)"},
                    {value: "persistent", label: "Persistent (long)"},
                    {value: "echo", label: "Pushover Echo (long)"},
                    {value: "updown", label: "Up Down (long)"},
                    {value: "none", label: "None (silent)"}                
                ] },
                { key: "priority", label: "Priority", type: "select", options: [
                    {value: "2", label: "Emergency"},
                    {value: "1", label: "High"},
                    {value: "0", label: "Normal"},
                    {value: "-1", label: "Low"},
                    {value: "-2", label: "Lowest"}                
                ] }
            ],
            email: [
                { key: "to", label: "To", props: {required: true} },
                { key: "subject", label: "Subject" },
                { key: "body", label: "Body", type: "textarea", props: {rows: 10} }
            ],
            script: [            
                { key: "script", label: "Script", type: "textarea", props: {rows: 30, style: {fontFamily: 'monospace', fontSize: '1rem'}} }
            ]
        }
    }
}

