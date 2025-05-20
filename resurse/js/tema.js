const toggleBtn = document.getElementById("theme-toggle")
const icon = document.getElementById("theme-icon")
const myImg = document.getElementsByClassName("prezentare")[0]

function setImages(isGray) {
    if (myImg) {

        if (isGray) {
            myImg.classList.add("gri")
        }
        else {
            myImg.classList.remove("gri")
        }
        localStorage.setItem("isGray", isGray)
    }
}
function setTheme(tema) {
    document.documentElement.setAttribute("data-theme", tema)
    localStorage.setItem("theme", tema)
    icon.className = tema === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon"
}
const savedTheme = localStorage.getItem("theme") || "dark"
const savedGray = localStorage.getItem("isGray") === "true"
setTheme(savedTheme)
setImages(savedGray)

toggleBtn.onchange = function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    const newIsGray = newTheme === "light";
    setTheme(newTheme)
    setImages(newIsGray)
}
const radioButtons=document.getElementsByName("rad_tema")
radioButtons.forEach(r=>{
    r.addEventListener("change",function(){
        const selectedTheme=this.value
        setTheme(selectedTheme)
        setImages(savedGray)
    })
})
function setActiveRadioButton(theme)
{
    butoaneTeme=document.getElementsByClassName("butoane-teme")[0]
    if (butoaneTeme){
        document.querySelector(`#tema1`).checked = theme === "light";
        document.querySelector(`#tema2`).checked = theme === "dark";
        document.querySelector(`#tema3`).checked = theme === "contrast";
    }
}
setActiveRadioButton(savedTheme);
