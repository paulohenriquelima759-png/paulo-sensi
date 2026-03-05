const lista = document.getElementById("lista")

celulares.forEach(cel => {

lista.innerHTML += `
<div class="card">
<h3>${cel.nome}</h3>
<p>Geral: ${cel.geral}</p>
<p>Red Dot: ${cel.reddot}</p>
<p>DPI: ${cel.dpi}</p>
<button onclick="copiar('${cel.geral}/${cel.reddot}/${cel.dpi}')">Copiar Sensibilidade</button>
</div>
`

})

function copiar(texto){

navigator.clipboard.writeText(texto)

alert("Sensibilidade copiada!")

}

function buscar(){

let input=document.getElementById("busca").value.toLowerCase()

let cards=document.querySelectorAll(".card")

cards.forEach(card=>{

if(card.innerText.toLowerCase().includes(input)){
card.style.display="block"
}else{
card.style.display="none"
}

})

}
