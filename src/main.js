var byteMask = 0xFFFFFFFF

var aMask = 0xFF000000
var bMask = 0x00FF0000
var cMask = 0x0000FF00
var dMask = 0x000000FF

function numToIP(num) {
    var ipAddr = {}

    ipAddr[0] = (num & aMask) >>> 24
    ipAddr[1] = (num & bMask) >>> 16
    ipAddr[2] = (num & cMask) >>> 8
    ipAddr[3] = num & dMask

    return ipAddr
}

function ipToString(ipAddr) {
    var s

    s = parseInt(ipAddr[0]) + '.'
    s = s + parseInt(ipAddr[1]) + '.'
    s = s + parseInt(ipAddr[2]) + '.'
    s = s + parseInt(ipAddr[3])

    return s
}

function ipToNum(ipAddr) {
    var num
    
    num = ipAddr[0] << 24
    num = num | (ipAddr[1] << 16)
    num = num | (ipAddr[2] << 8)
    num = num | ipAddr[3]

    return num
}

function stringToIP(s) {
    var ipAddr = {}
    var delimiters = []

    for(c in s) {
        if(s.charAt(c) == '.') {
            delimiters.push(parseInt(c))
        }
    }
    
    ipAddr[0] = s.substring(0, delimiters[0])
    ipAddr[1] = s.substring(delimiters[0] + 1, delimiters[1])
    ipAddr[2] = s.substring(delimiters[1] + 1, delimiters[2])
    ipAddr[3] = s.substring(delimiters[2] + 1)

    ipAddr[0] = parseInt(ipAddr[0])
    ipAddr[1] = parseInt(ipAddr[1])
    ipAddr[2] = parseInt(ipAddr[2])
    ipAddr[3] = parseInt(ipAddr[3])

    return ipAddr
}

function getNetWorkAddress(payload) {
    var hostNum = ipToNum(stringToIP(payload['ipAddr']))
    var subnetNum = ipToNum(stringToIP(payload['subnet']))
    var netAddr = {}
    var networkNum

    networkNum = hostNum & subnetNum

    netAddr = ipToString(numToIP(networkNum))

    return netAddr
}

function getNetworkClassRadio() {
    var radioForm = document.getElementById('radioForm')
    var checkedRadio = null
    
    for(i = 0; i < radioForm.length; i++) {
        if(radioForm.elements[i].checked) {
            checkedRadio = radioForm.elements[i]
            break
        }
    }

    return checkedRadio
}

function getSubnetMasksList() {
    var networkClass = getNetworkClassRadio()
    var subnetMasks = []
    var num = byteMask
    var end = 0x0

    if(networkClass.value == 'a') {
        end = (byteMask << 25) & byteMask
    }
    else if(networkClass.value == 'b') {
        end = (byteMask << 17) & byteMask
    }

    else if(networkClass.value == 'c') {
        end = (byteMask << 9) & byteMask
    }

    while(num != end)
    {
        subnetMasks.push(num)
        num = (num << 1) & byteMask
    }

    return subnetMasks
}

function refreshSubnet() {
    var subnetSelect = document.getElementById('subnetSelect')

    while(subnetSelect.hasChildNodes()) {
        subnetSelect.removeChild(subnetSelect.lastChild)
    }

    var subnetMasks = getSubnetMasksList()

    for(i = 0; i < subnetMasks.length; i++)
    {
        var option = document.createElement('option')
        
        var subnetMask = ipToString(numToIP(subnetMasks[i]))

        option.value = subnetMask
        option.innerHTML = subnetMask + ' /' + (32 - i)

        subnetSelect.appendChild(option)
    }
}

function render(payload) {
    var infoTable = document.getElementById('infoTable')
    var info = {}

    while(infoTable.hasChildNodes()) {
        infoTable.removeChild(infoTable.lastChild)
    }

    info['IP Address:'] = payload['ipAddr']
    info['Network Address:'] = getNetWorkAddress(payload)

    for(element in info) {
        var row = document.createElement('tr')
        var lable = document.createElement('td')
        var data = document.createElement('td')

        lable.innerHTML = element
        data.innerHTML = info[element]
        
        row.appendChild(lable)
        row.appendChild(data)

        infoTable.appendChild(row)
    }
}

function getForm() {
    var ipAddr = document.getElementById('ipAddress')
    var subnetSelect = document.getElementById('subnetSelect')
    var payload = {}

    payload['ipAddr'] = ipAddr.value
    payload['subnet'] = subnetSelect.options[subnetSelect.selectedIndex].value

    render(payload)
}

function init() {
    refreshSubnet()
}
