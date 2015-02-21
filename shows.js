shows = (function() {
    //Order will match voting codes 1 through 4
    var shows = [
        {title:"Frozen", id:440},
        {title:"Chopped", id:595},
        {title:"Football", id:791},
        {title:"Fight Club", id:439},
    ];
    var showTitles = [];
    for (var show in shows) {
        showTitles.push(shows[show].title);
    }
    return {
        getAllTitles : function(){
            return shows;
        },
        getShowTitles: function(){
            return showTitles;
        },
        findShow:function(_find){
            var _id = 0;
            for (var show in shows){
                if (_find == shows[show].title) {
                    _id = shows[show].id;
                }
            }
            return _id;
        }
    };
})();
//Allows code to be node module and JS file
if (typeof module != "undefined")
    module.exports = exports = shows;
