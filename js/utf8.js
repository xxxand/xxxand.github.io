var direction = 0;
var inputBox = document.getElementById("inputBox");
var outputBox = document.getElementById("outputBox");
var modeText = document.getElementById("modeText");

function textToUTF8(str) {
  var encoder = new TextEncoder();
  var bytes = encoder.encode(str);
  var result = [];
  for (var i = 0; i < bytes.length; i++) {
    result.push(bytes[i].toString(16).toUpperCase().padStart(2, "0"));
  }
  return result.join(" ");
}

function utf8ToText(str) {
  var hexes = str.trim().split(/[\s,]+/);
  var bytes = new Uint8Array(hexes.length);
  for (var i = 0; i < hexes.length; i++) {
    bytes[i] = parseInt(hexes[i], 16);
  }
  var decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

document.getElementById("btnConvert").addEventListener("click", function () {
  var input = inputBox.value;
  try {
    outputBox.value = direction === 0 ? textToUTF8(input) : utf8ToText(input);
  } catch (e) {
    outputBox.value = "转换出错，请检查输入格式";
  }
});

document.getElementById("btnCopy").addEventListener("click", function () {
  outputBox.select();
  document.execCommand("copy");
});

document.getElementById("btnSwap").addEventListener("click", function () {
  direction = direction === 0 ? 1 : 0;
  modeText.textContent = direction === 0 ? "当前：中文 → UTF-8" : "当前：UTF-8 → 中文";
  outputBox.value = "";
});
