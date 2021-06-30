function pause2 (数値: number) {
    basic.pause(5000)
    neopixel.showColor(neopixel.colors(neopixel.Colors.Black))
}
function pen (action: string) {
    if (action == "up") {
        pins.servoWritePin(AnalogPin.P15, penUpDigree)
        basic.pause(100)
    } else if (action == "down") {
        pins.servoWritePin(AnalogPin.P15, penDownDigree)
        basic.pause(100)
    } else if (action == "red") {
        neopixel.showColor(neopixel.colors(neopixel.Colors.Red))
        pause2(1)
    } else if (action == "yellor") {
        neopixel.showColor(neopixel.colors(neopixel.Colors.Yellow))
        pause2(1)
    } else if (action == "green") {
        neopixel.showColor(neopixel.colors(neopixel.Colors.Green))
        pause2(1)
    } else if (action == "blue") {
        neopixel.showColor(neopixel.colors(neopixel.Colors.Blue))
        pause2(1)
    } else if (action == "black") {
        neopixel.showColor(neopixel.colors(neopixel.Colors.White))
        pause2(1)
    }
}
input.onButtonPressed(Button.A, function () {
    plotNo = (plotNo + 1) % 8
    plotData = EEPROM.readStr(plotNo * maxDataSize, maxDataSize).split(LF)
})
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    QUEUE.push(serial.readUntil(serial.delimiters(Delimiters.NewLine)))
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
    }
}
function execCommand () {
    if (MODE == 0) {
        CMD = COMMAND.split(",")[0]
        fileNo = parseFloat(COMMAND.split(",")[1])
        if (CMD == "w" || CMD == "W") {
            MODE = 1
            address = fileNo * blockSize
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
        } else if (CMD == "d" || CMD == "D") {
            MODE = 3
            address = bit.hexToNumber(COMMAND.split(",")[1])
            basic.showArrow(ArrowNames.East)
            serial.writeLine("")
            serial.writeLine("addr 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f *0123456789abcdef*")
            for (let row = 0; row <= 15; row++) {
                HEX = ""
                CHAR = ""
                RAW = EEPROM.readBuf(address, 16)
                for (let col = 0; col <= 15; col++) {
                    HEX = "" + HEX + bit.numberToHex(RAW[col], 2) + " "
                    if (RAW[col] >= 32 && RAW[col] < 127) {
                        CHAR = "" + CHAR + String.fromCharCode(RAW[col])
                    } else {
                        CHAR = "" + CHAR + "."
                    }
                }
                serial.writeLine("" + bit.numberToHex(address, 4) + " " + HEX + "*" + CHAR + "*")
                address += 16
            }
            basic.showIcon(IconNames.Heart)
            MODE = 0
        }
    } else if (MODE == 1) {
        if (COMMAND == eof || COMMAND == eof2) {
            EEPROM.writeStr(address, DAT)
            basic.showIcon(IconNames.Heart)
            serial.writeLine("$write " + (address - fileNo * blockSize + DAT.length) + " bytes")
            MODE = 0
        } else {
            serial.writeLine("" + (COMMAND))
            DAT = "" + DAT + COMMAND + LF
            if (DAT.length >= pageSize) {
                EEPROM.writeStr(address, DAT.substr(0, pageSize))
                DAT = DAT.substr(pageSize, pageSize)
                address += pageSize
            }
        }
    }
}
let RAW: number[] = []
let CHAR = ""
let HEX = ""
let DAT = ""
let address = 0
let fileNo = 0
let COMMAND = ""
let MODE = 0
let PRM: string[] = []
let CMD = ""
let QUEUE: string[] = []
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
penUpDigree = 20
penDownDigree = 40
pins.servoWritePin(AnalogPin.P15, penUpDigree)
neopixel.initNeopixel(DigitalPin.P0, 4)
neopixel.showColor(neopixel.colors(neopixel.Colors.Black))
basic.forever(function () {
    if (QUEUE.length > 0) {
        COMMAND = QUEUE.removeAt(0)
        execCommand()
    } else if (inExcute == 0) {
        basic.showString(plotData[0].substr(1, 10))
    } else {
        watchfont.showNumber2(inExcute)
        basic.pause(5000)
        for (let plotCommand of plotData) {
            serial.writeLine("" + (plotCommand))
            CMD = plotCommand.split(" ")[0]
            if (plotCommand.includes(" ")) {
                PRM = plotCommand.split(" ")[1].split(",")
            } else {
                PRM = []
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
