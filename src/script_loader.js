

export default async function script_loader(code) {
  let self=this;
  let uri = `data:text/javascript;base64,${btoa(code)}`;
  return import(uri)
    .then(scr=>{
      console.log("Imported script");
      return scr.default;
    });
}
 
