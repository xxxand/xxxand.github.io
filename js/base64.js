var direction = 0;
var inputBox = document.getElementById("inputBox");
var outputBox = document.getElementById("outputBox");
var modeText = document.getElementById("modeText");

function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

document.getElementById("btnConvert").addEventListener("click", function () {
  var input = inputBox.value;
  try {
    outputBox.value = direction === 0 ? encodeBase64(input) : decodeBase64(input);
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
  modeText.textContent =
    direction === 0 ? "当前：编码 (文本 → Base64)" : "当前：解码 (Base64 → 文本)";
  outputBox.value = "";
});
