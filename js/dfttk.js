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
  el.classList.remove("is-hidden");
}

var sortColumn = -1;
var sortAsc = true;
var originalRows = [];
var headers = [];
var seqIdx = 0;

function getSeqIdx() {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === "序号") return i;
  }
  return 0;
}

function compareRows(a, b, colIdx, asc) {
  var va = a[colIdx];
  var vb = b[colIdx];
  var na = parseFloat(va);
  var nb = parseFloat(vb);
  var result;
  if (!isNaN(na) && !isNaN(nb) && va !== "" && vb !== "") {
    result = na - nb;
  } else {
    result = String(va).localeCompare(String(vb), "zh");
  }
  if (result !== 0) return asc ? result : -result;
  var si = seqIdx;
  return parseInt(a[si]) - parseInt(b[si]);
}

function renderHeaders() {
  var thead = document.querySelector("#ttkTable thead");
  thead.innerHTML = "";
  var tr = document.createElement("tr");
  for (var i = 0; i < headers.length; i++) {
    var th = document.createElement("th");
    th.textContent = headers[i];
    if (i === sortColumn) {
      var arrow = document.createElement("span");
      arrow.className = "sort-arrow active";
      arrow.textContent = sortAsc ? " ▲" : " ▼";
      th.appendChild(arrow);
    }
    th.addEventListener(
      "click",
      (function (idx) {
        return function () {
          if (sortColumn === idx) {
            if (sortAsc) {
              sortAsc = false;
            } else {
              sortColumn = -1;
              sortAsc = true;
            }
          } else {
            sortColumn = idx;
            sortAsc = true;
          }
          renderAll();
        };
      })(i)
    );
    tr.appendChild(th);
  }
  thead.appendChild(tr);
}

function renderBody(rows) {
  var tbody = document.querySelector("#ttkTable tbody");
  tbody.innerHTML = "";
  for (var i = 0; i < rows.length; i++) {
    var cols = rows[i];
    var bodyTr = document.createElement("tr");
    for (var j = 0; j < cols.length; j++) {
      var td = document.createElement("td");
      var num = parseFloat(cols[j]);
      if (!isNaN(num) && cols[j] !== "") {
        td.textContent = num.toFixed(0);
      } else {
        td.textContent = cols[j];
      }
      bodyTr.appendChild(td);
    }
    tbody.appendChild(bodyTr);
  }
}

function renderAll() {
  renderHeaders();
  if (sortColumn >= 0) {
    var sorted = originalRows.slice().sort(function (a, b) {
      return compareRows(a, b, sortColumn, sortAsc);
    });
    renderBody(sorted);
  } else {
    renderBody(originalRows);
  }
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
      headers = parseCSVLine(rows[0]);
      seqIdx = getSeqIdx();

      originalRows = [];
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        originalRows.push(parseCSVLine(rows[i]));
      }

      document.getElementById("ttkTable").classList.add("sortable");
      renderAll();
    })
    .catch(function (err) {
      showError("加载失败: " + err.message);
    });
})();
