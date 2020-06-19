
export function flattenConditions(nested) {
    const flattenConditionsIteratively = (nested, list, depth) => {
        // increment the id for each new item
        let id = list.length > 0 ? list[list.length - 1].id + 1 : 1;
        let item = { id: id, depth: depth, ...nested };
        delete item.condition; // otherwise the nested conditions all stay in
        list.push(item);
        if ((nested.type === 'or' || nested.type === 'and') && nested.condition) {
            for (let n of nested.condition)
                flattenConditionsIteratively(n, list, depth + 1);
        }
    }

    let list = [];

    if (Array.isArray(nested)) {
        for (let n of nested)
            flattenConditionsIteratively(n, list, 0);
    } else
        flattenConditionsIteratively(nested, list, 0);

    return list;
}



export function buildTree(items) {
    const buildItem = (item) => {
        const { depth, id, ...data } = item;
        const result = {
            ...data,
            condition: findDescendants(items, items.indexOf(item))
                .filter(child => child.depth === item.depth+1)
                .map(child => buildItem(child)),
        };
        if (result.type !== 'or' && result.type !== 'and' && result.condition.length === 0) delete result.condition;
        return result;
    };
    const tree = items
        .filter(item => item.depth === 0)
        .map(item => buildItem(item));

    return tree;
}



export function findDescendants(items, index) {
    const item = items[index];
    const descendants = [];

    for (let i = index + 1; i < items.length; i += 1) {
      const next = items[i];

      if (next.depth <= item.depth) {
        break;
      }

      descendants.push(next);
    }

    return descendants;
  };



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
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid)
}

export function isNewItem(item, type, subtype) {
    try {
        const testItem = staticData.newItems[type][subtype];
        if (!testItem) return false;
        let isNew = true;
        Object.keys(testItem).forEach((key) => {
            if (isNew && testItem[key] !== item[key]) {
                isNew = false;
            }
        });
        return isNew;
    } catch (err) {
        return false;
    }
}

export function showError(msg, error) {
    alert(msg + "\n\n" + error);
}

