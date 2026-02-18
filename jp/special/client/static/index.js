(function () {
    var el = document.getElementById('property-recent-date');
    if (el) {
        var d = new Date();
        el.textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
})();