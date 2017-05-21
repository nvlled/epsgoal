
var util = {
    leftpad: function(str, n, ch) {
        var pref = [];
        for (var i = 0; i < n-str.length; i++) {
            pref.push(ch);
        }
        return pref.join("") + str;
    },
    randomSelect: function(arr) {
        let i = Math.floor(Math.random() * arr.length);
        return arr[i];
    }
}
