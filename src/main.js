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

    var optionsLength = subnetSelect.options.length

    while(subnetSelect.options.length != 0) {
        subnetSelect.options[0] = null
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

function init() {
    refreshSubnet()
}
