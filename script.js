const quertz = "QWERTZUIOASDFGHJKPYXCVBNML".split("")
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
// ********** inner workings of enigma machine **********
// wire mapping and turnover positions for enigma 1 machine
const rotorConfigs = [
    ["EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q"],
    ["AJDKSIRUXBLHWTMCQGZNPYFVOE", "E"],
    ["BDFHJLCPRTXVZNYEIWGAKMUSQO", "V"],
    ["ESOVPZJAYQUIRHXLNFTGKDCMWB", "J"],
    ["VZBRGITYUPSDNHLXAWMJQOFECK", "Z"]
]
const reflectorConfigs = [
    "EJMZALYXVBWFCRQUONTSPIKHGD",
    "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    "FVPJIAOYEDRZXWGCTKUQSBNMHL",
]

letterIndex = (letter) => letter.charCodeAt(0) - 65

class Rotor {
    constructor(rotorType, initPosition) {
        this.map = rotorConfigs[rotorType][0].split("")
        this.turnover = letterIndex(rotorConfigs[rotorType][1])
        this.position = letterIndex(initPosition)
    }
    increment() {
        this.position++
        this.position %= 26
    }
    atTurnover() {
        return this.position == this.turnover
    }
    inputFromRight(letter) {
        return this.map[(letterIndex(letter) + this.position) % 26]
    }
    inputFromLeft(letter) {
        //when the rotor moves the letter basically goes up for example C is where B was
        //therefore we find
        let char = this.map.indexOf(letter)
        char -= this.position
        //if char negative wrap around by adding 26 otherwise do nothing
        char += char < 0 ? 26 : 0
        return alphabet[char]
    }
}
class Reflector {
    constructor(reflectorType) {
        this.map = reflectorConfigs[reflectorType].split("")
    }
    input(letter) {
        return this.map[letterIndex(letter)]
    }
}
class Plugboard {
    constructor() {
        this.pointer = -1 //value -1 when there are only completed pairs otherwise its the index of the pair being made
        this.pairs = Array(10).fill(-1)
    }
    addLetter(letter) {
        if (this.pointer == -1) {
            //if theres no incomplete pair start the pair and store its index to be accessed later
            this.pointer = this.pairs.indexOf(-1)
            if (this.pointer != -1) {
                this.pairs[this.pointer] = letter
            }
            return this.pointer
        } else {
            //if theres a partial pair add the letter to finish it
            this.pairs[this.pointer] += letter
            let temp = this.pointer
            this.pointer = -1
            return temp
        }
    }
    removePair(letter) {
        let outputIndex = -1
        let outputPair
        this.pairs.some((pair, index) => {
            if (pair != -1 && pair.includes(letter)) {
                outputIndex = index
                outputPair = pair
                this.pairs[index] = -1
                return true //ends loop once pair is found
            }
        })
        return { index: outputIndex, pair: outputPair }
    }
    getPairedLetter(letter) {
        let pairContainingLetter
        this.pairs.some((pair, index) => {
            if (pair != -1 && pair.includes(letter)) {
                pairContainingLetter = pair
                return true //ends loop once pair is found
            }
        })
        return pairContainingLetter ? pairContainingLetter.replace(letter, "") : -1
    }
}
class Enigma {
    constructor(rotors, reflector, plugboard) {
        this.rotors = rotors
        this.reflector = reflector
        this.plugboard = plugboard
        document.querySelector("#rotorPositionsDisplay").innerHTML=this.getPositions().join("&nbsp".repeat(5))
    }
    input(letter) {
        let out = letter
        let path = []
        //going right to left through rotors
        let pair = this.plugboard.getPairedLetter(letter)
        out = pair != -1 ? pair : out
        for (let rotor = this.rotors.length - 1; rotor >= 0; rotor--) {
            out = this.rotors[rotor].inputFromRight(out)
            path.push(out)
        }
        //reflector
        out = this.reflector.input(out)
        path.push(out)
        //going left to right through rotors
        for (let rotor = 0; rotor < this.rotors.length; rotor++) {
            out = this.rotors[rotor].inputFromLeft(out)
            path.push(out)
        }
        pair = this.plugboard.getPairedLetter(out)
        out = pair != -1 ? pair : out
        return { "out": out, "path": path }
    }
    increment() {
        //when a rotor is at its turnover position and increments then the next rotor over also increments
        //for the middle rotor to move the right rotor has to be at its turnover position
        let midRotorIncremented
        if (this.rotors[2].atTurnover()) {
            this.rotors[1].increment()
            midRotorIncremented = true
        }
        //for the left rotor to move the middle and right rotor have to be at their turnover position
        if (this.rotors[0].atTurnover() && midRotorIncremented) {
            this.rotors[0].increment()
        }
        this.rotors[2].increment()
    }
    getPositions(){
        return[this.rotors[0].position+1,this.rotors[1].position+1,this.rotors[2].position+1]
    }
}
// ********** ui stuff **********

