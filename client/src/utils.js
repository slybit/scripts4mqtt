

export function flattenConditions(nested) {
    const flattenConditionsIteratively = (nested, list, parent) => {
        let id = list.length > 0 ? list[list.length-1].id + 1 : 1;
        let path = parent.path.slice(0);
        if (parent.id) path.push(parent.id);
        let item = {id: id, path: path, ...nested};
        delete item.condition; // otherwise the nested conditions all stay in
        list.push(item);
        if ((nested.type === 'or' || nested.type === 'and') && nested.condition) {
            for (let n of nested.condition)
                flattenConditionsIteratively(n, list, item);
        }
    }

    let list = [];
    let parent = {path: []};

    if (Array.isArray(nested)) {
        for (let n of nested)
            flattenConditionsIteratively(n, list, parent);
    } else
        flattenConditionsIteratively(nested, list, parent);

    return list;
}



export function buildTree(items) {
    const buildItem = (item) => {
      const { path, isMarked, id, ...data } = item;
      const result = {
        ...data,
        condition: items
          .filter(child => child.path[child.path.length - 1] === item.id)
          .map(child => buildItem(child)),
      };
      if (result.type !== 'or' && result.type !== 'and' && result.condition.length === 0) delete result.condition;
      return result;
    };
    const tree = items
      .filter(item => item.path.length === 0)
      .map(item => buildItem(item));

    return tree;
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

export function addIds(list) {
    for (let item of list)
        item._id = uuid();
    return list;
}

export function stripIds(list) {
    const cloned = JSON.parse(JSON.stringify(list));
    for (let item of cloned) {
        delete item._id;
        delete item.isMarked;
    }
    return cloned;
}

export function uuid(a) {
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid)
}

export const staticData = {
    conditions: {
        mqtt: "MQTT",
        cron: "Cron expression"
    },
    actions: {
        mqtt: "MQTT",
        script: "Script",
        email: "Email",
        pushover: "Pushover",
    },
    newItems: {
        condition: {            
            mqtt: {
                type: "mqtt",
                trigger: "no",
                topic: "__REPLACE__",
                eval: "{{true}}"
            },
            cron: {
                type: "cron",
                trigger: "no",
                on: "0 0 * * *"                
            }
        },
        action: {
            mqtt: {
                type: "mqtt",
                topic: "__REPLACE__",
                value: "__REPLACE__"
            }
        }
    },
    editor: {
        condition: {
            or: [
                { key: "type", label: "Logic Operator", type: "select", options: [
                    {value: "or", label: "OR"},
                    {value: "and", label: "AND"}
                ] },
            ],
            and: [
                { key: "type", label: "Logic Operator", type: "select", options: [
                    {value: "or", label: "OR"},
                    {value: "and", label: "AND"}
                ] },
            ],
            mqtt: [
                { key: "trigger", label: "Trigger", type: "select", options: [
                    {value: "no", label: "No"},
                    {value: "on_flip", label: "On flip"},
                    {value: "on_flip_true", label: "On flip to True"},
                    {value: "on_flip_false", label: "On flip to False"},
                    {value: "always", label: "Always"}
                ] },
                { key: "topic", label: "Topic", props: {required: true} },
                { key: "eval", label: "Eval", props: {required: true} }
            ],
            cron: [
                { key: "trigger", label: "Trigger", type: "select", options: [
                    {value: "no", label: "No"},
                    {value: "on_flip", label: "On flip"},
                    {value: "on_flip_true", label: "On flip to True"},
                    {value: "on_flip_false", label: "On flip to False"},
                    {value: "always", label: "Always"}
                ] },
                { key: "on", label: "On expression", props: {required: true} },
                { key: "off", label: "Off expression" }
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

