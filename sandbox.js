var data = {
    states: new Map()
};

var context = {
    getState: function(a) { return data.states.get(a); }
};

console.log(this);

module.exports.data = data;
module.exports.context = context;