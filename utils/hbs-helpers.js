module.exports = {
    ifeq(a, b, options) {
        if (a == b) {
            return options.fn(this);
        }
        return options.inverse(this);
    },

    ifnoteq(a, b, options) {
        if (a != b) {
            return options.fn(this);
        }
        return options.inverse(this);
    }, 
    ifCond(v1, operator, v2, options) {
        switch (operator) {
            case '===':
              return (v1 === v2) ? options.fn(this) : options.inverse(this);
            default:
              return options.inverse(this);
          }
    }
};