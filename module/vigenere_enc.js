var key = "bnkama91211";

module.exports = function encrypt(str) {
  let cipher_text = "";

  for (let i = 0, j = 0; i < str.length; i++) {
    if (str[i] == " ") {
      cipher_text += " ";
      // console.log("enter in space cond.");
    } else {
      let x = str[i].charCodeAt(0) + key[j].charCodeAt(0);
      // console.log("x = " + x + " as "+str[i].charCodeAt(0)+" + "+key[j].charCodeAt(0)+ " and char is : "+String.fromCharCode(x));

      // x += "A".charCodeAt(0);
      cipher_text += String.fromCharCode(x);
    }
    j = ++j % key.length;
  }
  return cipher_text;
};