const express = require("express")
const path = require("path")
const fs = require("fs")
const sharp = require("sharp")
const sass = require("sass")
const pg = require("pg")

const Client = pg.Client

client = new Client({
    database: "proiect_tw",
    user: "root",
    password: "postgre",
    host: "localhost",
    port: 5432
})
client.connect()
client.query("select * from produs where id=1", function (err, rezultat) {
    console.log(err)
    console.log("Rezultat query: ", rezultat)
})

app = express();
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")))
app.use("/resurse", express.static(path.join(__dirname, "resurse")))
//pentru orice cerere de tipul /resurse va cauta fisierul in folderul
//resurse de pe server

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"))
})


console.log("Folderul proiectului", __dirname)
console.log("Calea fisierului index.js", __filename)
console.log("Folderul curent de lucru", process.cwd())
app.set("view engine", "ejs");

obGlobal = {
    obErori: null,
    obImagini: null,
    obOferte: null,
    folderScss: path.join(__dirname, "/resurse/scss"),
    folderCss: path.join(__dirname, "/resurse/css"),
    folderBackup: path.join(__dirname, "backup")
}


vect_foldere = ["temp", "backup", "temp1"]
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder)
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder)
    }
}
function citireOferte() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/oferte.json"))
    obGlobal.obOferte = JSON.parse(continut)
}
function generareOferte() {
    let T = 15
    // stergeOferte()
    citireOferte()
    let queryCategorie = "select * from unnest(enum_range(null::categorii_produse))"
    client.query(queryCategorie, function (err, rezCategorie) {
        if (err) {
            console.log(err)
            return
        }
        else {
            if (rezCategorie.rowCount == 0) {
                return
            }
            else {
                let categorieAnterioara = obGlobal.obOferte.oferte[0].categorie
                let categorii = rezCategorie.rows.map(r => r.unnest)
                let categorieAleatoare
                do {
                    categorieAleatoare = categorii[Math.floor(Math.random() * categorii.length)]
                } while (categorieAnterioara == categorieAleatoare)
                let dataIncepere = new Date()
                let dataFinalizare = new Date(dataIncepere)
                let procent = Math.floor((Math.random() * 10 + 1)) * 5
                dataFinalizare.setMinutes(dataIncepere.getMinutes() + T)
                obGlobal.obOferte.oferte.unshift({
                    categorie: categorieAleatoare,
                    data_incepere: dataIncepere.toISOString(),
                    data_finalizare: dataFinalizare.toISOString(),
                    reducere: procent
                })
                fs.writeFileSync(path.join(__dirname, "resurse/json/oferte.json"), JSON.stringify(obGlobal.obOferte))
            }
        }
    })
}
function stergeOferte() {
    let T2 = 30
    citireOferte()
    if (!(obGlobal.obOferte.oferte.length > 2)) {
        return
    }
    let data_curenta = new Date(Date.now())
    obGlobal.obOferte.oferte = obGlobal.obOferte.oferte.filter(oferta => {
        let data_oferta = new Date(oferta.data_incepere)
        let diferenta_ms = data_curenta - data_oferta
        let diferenta_minute = diferenta_ms / (1000 * 60)
        return diferenta_minute < 30
    })
    fs.writeFileSync(path.join(__dirname, "resurse/json/oferte.json"), JSON.stringify(obGlobal.obOferte))
}
citireOferte()
setInterval(generareOferte, 15 * 60 * 1000)
// setTimeout(generareOferte,5000)
function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    // console.log(continut)
    obGlobal.obErori = JSON.parse(continut)

    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza,
        obGlobal.obErori.eroare_default.imagine)

    for (let eroare of obGlobal.obErori.info_erori) {
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine)
    }
}

initErori()

function initImagini() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/galerie.json")).toString("utf-8");
    obGlobal.obImagini = JSON.parse(continut)
    let vImagini = obGlobal.obImagini.imagini;
    let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(__dirname, obGlobal.obImagini.cale_galerie, "mediu")
    for (let imag of obGlobal.obImagini.imagini) {
        console.log(imag.titlu)
    }
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu)
    for (let imag of vImagini) {
        [numeFis, ext] = imag.cale_imagine.split(".");
        let caleFisAbs = path.join(caleAbs, imag.cale_imagine)
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp")
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs)
        imag.cale_imagine_mediu = path.join("/", obGlobal.obImagini.cale_galerie, "mediu", numeFis + ".webp")
        imag.cale_imagine = path.join("/", obGlobal.obImagini.cale_galerie, imag.cale_imagine)
    }
    console.log(obGlobal.obImagini)
}
initImagini()

