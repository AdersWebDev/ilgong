(function () {
    var el = document.getElementById('property-recent-date');
    if (el) {
        var d = new Date();
        el.textContent = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
    }
})();