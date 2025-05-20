window.onload = function () {
    let containerProduse = document.getElementsByClassName("grid-produse")[0]
    const K = 10
    const PAGE_SIZE = K 

    containerProduse.addEventListener("click", function (e) {
        const btn = e.target.closest("button");
        if (!btn) return
        if (btn.classList.contains("buton-pin")) {
            toggleStyle(btn)
            pastreazaProdus(btn)
        }
        if (btn.classList.contains("buton-sterge-temporar")) {
            toggleStyle(btn)
            stergeProdTemp(btn)
        }
        if (btn.classList.contains("buton-sterge-sesiune")) {
            toggleStyle(btn)
            stergeProdSes(btn)
        }
    });
    function setupModals()
    {
        document.querySelectorAll(".link-modal").forEach(link=>{
            link.addEventListener("click",function(event){
                event.preventDefault()
                const produs=this.closest(".produs")
                const modal=produs.querySelector(".modal")
                modal.style.display="block"
                const closeBtn=modal.querySelector(".close")
                const pretRedus=modal.querySelector(".modal-pret-redus")
                console.log(modal.innerHTML)
                if(pretRedus)
                {
                    const valpretRedus=pretRedus.dataset.redus
                    const valpretVechi=pretRedus.dataset.vechi
                    console.log(valpretRedus)
                    console.log(valpretVechi)
                    pretRedus.innerHTML=`<s>${valpretVechi}</s><ins style="margin-left:1rem";>${valpretRedus}</ins>`
                }
                closeBtn.onclick=function()
            {   
                modal.style.display="none"
            }
            window.onclick=function(event){
                if(event.target==modal)
                    {
                        modal.style.display="none"
                    }
                }
            })
        })
    }
    let prodInit = document.getElementsByClassName("produs")
    let vprodInit = Array.from(prodInit)
    let vprodInitNode = vprodInit.map(p => p.cloneNode(true));
    let currentNodes = [...vprodInitNode]
    let currentPage = 1

    function renderProduse(nodes) {
        //plaseaza produsele din nodes in grid si le afiseaza
        const grid = document.querySelector(".grid-produse")
        grid.innerHTML = ""
        nodes.forEach(n => grid.appendChild(n.cloneNode(true)))
        setupModals() 
    }

    function updateRezCount(count) {
        let cnt = document.getElementById("rez-count")
        if (!cnt) {
            cnt = document.createElement("p")
            cnt.id = "rez-count"
            document.querySelector(".container-produse").prepend(cnt)
        }
        cnt.textContent = `Au fost găsite ${count} produse.`
    }

    function renderPaginare(nodes) {
        //adauga butoanele de control a paginilor (pagina 1,2,3)
        const control = document.querySelector(".control-pagini")
        if (control) control.remove()
        
        const totalPages = Math.ceil(nodes.length / K)
        const container = document.createElement("div")
        container.className = "control-pagini"
        
        for (let p = 1; p <= totalPages; p++) {
            const btn = document.createElement("button")
            btn.textContent = "Pagina "+ p
            btn.className = p === currentPage ? "active btn btn-secondary me-1" : "btn btn-secondary me-1"
            btn.addEventListener("click", () => {
                currentPage = p
                renderPage()
            })
            container.appendChild(btn)
        }
        
        document.getElementsByClassName("grid-produse")[0].parentNode.insertBefore(container, document.getElementsByClassName("grid-produse")[0])
    }

    function renderPage() {
        //grupeaza produsele in portiuni de k produse pentru a le afisa pe pagini
        //apoi apeleaza render produse pentru a le afisa in grid
        //render paginare pentru a genera butoanele de control\
        //updateaza nr care arata cate produse se afiseaza 

        //cand este apelata de un buton generat de renderPaginare
        //se va schimba intervalul care incepe in start
        //iar pageitems va fi diferit
        const start = (currentPage - 1) * K
        const pageItems = currentNodes.slice(start, start + K)
        renderProduse(pageItems)
        renderPaginare(currentNodes)
        updateRezCount(currentNodes.length)
    }

    btn = document.getElementById("filtrare")
    function valideazaNume(verif) {
        const len = verif.value.trim().length;
        return len === 0 || len >= 3
    }
    function toggleStyle(btn) {
        btn.classList.toggle("buton-activ")
    }
    function pastreazaProdus(btn) {
        const container = btn.closest(".produs");
        if (container) {
            container.classList.toggle("produs-activ");
        }
    }
    function stergeProdTemp(btn) {
        const container = btn.closest(".produs")
        if (container) {
            container.classList.toggle("sterge-temporar")
        }
    }
    function stergeProdSes(btn) {
        const container = btn.closest(".produs");
        if (!container)
            return;

        const id = container.dataset.id;
        const sterse = JSON.parse(sessionStorage.getItem("sterseSesion") || "[]");

        if (!sterse.includes(id)) {
            sterse.push(id);
            sessionStorage.setItem("sterseSesion", JSON.stringify(sterse));
        }

        container.remove();
        
        currentNodes = currentNodes.filter(node => node.dataset.id !== id);
        renderPage();
    }
    let verifInpNume = document.getElementById("inp-nume")
    let verifInpDescriere = document.getElementById("inp-descriere")
    let verifInpCategorie = document.getElementById("inp-categorie")
    textInvalid(verifInpNume)
    textInvalid(verifInpDescriere)
    textInvalid(verifInpCategorie)
    function textInvalid(input) {
        input.addEventListener("input", () => {
            if (valideazaNume(input)) {
                input.classList.remove("is-invalid")
            }
        })
    }
    document.querySelectorAll(
        '#inp-nume, #inp-descriere, #inp-brand, #inp-categorie, #inp-stoc '
    ).forEach(e => {
        e.addEventListener('input', filtrare)
    })
    document.querySelectorAll(
        'input[name="gr_rad"], #inp-data', '#inp-specificatii'
    ).forEach(e => {
        e.addEventListener('change', filtrare)
    })
    btn.onclick = filtrare
    function filtrare() {
        let inpNume = document.getElementById("inp-nume").value.trim().toLowerCase()
        if (inpNume.length < 3 && inpNume.length > 0) {
            verifInpNume.classList.add("is-invalid")
            // alert("Introduceti cel putin 3 caractere pentru nume")
            return
        }
        let inpDescriere = document.getElementById("inp-descriere").value.trim().toLowerCase()
        if (inpDescriere.length < 3 && inpDescriere.length > 0) {
            verifInpDescriere.classList.add("is-invalid")
            //     alert("Introduceti cel putin 3 caractere pentru descriere")
            //     return
        }
        let vectRadio = document.getElementsByName("gr_rad")
        let minPret = null
        let maxPret = null
        let inpPret = null
        for (let rad of vectRadio) {
            if (rad.checked) {
                inpPret = rad.value
                if (inpPret != "toate") {
                    [minPret, maxPret] = inpPret.split(":")
                    minPret = parseInt(minPret)
                    maxPret = parseInt(maxPret)
                }
                break
            }
        }
        let inpBrand = document.getElementById("inp-brand").value.trim().toLowerCase()
        let inpStoc = document.getElementById("inp-stoc").value
        let inpCategorie = document.getElementById("inp-categorie").value.trim().toLowerCase()
        if (inpCategorie.length < 3 && inpCategorie.length > 0) {
            verifInpCategorie.classList.add("is-invalid")
            // alert("Introduceți cel puțin 3 caractere pentru categorie")
            return
        }
        let inpData = document.getElementById("inp-data")
        let inpSpec = document.getElementById("inp-spec")
        let selected = Array.from(inpSpec.selectedOptions).map(a => a.value)
        if (selected.length > 2) {
            alert("Puteți alege maxim 2 specificații")
            return
        }
        
        let filteredNodes = [];

        for (let prod of vprodInitNode) {
            if (!prod.classList.contains("produs-activ")) {
                let nume = prod.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase()
                let cond1 = eliminareDiacritice(nume).startsWith(inpNume)

                let stoc = parseFloat(prod.getElementsByClassName("val-stoc")[0].innerHTML.trim())
                let cond2 = (inpStoc >= stoc)

                let pret = parseInt(prod.getElementsByClassName("val-pret")[0].innerHTML.trim())
                let cond3 = (inpPret == "toate" || (minPret <= pret && pret <= maxPret))

                let data = prod.getElementsByClassName("val-data")[0].innerHTML.trim()
                let data_curenta = new Date().toLocaleDateString("ro-RO", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })
                let cond4 = 1
                if (inpData.checked) {
                    cond4 = (data_curenta.split(" ")[2].trim().toLowerCase() == data.split(" ")[2].trim().toLowerCase())
                }
                let descriere = prod.getElementsByClassName("val-descriere")[0].innerHTML.trim().toLowerCase()
                let cond5 = eliminareDiacritice(descriere).includes(inpDescriere)

                let specificatii = Array.from(prod.getElementsByClassName("val-spec")).map(s => s.innerText.trim().toLowerCase())
                let cond6 = (selected.includes("toate")) ? 1 : 0
                for (let sel of selected) {
                    if (specificatii.some(p => p.includes(sel))) {
                        cond6 = 1
                        break
                    }
                }
                let brand = prod.getElementsByClassName("val-brand")[0].innerHTML.trim().toLowerCase()
                let cond7 = (inpBrand == "toate" || brand == inpBrand)
                let categorie = prod.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase()
                let cond8 = (inpCategorie == "toate" || eliminareDiacritice(categorie).startsWith(inpCategorie))
                
                if (cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7 && cond8) {
                    filteredNodes.push(prod.cloneNode(true));
                }
                //daca un produs indeplineste toate conditiile
                //se se introduce in vect de produse filtrate
                //dupa care este realizat ca noul vector de produse
                //si este afisat pe pagina 1 
            }
        }
        
        currentNodes = filteredNodes;
        currentPage = 1;
        
        if (filteredNodes.length === 0) {
            if (!document.getElementById("niciun-rezultat")) {
                let pNoResult = document.createElement("p")
                pNoResult.innerHTML = "Ne pare rău dar nu avem acest tip de produs!"
                pNoResult.id = "niciun-rezultat"
                let p = document.getElementsByClassName("container-produse")[0]
                p.parentNode.insertBefore(pNoResult, p.nextElementSibling)
            }
        } else {
            let p1 = document.getElementById("niciun-rezultat")
            if (p1) {
                p1.remove()
            }
        }
        
        renderPage();
    }
    document.getElementById("inp-stoc").onchange = function () {
        document.getElementById("info-range").innerHTML = `(${this.value})`
    }
    document.getElementById("sortCrescPret").onclick = function () {
        sorteaza(1)
    }
    document.getElementById("sortDescrescPret").onclick = function () {
        sorteaza(-1)
    }
    function sorteaza(tipSortare) {
        let cheie_sortare_1=document.getElementById("cheie_sortare_1").value
        let cheie_sortare_2=document.getElementById("cheie_sortare_2").value
        if(cheie_sortare_1==cheie_sortare_2)
        {
            alert("Alegeți 2 chei diferite pentru sortare")
            return
        }
        
        let sorted = currentNodes.slice();
        sorted.sort(function (a, b) {
            let cheie1A = parseFloat(a.getElementsByClassName("val-"+cheie_sortare_1)[0].innerHTML.trim())
            let cheie1B = parseFloat(b.getElementsByClassName("val-"+cheie_sortare_1)[0].innerHTML.trim())
            if(!isNaN(cheie1A) && !isNaN(cheie1B))
            {
                if (cheie1A != cheie1B) {
                    return tipSortare * (cheie1A - cheie1B)
                }
            }
            else{
                if(cheie1A!=cheie1B)
                    return tipSortare*cheie1A.toLocaleString(cheie1B)
            }
            let cheie2A = parseFloat(a.getElementsByClassName("val-"+cheie_sortare_2)[0].innerHTML.trim())
            let cheie2B = parseFloat(b.getElementsByClassName("val-"+cheie_sortare_2)[0].innerHTML.trim())
            if(!isNaN(cheie2A) && !isNaN(cheie2B)){
                return tipSortare * (cheie2A - cheie2B)
            }
            else{
                return tipSortare*cheie2A.toLocaleString(cheie2B)
            }
            
        })
        //curent nodes reprezinta vectorul sortat dupa care se apeleaza renderpage
        currentNodes = sorted;
        currentPage = 1;
        renderPage();
    }
    document.getElementById("resetare").onclick = function () {
        if (!confirm("Ești sigur că vrei să resetezi toate filtrele ?")) {
            return;
        }
        document.getElementById("inp-nume").value = ""
        document.getElementById("inp-stoc").value = "150"
        document.getElementById("inp-data").checked = false
        document.getElementById("rad4").checked = true
        document.getElementById("inp-categorie").value = ""
        document.getElementById("inp-descriere").value = ""
        document.getElementById("sel-toate").selected = true
        document.getElementById("inp-spec").value = "toate"
        //produsele curente vor fi cele initiale in aceeasi ordine ca la inceput
        //dupa care pagina curenta va fi 1 si se apeleaza renderPage
        currentNodes = vprodInitNode.slice(); 
        currentPage = 1;
        renderPage();
    }
    document.getElementById("calculareSuma").onclick = function () {
        let produse = document.getElementsByClassName("produs")
        sumaPreturi = 0
        for (let prod of produse) {
            let selectat = prod.getElementsByClassName("select-cos")[0]
            if (prod.style.display != "none" && selectat.checked) {
                let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim())
                sumaPreturi += pret
            }
        }
        if (!document.getElementById("suma_preturi")) {
            let pRezultat = document.createElement("p")
            pRezultat.innerHTML = sumaPreturi + "RON"
            pRezultat.id = "suma_preturi"
            let p = document.getElementById("calculareSuma")
            p.parentNode.insertBefore(pRezultat, p.nextElementSibling)
            setTimeout(function () {
                let p1 = document.getElementById("suma_preturi")
                if (p1) {
                    p1.remove()
                }
            }, 2000)
        }
    }
    
    function paginare() {
        renderPaginare(currentNodes);
        renderPage();
    }
    
    function eliminareDiacritice(cuvant)
    {
        const map={
            "ă":"a",
            "ș":"s",
            "ț":"t",
            "î":"i",
            "â":"a"
        }
        return cuvant.replace(/[ășțîâ]/g,c=>map[c]||c)
    }
    
    paginare()
    setupModals()
}