export const staticData = {
    conditions: {
        mqtt: "MQTT",
        alias: "Alias",
        cron: "Cron expression",
        or: "Logic operator",
        and: "Logic operator"
    },
    actions: {
        mqtt: "MQTT",
        script: "Script",
        email: "Email",
        pushover: "Pushover",
        logbook: "Log book",
        webhook: "Webhook"
    },
    newItems: {
        rule: {
            name: "New rule",
            category: "default",
            description: "",
            enabled: false,
            condition: []
        },
        condition: {
            mqtt: {
                type: "mqtt",
                trigger: "no",
                topic: "__REPLACE__",
                operator: "eq",
                jmespath: "val",
                value: ""
            },
            alias: {
                type: "alias",
                trigger: "no",
                alias: "__REPLACE__",
                eval: "true"
            },
            cron: {
                type: "cron",
                trigger: "no",
                on: "0 0 * * *",
                off: "-"
            }
        },
        action: {
            mqtt: {
                type: "mqtt",
                delay: 0,
                interval: 0,
                topic: "__REPLACE__",
                value: "__REPLACE__"
            },
            pushover: {
                type: "pushover",
                delay: 0,
                interval: 0,
                title: "__REPLACE__",
                message: "",
                sound: "pushover",
                priority: 0
            },
            email: {
                type: "email",
                delay: 0,
                interval: 0,
                to: "__REPLACE__@mail.com",
                subject: "__REPLACE__",
                body: ""
            },
            script: {
                type: "script",
                delay: 0,
                interval: 0,
                script: ""
            },
            logbook: {
                type: "logbook",
                delay: 0,
                interval: 0,
                message: ""
            },
            webhook: {
                type: "webhook",
                delay: 0,
                interval: 0,
                url: "__REPLACE__"
            }
        }

    },
    editor: {
        condition: {
            or: [
                {
                    key: "type", label: "Logic Operator", type: "select", options: [
                        { value: "or", label: "OR" },
                        { value: "and", label: "AND" }
                    ]
                },
            ],
            and: [
                {
                    key: "type", label: "Logic Operator", type: "select", options: [
                        { value: "or", label: "OR" },
                        { value: "and", label: "AND" }
                    ]
                },
            ],
            mqtt: [
                {
                    key: "trigger", label: "Trigger", type: "select", options: [
                        { value: "no", label: "No" },
                        { value: "on_flip", label: "On flip" },
                        { value: "on_flip_true", label: "On flip to True" },
                        { value: "on_flip_false", label: "On flip to False" },
                        { value: "always", label: "Always" }
                    ]
                },
                { key: "topic", label: "Topic", props: { required: true } },
                { key: "jmespath", label: "jmespath", props: { required: true } },
                {
                    key: "operator", label: "Operator", type: "select", options: [
                        { value: "eq", label: "= (equals)" },
                        { value: "gt", label: "> (greater than)" },
                        { value: "lt", label: "< (less than)"},
                        { value: "neq", label: "!= (not equal to)"}
                    ]
                },
                { key: "value", label: "Value", props: { required: true } }
            ],
            alias: [
                {
                    key: "trigger", label: "Trigger", type: "select", options: [
                        { value: "no", label: "No" },
                        { value: "on_flip", label: "On flip" },
                        { value: "on_flip_true", label: "On flip to True" },
                        { value: "on_flip_false", label: "On flip to False" },
                        { value: "always", label: "Always" }
                    ]
                },
                { key: "alias", label: "Alias", props: { required: true } },
                { key: "eval", label: "Eval", props: { required: true } }
            ],
            cron: [
                {
                    key: "trigger", label: "Trigger", type: "select", options: [
                        { value: "no", label: "No" },
                        { value: "on_flip", label: "On flip" },
                        { value: "on_flip_true", label: "On flip to True" },
                        { value: "on_flip_false", label: "On flip to False" },
                        { value: "always", label: "Always" }
                    ]
                },
                { key: "on", label: "On expression", props: { required: true } },
                { key: "off", label: "Off expression" }
            ],
        },
        action: {
            mqtt: [
                { key: "delay", label: "Delay"},
                { key: "interval", label: "Interval"},
                { key: "topic", label: "Topic", props: { required: true } },
                { key: "value", label: "Value", props: { required: true } },
            ],
            pushover: [
                { key: "delay", label: "Delay"},
                { key: "interval", label: "Interval"},
                { key: "title", label: "Title", props: { required: true } },
                { key: "message", label: "Message", type: "textarea", props: { rows: 5 } },
                {
                    key: "sound", label: "Sound", type: "select", options: [
                        { value: "pushover", label: "Pushover" },
                        { value: "bike", label: "Bike" },
                        { value: "bugle", label: "Bugle" },
                        { value: "cashregister", label: "Cash Register" },
                        { value: "classical", label: "Classical" },
                        { value: "cosmic", label: "Cosmic" },
                        { value: "falling", label: "Falling" },
                        { value: "gamelan", label: "Gamelan" },
                        { value: "incoming", label: "Incoming" },
                        { value: "intermission", label: "Intermission" },
                        { value: "magic", label: "Magic" },
                        { value: "mechanical", label: "Mechanical" },
                        { value: "pianobar", label: "Piano Bar" },
                        { value: "siren", label: "Siren" },
                        { value: "spacealarm", label: "Space Alarm" },
                        { value: "tugboat", label: "Tug Boat" },
                        { value: "alien", label: "Alien Alarm (long)" },
                        { value: "climb", label: "Climb (long)" },
                        { value: "persistent", label: "Persistent (long)" },
                        { value: "echo", label: "Pushover Echo (long)" },
                        { value: "updown", label: "Up Down (long)" },
                        { value: "none", label: "None (silent)" }
                    ]
                },
                {
                    key: "priority", label: "Priority", type: "select", options: [
                        { value: "2", label: "Emergency" },
                        { value: "1", label: "High" },
                        { value: "0", label: "Normal" },
                        { value: "-1", label: "Low" },
                        { value: "-2", label: "Lowest" }
                    ]
                }
            ],
            email: [
                { key: "delay", label: "Delay"},
                { key: "interval", label: "Interval"},
                { key: "to", label: "To", props: { required: true } },
                { key: "subject", label: "Subject" },
                { key: "body", label: "Body", type: "textarea", props: { rows: 10 } }
            ],
            script: [
                { key: "delay", label: "Delay"},
                { key: "interval", label: "Interval"},
                { key: "script", label: "Script", type: "simple-editor", props: { rows: 30, style: { fontFamily: 'monospace', fontSize: '1rem' } } }
            ],
            logbook: [
                { key: "delay", label: "Delay"},
                { key: "interval", label: "Interval"},
                { key: "message", label: "Message"}
            ],
            webhook: [
                { key: "delay", label: "Delay"},
                { key: "interval", label: "Interval"},
                { key: "url", label: "URL"}
            ]
        }
    }
}



