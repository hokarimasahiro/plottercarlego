function pause2 (回数: number) {
    inPause = 1
    for (let index = 0; index < 回数; index++) {
        basic.pause(100)
        if (inPause == 0) {
            break;
        }
    }
    neopixelLight.showColor(neopixelLight.colors(neopixelLight.Colors.Black))
}
radio.onReceivedNumber(function (receivedNumber) {
    if (receivedNumber == 5) {
        chagePlotData()
    } else if (receivedNumber == 6) {
        if (inExcute == 0) {
            inExcute = plotData.length
        } else {
            inPause = 0
        }
    }
})
function chagePlotData () {
    plotNo = (plotNo + 1) % 8
    plotData = EEPROM.readStr(plotNo * maxDataSize, maxDataSize).split(LF)
}
function pen (action: string) {
    if (action.substr(0, 1) == "u" || action.substr(0, 1) == "U") {
        pins.servoWritePin(AnalogPin.P9, penUpDigree)
        basic.pause(200)
    } else if (action.substr(0, 1) == "d" || action.substr(0, 1) == "D") {
        pins.servoWritePin(AnalogPin.P9, penDownDigree)
        basic.pause(200)
    } else if (action.substr(0, 1) == "r" || action.substr(0, 1) == "R") {
        neopixelLight.showColor(neopixelLight.colors(neopixelLight.Colors.Red))
    } else if (action.substr(0, 1) == "y" || action.substr(0, 1) == "Y") {
        neopixelLight.showColor(neopixelLight.colors(neopixelLight.Colors.Yellow))
    } else if (action.substr(0, 1) == "g" || action.substr(0, 1) == "G") {
        neopixelLight.showColor(neopixelLight.colors(neopixelLight.Colors.Green))
    } else if (action.substr(0, 3) == "blu" || action.substr(0, 3) == "BLU") {
        neopixelLight.showColor(neopixelLight.colors(neopixelLight.Colors.Blue))
    } else if (action.substr(0, 3) == "bla" || action.substr(0, 3) == "BLA") {
        neopixelLight.showColor(neopixelLight.colors(neopixelLight.Colors.White))
    }
}
input.onButtonPressed(Button.A, function () {
    chagePlotData()
})
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    QUEUE.push(serial.readUntil(serial.delimiters(Delimiters.NewLine)))
})
radio.onReceivedString(function (receivedString) {
    plotData = [receivedString]
    inExcute = plotData.length
})
input.onButtonPressed(Button.B, function () {
    if (inExcute == 0) {
        inExcute = plotData.length
    } else {
        inExcute = 0
    }
})
function execute () {
    if (CMD.charAt(0) == "s" || CMD.charAt(0) == "S") {
        plotterCar.Straight(parseFloat(PRM[0]))
    } else if (CMD.charAt(0) == "c" || CMD.charAt(0) == "C") {
        plotterCar.curve(parseFloat(PRM[0]), parseFloat(PRM[1]))
    } else if (CMD.charAt(0) == "r" || CMD.charAt(0) == "R") {
        plotterCar.Rotate(parseFloat(PRM[0]))
    } else if (CMD.charAt(0) == "p" || CMD.charAt(0) == "P") {
        pen(PRM[0])
    } else if (CMD.charAt(0) == "w" || CMD.charAt(0) == "W") {
        pause2(parseFloat(PRM[0]))
    }
}
function execCommand () {
    if (MODE == 0) {
        CMD = COMMAND.split(",")[0]
        fileNo = parseFloat(COMMAND.split(",")[1])
        if (CMD == "w" || CMD == "W") {
            MODE = 1
            DAT = ""
            basic.showArrow(ArrowNames.South)
            serial.writeLine("$write file=" + fileNo)
        } else if (CMD == "r" || CMD == "R") {
            MODE = 2
            address = fileNo * blockSize
            basic.showArrow(ArrowNames.North)
            serial.writeLine("$read file=" + fileNo)
            DAT = EEPROM.readStr(address, blockSize)
            for (let 値 of DAT.split(LF)) {
                serial.writeLine("" + (値))
            }
            basic.showIcon(IconNames.Heart)
            MODE = 0
        }
    } else if (MODE == 1) {
        if (COMMAND == eof || COMMAND == eof2) {
            address = fileNo * blockSize
            for (let カウンター = 0; カウンター <= Math.ceil(DAT.length / pageSize); カウンター++) {
                EEPROM.writeStr(address, DAT.substr(カウンター * pageSize, pageSize))
                address += pageSize
            }
            basic.showIcon(IconNames.Heart)
            serial.writeLine("$write " + DAT.length + " bytes")
            MODE = 0
        } else {
            serial.writeLine("" + (COMMAND))
            DAT = "" + DAT + COMMAND + LF
        }
    }
}
let address = 0
let DAT = ""
let fileNo = 0
let COMMAND = ""
let MODE = 0
let PRM: string[] = []
let CMD = ""
let QUEUE: string[] = []
let inPause = 0
let penDownDigree = 0
let penUpDigree = 0
let plotData: string[] = []
let LF = ""
let maxDataSize = 0
let plotNo = 0
let inExcute = 0
let eof2 = ""
let eof = ""
let pageSize = 0
let blockSize = 0
blockSize = 4096
pageSize = 256
eof = String.fromCharCode(26)
eof2 = "$eof"
inExcute = 0
plotNo = 0
maxDataSize = 4096
LF = String.fromCharCode(10)
plotData = EEPROM.readStr(plotNo * maxDataSize, maxDataSize).split(LF)
serial.redirectToUSB()
radio.setGroup(66)
penUpDigree = 20
penDownDigree = 40
pins.servoWritePin(AnalogPin.P9, penUpDigree)
neopixelLight.initNeopixel(DigitalPin.P0, 4)
neopixelLight.showColor(neopixelLight.colors(neopixelLight.Colors.Black))
plotterCar.setParameter(8.37, 81)
plotterCar.Straight(0)
basic.forever(function () {
    if (inExcute == 0) {
        radio.sendString(plotData[0].substr(1, 20))
        basic.showString(plotData[0].substr(1, 20))
    }
})
basic.forever(function () {
    if (QUEUE.length > 0) {
        COMMAND = QUEUE.removeAt(0)
        execCommand()
    } else if (inExcute > 0) {
        watchfont.showNumber2(inExcute)
        pause2(10)
        for (let plotCommand of plotData) {
            serial.writeLine("" + (plotCommand))
            CMD = plotCommand.split(" ")[0]
            if (plotCommand.includes(" ")) {
                PRM = plotCommand.split(" ")[1].split(",")
            } else {
                PRM = ["0", "0"]
            }
            execute()
            if (inExcute <= 0) {
                inExcute = 0
                break;
            }
            inExcute += -1
            watchfont.showNumber2(inExcute)
        }
    }
})
