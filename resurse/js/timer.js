window.onload=function()
{
    const timerContainer=document.getElementById("timer")
    const data_finalizare_element=document.getElementById("data-finalizare")
    const iso=data_finalizare_element.dataset.iso
    const data_finalizare=new Date(iso)
    const data_curenta=new Date(Date.now())
    let dif=data_finalizare-data_curenta
    let secTotal=Math.floor(dif/1000)
    let ore=Math.floor(secTotal / 3600)
    secTotal%=3600
    let minute=Math.floor(secTotal / 60)
    let secunde=secTotal%60
    const interval=setInterval(()=>
        {
            if(secunde>0)
            {
                secunde--
            }
            else{
                if(minute>0)
                {
                    minute--
                    secunde=59
                }
                else{
                    if(ore>0)
                    {
                        ore--
                        minute=59
                        secunde=59
                    }
                    else{
                        timerContainer.textContent = `Oferta a expirat ! `
                        clearInterval(interval);
                        return
                    }
                }
            }
            if(minute==0 && secunde < 10)
            {
                timerContainer.classList.add("timer-final")
            }
        let o = ore.toString().padStart(2, "0");
        let m = minute.toString().padStart(2, "0");
        let s = secunde.toString().padStart(2, "0");

        timerContainer.textContent = `Timp rămas: ${o}:${m}:${s}`
    },1000)
}
