key = "bnkama91211";

module.exports = function decrypt(cipher_text) {
  let orig_text = "";

  for (let i = 0, j = 0; i < cipher_text.length; i++) {
    // converting in range 0-25
    if (cipher_text[i] == " ") {
      orig_text += " ";
    } else {
      let x = cipher_text[i].charCodeAt(0) - key[j].charCodeAt(0);
      // convert into alphabets(ASCII)
      // x += "A".charCodeAt(0);
      orig_text += String.fromCharCode(x);
    }
    j = ++j % key.length;
  }
  return orig_text;
};
