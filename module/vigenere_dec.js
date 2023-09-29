key = "bnkama91211";

module.exports = function decrypt(ct) {
  let orig_text = "";
  var tmp = "";
  for (let i = 0, j = 0; i < ct.length; i++) {
    if (ct[i] == "-") {
      orig_text += " ";
    } else {
      tmp = ct[i] + ct[i + 1] + ct[i + 2];
      let x = tmp - key[j].charCodeAt(0);
      orig_text += String.fromCharCode((x + 255) % 255);
      // console.log("dec: " + orig_text + " and char: " + x);
    }
    i += 2;
    j = ++j % key.length;
  }

  return orig_text;
};
// console.log("" + decrypt("207214214146159148"));
