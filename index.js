const express = require("express")
const path = require("path")
const fs=require("fs")
const sharp=require("sharp")
const sass=require("sass")
app = express();

app.use("/resurse", express.static(path.join(__dirname, "resurse")))
//pentru orice cerere de tipul /resurse va cauta fisierul in folderul
//resurse de pe server

app.get("/favicon.ico",function(req,res){
    res.sendFile(path.join(__dirname,"resurse/imagini/favicon/favicon.ico"))
})


console.log("Folderul proiectului", __dirname)
console.log("Calea fisierului index.js", __filename)
console.log("Folderul curent de lucru", process.cwd())
app.set("view engine", "ejs");

obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss:path.join(__dirname,"/resurse/scss"),
    folderCss:path.join(__dirname,"/resurse/css"),
    folderBackup:path.join(__dirname,"backup")
}


vect_foldere=["temp","backup","temp1"]
for(let folder of vect_foldere){
    let caleFolder=path.join(__dirname,folder)
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder)
    }
}
function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    console.log(continut)
    obGlobal.obErori = JSON.parse(continut)
    console.log(obGlobal.obErori)

    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza,
        obGlobal.obErori.eroare_default.imagine)

    for (let eroare of obGlobal.obErori.info_erori) {
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine)
    }
    console.log(obGlobal.obErori)
}

initErori()

function initImagini()
{
    let continut=fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");
    obGlobal.obImagini=JSON.parse(continut)
    let vImagini=obGlobal.obImagini.imagini;
    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie,"mediu")
    for(let imag of obGlobal.obImagini.imagini)
    {
        console.log(imag.titlu)
    }
    if(!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu)
    for(let imag of vImagini){
        [numeFis,ext]=imag.cale_imagine.split(".");
        let caleFisAbs=path.join(caleAbs,imag.cale_imagine)
        let caleFisMediuAbs=path.join(caleAbsMediu,numeFis+".webp")
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs)
        imag.cale_imagine_mediu=path.join("/",obGlobal.obImagini.cale_galerie,"mediu",numeFis+".webp")
        imag.cale_imagine=path.join("/",obGlobal.obImagini.cale_galerie,imag.cale_imagine)
    }
    console.log(obGlobal.obImagini)
}
initImagini()

function ComplileazaSCss(caleScss,caleCss){
    console.log("cale : ",caleCss)
    if(!caleCss)
    {
        let numeFisExt=path.basename(caleScss) // fisier.scss
        let numeFis=numeFisExt.split(".")[0]  //fisier
        caleCss=numeFis+".css"; //fisier.css
    }
    if(!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss)
    if(!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss)

    let caleBackup=path.join(obGlobal.folderBackup,"resurse/css")
    if(!fs.existsSync(caleBackup))
    {
        fs.mkdirSync(caleBackup,{recursive:true})
    }

    if (fs.existsSync(caleCss)) {
        let numeFisCss = path.basename(caleCss);
        let numeFis = path.parse(numeFisCss).name;  
        let ext = path.parse(numeFisCss).ext;       
        let now = new Date();
        let quarter = Math.floor(now.getMinutes() / 15) * 15;
        now.setMinutes(quarter, 0, 0); 
        let timestamp = now.getTime(); 


        let numeFisTimestamp = `${numeFis}_${timestamp}${ext}`; // "a_1681124489791.css"
    
        let caleFisBackup = path.join(caleBackup, numeFisTimestamp);
    
        fs.copyFileSync(caleCss, caleFisBackup);
    }
    
    rez=sass.compile(caleScss,{"sourceMap":true})
    fs.writeFileSync(caleCss,rez.css)

}
vFisiere=fs.readdirSync(obGlobal.folderScss)
for(let numeFis of vFisiere)
{
    if(path.extname(numeFis)==".scss")
    {
        ComplileazaSCss(numeFis)
    }
}
fs.watch(obGlobal.folderScss,function(eveniment,numeFis){
    console.log(eveniment,numeFis)
    if(eveniment=="change" || eveniment=="rename")
    {
        let caleCompleta=path.join(obGlobal.folderScss,numeFis)
        if(fs.existsSync(caleCompleta))
        {
            ComplileazaSCss(caleCompleta)
        }
    }
})
 
function afisareEroare(res,identificator,titlu,text,imagine){
    let eroare=obGlobal.obErori.info_erori.find(function(elem){
        return elem.identificator==identificator
    })
    if(eroare)
    {
        if(eroare.status)
            res.status(identificator)
        var titluCustom=titlu || eroare.titlu
        var textCustom=text || eroare.text
        var imagineCustom=imagine || eroare.imagine
    }
    else{
        var err=obGlobal.obErori.eroare_default
        var titluCustom=titlu || err.titlu
        var textCustom=text ||err.text
        var imagineCustom=imagine ||err.imagine
    }
    res.render("pagini/eroare",{
        titlu:titluCustom,
        text:textCustom,
        imagine:imagineCustom
    })
}


app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index",{ip:req.ip,
        imagini:obGlobal.obImagini.imagini,
        licenta_galerie:obGlobal.obImagini.licenta_galerie
    });
})
app.get("/ghid", function(req, res){
    res.render("pagini/ghid");
})
vectNrImag=[4,9,16]
app.get("/galeriePC", function(req, res){
    
    n=vectNrImag[Math.floor(Math.random()*3)]

    let imaginiClone=[...obGlobal.obImagini.imagini]
    imaginiClone=imaginiClone.filter(im=>im.titlu.length>=16)
    .sort(()=>0.5-Math.random())

    let imaginiSelectate=imaginiClone.slice(0,n)

    const rezNrImag = sass.compileString(`
    $grid-size: ${Math.sqrt(n)};
    @import "resurse/scss/galerie_dinamica.scss";
  `, {
    loadPaths: ["./"]  
  }); 
  let caleScss=path.join(__dirname,"/resurse/scss/galerie_dinamica.scss")
  let fisScssExt=path.basename(caleScss)
  let fisScss=fisScssExt.split(".")[0]
  let fisCss=fisScss+".css"
  let caleCss=path.join(obGlobal.folderCss,fisCss)
    fs.writeFileSync(caleCss,rezNrImag.css)


    res.render("pagini/galeriePC",{imagini:obGlobal.obImagini.imagini,
        licenta_galerie:obGlobal.obImagini.licenta_galerie,
        grid_size:Math.sqrt(n),
        imaginiDinamice:imaginiSelectate
    });

})
app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function(req, res, next){
    afisareEroare(res,403);
})

app.get("/*.ejs", function(req, res, next){
    afisareEroare(res,400);
})

app.get("*", function (req, res, next) {
    try {
        res.render("pagini" + req.url, function (err, rezultatRandare) {
            if (err) {
                if (err.message.startsWith("Failed to lookup view")) {
                    afisareEroare(res, 404)
                }
                else {
                    afisareEroare(res)
                }
            }
            else {
                console.log(rezultatRandare)
                res.send(rezultatRandare)
            }
        })
    }
    catch (errRandare) {
        if (errRandare.message.startsWith("Cannot find module")) {
            afisareEroare(res, 404);
        }
        else {
            afisareEroare(res);
        }
    }
})
app.listen(8080)
console.log("Serverul a pornit")