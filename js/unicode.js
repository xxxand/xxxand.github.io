var direction = 0;
var inputBox = document.getElementById("inputBox");
var outputBox = document.getElementById("outputBox");
var modeText = document.getElementById("modeText");

function textToUnicode(str) {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if (code > 127) {
      result += "\\u" + code.toString(16).toUpperCase().padStart(4, "0");
    } else {
      result += str[i];
    }
  }
  return result;
}

function unicodeToText(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, function (_, hex) {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

document.getElementById("btnConvert").addEventListener("click", function () {
  var input = inputBox.value;
  outputBox.value = direction === 0 ? textToUnicode(input) : unicodeToText(input);
});

document.getElementById("btnCopy").addEventListener("click", function () {
  outputBox.select();
  document.execCommand("copy");
});

document.getElementById("btnSwap").addEventListener("click", function () {
  direction = direction === 0 ? 1 : 0;
  modeText.textContent =
    direction === 0 ? "当前：中文 → Unicode" : "当前：Unicode → 中文";
  outputBox.value = "";
});
