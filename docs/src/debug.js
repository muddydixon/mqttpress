module.exports = function(label){
  const cnsl = document.querySelector("#console");

  return msg =>{
    console.debug(msg);
    if(cnsl) cnsl.innerHTML += `${msg}<br>`;
  };
};
