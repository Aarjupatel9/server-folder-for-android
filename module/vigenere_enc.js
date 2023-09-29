var key = "bnkama91211";

module.exports = function encrypt(str) {
  let cipher_text = "";
  for (let i = 0, j = 0; i < str.length; i++) {
    if (str[i] == " ") {
      cipher_text += "-01";
    } else {
      let x = str[i].charCodeAt(0) + key[j].charCodeAt(0);

      if (x.toString().length == 3) {
        cipher_text += x;
      } else if (x.toString().length == 2) {
        x = "0" + x;
        cipher_text += x;
      } else if (x.toString().length == 1) {
        x = "00" + x;
        cipher_text += x;
      } else {
        console.log("exception " + x);
      }
      // cipher_text += x;
      // console.log("enc: " + cipher_text + " and char: " + x + " len:"+x.toString().length);
    }
    j = ++j % key.length;
  }
  return cipher_text;
}

// console.log("" + encrypt("sagar123"));