//default enigma machine using rotors I-II-III and all in first position
let enigma = new Enigma([
    //left to right
    new Rotor(0, "A"),
    new Rotor(1, "A"),
    new Rotor(2, "A")
], new Reflector(1), new Plugboard())

let inHistory = document.querySelector("#inputHistory")
let outHistory = document.querySelector("#outputHistory")

let keyRows = document.querySelectorAll(".keyRow")
let lampRows = document.querySelectorAll(".lampRow")
let plugboardRows = document.querySelectorAll(".plugRow")

// create buttons, lamps, plugs
let lamps = []
let keys = []
let plugboardButtons = []

quertz.forEach((letter, index) => {
    let row
    if (index < 9) { row = 0 } else if (index < 17) { row = 1 } else { row = 2 }
    let key = document.createElement("button")
    let lamp = document.createElement("div")
    let plugboardPlug = document.createElement("div")
    let plugboardButton = document.createElement("button")
    let span = document.createElement("span")

    span.textContent = letter

    key.className = "key"
    lamp.className = "lamp"
    plugboardPlug.className = "plug"
    plugboardButton.className = "plugButton"
    //value doesnt actually serve any functionality besides easily associating the letter with the button
    plugboardButton.value = letter

    key.appendChild(span.cloneNode(true))
    lamp.appendChild(span.cloneNode(true))
    plugboardPlug.appendChild(span)
    plugboardPlug.appendChild(plugboardButton)

    plugboardButton.addEventListener("click", event => handlePlugboardChange(event.target))
    key.addEventListener("click", _ => { handleInput(letter) })

    keyRows[row].appendChild(key)
    lampRows[row].appendChild(lamp)
    plugboardRows[row].appendChild(plugboardPlug)

    keys.push(key)
    lamps.push(lamp)
    plugboardButtons.push(plugboardButton)
})
//position input behavior
document.querySelectorAll(".rotorPositonOption").forEach(el=>{
    el.addEventListener("focus",el=>{
        el.target.placeholder=el.target.value
        el.target.value=""
    })
    el.addEventListener("input",el=>{
        el.target.value=el.target.value.toUpperCase()
        el.target.blur()
    })
    el.addEventListener("focusout",el=>{
        if (el.target.value==""){
            el.target.value=el.target.placeholder
        }
        el.target.placeholder=""
    })
})
//physical keyboard support
document.querySelector("#keyboardButton").addEventListener("keypress", (e) => {
    if (/[a-z]/.test(e.key)) {
        handleInput(e.key.toUpperCase())
    }
})

//update enigma machine
document.querySelector("#updateSettings").addEventListener("click", () => {
    let rotorSelections = document.querySelectorAll(".rotorOption")
    let rotorPositions = document.querySelectorAll(".rotorPositonOption")
    let reflector = document.querySelector("#reflectorOption")
    enigma = new Enigma([
        new Rotor(rotorSelections[0].value, rotorPositions[0].value),
        new Rotor(rotorSelections[1].value, rotorPositions[1].value),
        new Rotor(rotorSelections[2].value, rotorPositions[2].value)
    ], new Reflector(reflector.value),enigma.plugboard)
    //^keeps plugboard
    inHistory.innerHTML = outHistory.innerHTML = ""
})

function handleInput(letter) {
    key = keys[quertz.indexOf(letter)]
    key.classList.add("pressed")
    setTimeout(_ => key.classList.remove("pressed"), (200));
    out = enigma.input(letter)
    //showPath(out.path)
    document.querySelector("#rotorPositionsDisplay").innerHTML=enigma.getPositions().join("&nbsp".repeat(5))
    lightLamp(out.out)
    inHistory.innerHTML += letter
    outHistory.innerHTML += out.out
    enigma.increment()
}
function lightLamp(letter) {
    let el = lamps[quertz.indexOf(letter)]
    el.classList.add("on")
    setTimeout(_ => el.classList.remove("on"), (500));
}
function handlePlugboardChange(button) {
    //if clicked on value in pair and there is no pair being added
    if (enigma.plugboard.pointer == -1 && button.classList.value.includes("plugBoardSelection")) {
        let pairInfo = enigma.plugboard.removePair(button.value)
        pairInfo.pair.split("").forEach(letter => {
            plugboardButtons[quertz.indexOf(letter)].classList.remove("plugBoardSelection" + pairInfo.index)
        })
    } else if (!button.classList.value.includes("plugBoardSelection")) {
        let index = enigma.plugboard.addLetter(button.value)
        if (index != -1) {
            button.classList.add("plugBoardSelection" + index)
        }
    }
}