function ComplileazaSCss(caleScss, caleCss) {
    console.log("cale : ", caleCss)
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss)
        let numeFis = numeFisExt.split(".")[0]
        caleCss = numeFis + ".css";
    }
    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss)
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss)

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css")
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true })
    }

    if (fs.existsSync(caleCss)) {
        let numeFisCss = path.basename(caleCss);
        let numeFis = path.parse(numeFisCss).name;
        let ext = path.parse(numeFisCss).ext;
        let now = new Date();
        let quarter = Math.floor(now.getMinutes() / 15) * 15;
        now.setMinutes(quarter, 0, 0);
        let timestamp = now.getTime();


        let numeFisTimestamp = `${numeFis}_${timestamp}${ext}`;

        let caleFisBackup = path.join(caleBackup, numeFisTimestamp);

        fs.copyFileSync(caleCss, caleFisBackup);
    }

    rez = sass.compile(caleScss, { "sourceMap": true })
    fs.writeFileSync(caleCss, rez.css)

}
function stergeBackup() {
    let T = 15
    let caleBackup = obGlobal.folderBackup + "/resurse/css"
    const fisiere = fs.readdirSync(caleBackup, { withFileTypes: true })
    let data_curenta = new Date(Date.now())
    for (let fis of fisiere) {
        let numeFis = fis.name
        let caleFis = path.join(caleBackup, numeFis);
        let match = numeFis.match(/_(\d+)\./)
        if (match) {
            let dif = data_curenta - parseInt(match[1])
            if (dif / (1000 * 60) > T) {
                console.log("fisierul de backup" + caleFis + "a fost sters")
                fs.unlinkSync(caleFis)
            }
        }
    }
}
setTimeout(stergeBackup, 5 * 60 * 1000)
vFisiere = fs.readdirSync(obGlobal.folderScss)
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        ComplileazaSCss(numeFis)
    }
}
fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    console.log(eveniment, numeFis)
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis)
        if (fs.existsSync(caleCompleta)) {
            ComplileazaSCss(caleCompleta)
        }
    }
})

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find(function (elem) {
        return elem.identificator == identificator
    })
    if (eroare) {
        if (eroare.status)
            res.status(identificator)
        var titluCustom = titlu || eroare.titlu
        var textCustom = text || eroare.text
        var imagineCustom = imagine || eroare.imagine
    }
    else {
        var err = obGlobal.obErori.eroare_default
        var titluCustom = titlu || err.titlu
        var textCustom = text || err.text
        var imagineCustom = imagine || err.imagine
    }
    res.render("pagini/eroare", {
        titlu: titluCustom,
        text: textCustom,
        imagine: imagineCustom
    })
}


app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index", {
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini,
        licenta_galerie: obGlobal.obImagini.licenta_galerie,
        oferta: obGlobal.obOferte.oferte[0]
    });
})
app.get("/ghid", function (req, res) {
    res.render("pagini/ghid");
})
vectNrImag = [4, 9, 16]
app.get("/galeriePC", function (req, res) {

    n = vectNrImag[Math.floor(Math.random() * 3)]

    let imaginiClone = [...obGlobal.obImagini.imagini]
    imaginiClone = imaginiClone.filter(im => im.titlu.length >= 16)
        .sort(() => 0.5 - Math.random())

    let imaginiSelectate = imaginiClone.slice(0, n)

    const rezNrImag = sass.compileString(`
    $grid-size: ${Math.sqrt(n)};
    @import "resurse/scss/galerie_dinamica.scss";
  `, {
        loadPaths: ["./"]
    });
    let caleScss = path.join(__dirname, "/resurse/scss/galerie_dinamica.scss")
    let fisScssExt = path.basename(caleScss)
    let fisScss = fisScssExt.split(".")[0]
    let fisCss = fisScss + ".css"
    let caleCss = path.join(obGlobal.folderCss, fisCss)
    fs.writeFileSync(caleCss, rezNrImag.css)


    res.render("pagini/galeriePC", {
        imagini: obGlobal.obImagini.imagini,
        licenta_galerie: obGlobal.obImagini.licenta_galerie,
        grid_size: Math.sqrt(n),
        imaginiDinamice: imaginiSelectate
    });

})

app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function (req, res, next) {
    afisareEroare(res, 403);
})

