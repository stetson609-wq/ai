const UI = {
messages: document.getElementById("messages"),
input: document.getElementById("user-input"),
sendBtn: document.getElementById("send-btn"),
clearBtn: document.getElementById("clear-btn"),
empty: document.getElementById("empty-state")
}

const STORAGE_KEY = "ghost_chat_history"

let chatHistory = []
let isStreaming = false


/* ==============================
INITIALIZATION
============================== */

loadHistory()
updateSendState()
UI.input.focus()


/* ==============================
HELPERS
============================== */

function scrollBottom(){
UI.messages.scrollTo({
top: UI.messages.scrollHeight,
behavior: "smooth"
})
}

function removeEmpty(){
if(UI.empty && UI.empty.parentNode){
UI.empty.remove()
}
}

function formatTime(){

const now = new Date()

return now.toLocaleTimeString([],{
hour: "2-digit",
minute: "2-digit"
})

}

function saveHistory(){
localStorage.setItem(STORAGE_KEY,JSON.stringify(chatHistory))
}

function loadHistory(){

const saved = localStorage.getItem(STORAGE_KEY)

if(!saved) return

chatHistory = JSON.parse(saved)

chatHistory.forEach(msg=>{
addMessage(msg.role,msg.content,false)
})

}


/* ==============================
MESSAGE CREATION
============================== */

function createMessage(role,text,time){

const row = document.createElement("div")
row.className = `msg ${role}`

const label = document.createElement("div")
label.className = "label"
label.textContent = role === "user" ? "you" : "ghost"

const bubble = document.createElement("div")
bubble.className = "bubble"

if(role === "assistant"){
bubble.innerHTML = marked.parse(text)
}else{
bubble.textContent = text
}

const footer = document.createElement("div")
footer.className = "msg-footer"

const timestamp = document.createElement("span")
timestamp.className = "timestamp"
timestamp.textContent = time || formatTime()

footer.appendChild(timestamp)

if(role === "assistant"){

const retry = document.createElement("button")
retry.className = "retry-btn"
retry.textContent = "retry"

retry.onclick = ()=>{
retryMessage(text)
}

footer.appendChild(retry)

}

row.append(label,bubble,footer)

return {row,bubble}

}


/* ==============================
ADD MESSAGE
============================== */

function addMessage(role,text,save=true){

removeEmpty()

const {row,bubble} = createMessage(role,text)

UI.messages.appendChild(row)

addCodeCopyButtons(bubble)

scrollBottom()

if(save){

chatHistory.push({
role,
content:text
})

saveHistory()

}

return bubble
}


/* ==============================
COPY CODE BUTTONS
============================== */

function addCodeCopyButtons(container){

container.querySelectorAll("pre").forEach(block=>{

const btn = document.createElement("button")

btn.className = "copy-btn"
btn.textContent = "copy"

btn.onclick = async ()=>{

await navigator.clipboard.writeText(block.innerText)

btn.textContent = "copied"

setTimeout(()=>{
btn.textContent = "copy"
},2000)

}

block.appendChild(btn)

})

}


/* ==============================
TYPING INDICATOR
============================== */

function showTyping(){

const row = document.createElement("div")
row.className = "msg assistant typing"

row.innerHTML = `
<div class="label">ghost</div>
<div class="bubble typing-dots">
<span></span><span></span><span></span>
</div>
`

UI.messages.appendChild(row)

scrollBottom()

return row

}


/* ==============================
STREAMING RESPONSE
============================== */

async function streamResponse(prompt){

const bubble = addMessage("assistant","")

let text = ""

const fakeResponse = "This is a streaming response example. Replace this with your API call."

for(const char of fakeResponse){

text += char

bubble.innerHTML = marked.parse(text)

await new Promise(r=>setTimeout(r,15))

scrollBottom()

}

chatHistory.push({
role:"assistant",
content:text
})

saveHistory()

}


/* ==============================
SEND MESSAGE
============================== */

async function sendMessage(){

const text = UI.input.value.trim()

if(!text || isStreaming) return

isStreaming = true
updateSendState()

addMessage("user",text)

UI.input.value = ""
UI.input.style.height = "auto"

const typing = showTyping()

await new Promise(r=>setTimeout(r,600))

typing.remove()

await streamResponse(text)

isStreaming = false
updateSendState()

}


/* ==============================
RETRY MESSAGE
============================== */

async function retryMessage(){

const lastUser = [...chatHistory].reverse().find(m=>m.role==="user")

if(!lastUser) return

await streamResponse(lastUser.content)

}


/* ==============================
CLEAR CHAT
============================== */

function clearChat(){

chatHistory = []

localStorage.removeItem(STORAGE_KEY)

UI.messages.innerHTML = ""

UI.messages.appendChild(UI.empty)

}


/* ==============================
INPUT
============================== */

function autoResize(){

UI.input.style.height = "auto"

UI.input.style.height =
Math.min(UI.input.scrollHeight,140) + "px"

updateSendState()

}

function updateSendState(){

const hasText = UI.input.value.trim().length > 0

UI.sendBtn.disabled = !hasText || isStreaming

}


/* ==============================
EVENTS
============================== */

UI.input.addEventListener("input",autoResize)

UI.input.addEventListener("keydown",e=>{

if(e.key === "Enter" && !e.shiftKey){

e.preventDefault()

sendMessage()

}

})

UI.sendBtn.addEventListener("click",sendMessage)

UI.clearBtn.addEventListener("click",clearChat)


/* ==============================
KEYBOARD SHORTCUTS
============================== */

document.addEventListener("keydown",e=>{

if(e.metaKey && e.key === "k"){

e.preventDefault()

UI.input.focus()

}

})
