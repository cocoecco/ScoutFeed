var dukeRouter = require('./Parsers/DukeParser');

function routeDuke(req,res) {
    dukeRouter.clearFeedsDB();
    dukeRouter.getDukeData(req,res);
}
exports.routeDuke = routeDuke;