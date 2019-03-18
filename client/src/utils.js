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
    }
}

