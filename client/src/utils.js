export function flattenConditions(nested) {    
    let list = [];
    let parent = {path: []};
    flattenConditionsIteratively(nested, list, parent);        
    return list;
}

function flattenConditionsIteratively(nested, list, parent) {
    let id = list.length > 0 ? list[list.length-1].id + 1 : 1;
    let path = parent.path.slice(0);
    if (parent.id) path.push(parent.id);
    let item = {id: id, type: nested.type, options: nested.options, path: path, isMarked: false};
    list.push(item);
    if (nested.type == 'or' || nested.type == 'and') {
        for (let n of nested.condition)
            flattenConditionsIteratively(n, list, item);
    }
}