app.get("/produse", async function (req, res) {
    let conditii = []
    let valori = []
    if (req.query.tip) {
        valori.push(req.query.tip)
        conditii.push("tip_produs=$" + valori.length)
    }
    if (req.query.categorie) {
        valori.push(req.query.categorie)
        conditii.push("categorie_produs=$" + valori.length)
    }
    try {
        const whereClause = conditii.length ? " where " + conditii.join(" and ") : ""
        const queryPretMax = req.query.tip ?
            `select max(pret) as pret_max from produs where tip_produs=$1` :
            `select max(pret) as pret_max from produs`
        // const queryPretMin = req.query.categorie ? 
        // `select min(pret) as pret_min from produs where categorie_produs=$1` :
        // `select min(pret) as pret_min from produs where tip_produs=$2`
        let queryPretMin;
        let valoriPretMin = [];

        if (req.query.categorie) {
            queryPretMin = `select min(pret) as pret_min from produs where categorie_produs=$1`;
            valoriPretMin = [req.query.categorie];
        } else if (req.query.tip) {
            queryPretMin = `select min(pret) as pret_min from produs where tip_produs=$1`;
            valoriPretMin = [req.query.tip];
        } else {
            queryPretMin = `select min(pret) as pret_min from produs`;
            valoriPretMin = [];
        }
        const queryStoc = req.query.tip ?
            `select max(stoc) as stoc_max,min(stoc) as stoc_min from produs where tip_produs=$1` :
            `select max(stoc) as stoc_max,min(stoc) as stoc_min from produs`
        const queryBrandOptiuni = "select * from unnest(enum_range(null::branduri))"
        const queryCategOptiuni = "select * from unnest(enum_range(null::categorii_produse))"
        const queryProduse = "select * from produs " + whereClause
        const queryDataCurenta = "select extract(month from current_date) as luna_curenta"
        const queryTip = req.query.tip ?
            "select tip_produs from produs where tip_produs=$1" :
            "select tip_produs from produs"

        const [rezPretMax, rezPretMin, rezStoc, rezBrandOptiuni, rezCategOptiuni, rezProduse, rezDataCurenta, rezTip] = await Promise.all([
            client.query(queryPretMax, req.query.tip ? [req.query.tip] : []),
            client.query(queryPretMin, valoriPretMin),
            client.query(queryStoc, req.query.tip ? [req.query.tip] : []),
            client.query(queryBrandOptiuni),
            client.query(queryCategOptiuni),
            client.query(queryProduse, valori),
            client.query(queryDataCurenta),
            client.query(queryTip, req.query.tip ? [req.query.tip] : [])
        ])
        rezProduse.rows.forEach(p => {
            p.data_formatata = p.data_adaugare.toLocaleDateString("ro-RO", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            })
            p.data_formatata = p.data_formatata.charAt(0).toUpperCase() + p.data_formatata.slice(1)
        })
        const lunaNume = new Date(2025, rezDataCurenta.rows[0].luna_curenta - 1).toLocaleDateString("ro-RO", { month: "long" });
        res.render("pagini/produse", {
            produse: rezProduse.rows,
            optiuniCateg: rezCategOptiuni.rows,
            optiuniBrand: rezBrandOptiuni.rows,
            pretMax: rezPretMax.rows[0].pret_max,
            pretMin: rezPretMin.rows[0].pret_min,
            stocMin: rezStoc.rows[0].stoc_min,
            stocMax: rezStoc.rows[0].stoc_max,
            dataCurenta: lunaNume.charAt(0).toUpperCase() + lunaNume.slice(1),
            tipProdus: rezTip.rows[0].tip_produs,
            oferta: obGlobal.obOferte.oferte[0]
        })
    } catch (err) {
        afisareEroare(res, 2)
    }
})
app.get("/produs/:id", async function (req, res) {
    try {
        const idProdus = req.params.id;

        const { rows: produsRows } = await client.query(
            `SELECT p.*, a.id_set 
             FROM produs p 
             JOIN asociere_set a ON p.id = a.id_produs 
             WHERE p.id = $1`,
            [idProdus]
        );
        if (produsRows.length === 0) return afisareEroare(res, 404);
        const produs = produsRows[0];

        produs.data_formatata = produs.data_adaugare.toLocaleDateString("ro-RO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const { rows: brandOptiuni } = await client.query(
            `SELECT * FROM produs WHERE brand = $1 AND id != $2`,
            [produs.brand, produs.id]
        );

        const { rows: infoSeturi } = await client.query(
            `select * from seturi where id in (
                select id_set from asociere_set where id_produs = $1
            )`,
            [idProdus]
        );

        const { rows: seturiProduse } = await client.query(
            `select p.*, a.id_set 
             from produs p 
             join asociere_set a on p.id = a.id_produs 
             where a.id_set in (
                 select id_set from asociere_set where id_produs = $1
             ) and p.id != $1`,
            [idProdus]
        );

        const seturiProduseMap = {};
        for (const set of infoSeturi) {
            seturiProduseMap[set.id] = seturiProduse.filter(p => p.id_set === set.id);
        }

        res.render("pagini/produs", {
            prod: produs,
            brand: brandOptiuni,
            infoSeturi: infoSeturi,
            seturiProduseMap: seturiProduseMap
        });

    } catch (err) {
        console.log(err);
        afisareEroare(res, 500);
    }
});

app.get("/seturi", function (req, res) {
    queryInfo = "select * from seturi"
    client.query(queryInfo, function (err, rezInfo) {
        if (err) {
            afisareEroare(res, 2)
        }
        else {
            if (rezInfo.rowCount == 0) {
                afisareEroare(res, 404)
            }
        }
        queryProd = "select p.*,a.id_set from produs p join asociere_set a on p.id=a.id_produs;"
        client.query(queryProd, function (err, rezProd) {
            if (err) {
                afisareEroare(res, 2)
            }
            else {
                if (rezProd.rowCount == 0) {
                    afisareEroare(res, 404)
                }
                res.render("pagini/seturi", { setInfo: rezInfo.rows, setProd: rezProd.rows, oferte: obGlobal.obOferte.oferte[0] })
            }
        })
    })
})

app.get("/*.ejs", function (req, res, next) {
    afisareEroare(res, 400);
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