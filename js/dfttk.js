function parseCSVLine(line) {
  var result = [];
  var current = "";
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function showError(msg) {
  var el = document.getElementById("errorMsg");
  el.textContent = msg;
  el.style.display = "block";
}

(function () {
  fetch("dfttk.csv")
    .then(function (res) {
      if (!res.ok) throw new Error("文件加载失败");
      return res.text();
    })
    .then(function (csv) {
      var rows = csv.trim().split("\n");
      if (rows.length < 2) {
        showError("CSV 数据为空");
        return;
      }
      var headers = parseCSVLine(rows[0]);

      var thead = document.querySelector("#ttkTable thead");
      thead.innerHTML = "";
      var tr = document.createElement("tr");
      headers.forEach(function (h) {
        var th = document.createElement("th");
        th.textContent = h;
        tr.appendChild(th);
      });
      thead.appendChild(tr);

      var tbody = document.querySelector("#ttkTable tbody");
      tbody.innerHTML = "";
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        var cols = parseCSVLine(rows[i]);
        var bodyTr = document.createElement("tr");
        cols.forEach(function (val) {
          var td = document.createElement("td");
          var num = parseFloat(val);
          if (!isNaN(num) && val !== "") {
            td.textContent = num.toFixed(0);
          } else {
            td.textContent = val;
          }
          bodyTr.appendChild(td);
        });
        tbody.appendChild(bodyTr);
      }
    })
    .catch(function (err) {
      showError("加载失败: " + err.message);
    });
})();
