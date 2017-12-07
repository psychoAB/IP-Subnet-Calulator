var byteMask = 0xFFFFFFFF

var aMask = 0xFF000000
var bMask = 0x00FF0000
var cMask = 0x0000FF00
var dMask = 0x000000FF

var info = {
            'IP Address:' : null,
            'Network Address:' : null,
            'Usable Host IP Range:' : null,
            'Broadcast Address:' : null,
            'Total Number of Hosts:' : null,
            'Number of Usable Hosts:' : null,
            'Subnet Mask:' : null,
            'Wildcard Mask:' : null,
            'Binary Subnet Mask:' : null,
            'IP Class:' : null,
            'CIDR Notation:' : null,
            'IP Type:' : null,
            'SPACER' : '',
            'Short:' : null,
            'Binary ID:' : null,
            'Integer ID:' : null,
            'Hex ID:' : null,
            'in-addr.arpa:': null,
            'IPv4 Mapped Address:' : null,
            '6to4 Prefix:' : null}

var privateIP = [
                    ['10.0.0.0', '10.255.255.255'],
                    ['172.16.0.0', '172.31.255.255'],
                    ['192.168.0.0', '192.168.255.255']]

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

function numToString(num) {
    return ipToString(numToIP(num))
}

function stringToNum(s) {
    return ipToNum(stringToIP(s))
}

function leadingZero(s) {
    return (s.length % 2 != 0) ? ('0' + s) : s
}

function getHighNum(payload) {
    return (payload['integerID'] >>> 16) & (cMask | dMask)

}

function getLowNum(payload) {
    return payload['integerID'] & (cMask | dMask)

}

function getArpa(payload) {
    var ipAddr = numToIP(payload['hostNum'])
    var temp

    temp = ipAddr[0]
    ipAddr[0] = ipAddr[3]
    ipAddr[3] = temp

    temp = ipAddr[1]
    ipAddr[1] = ipAddr[2]
    ipAddr[2] = temp

    return ipToString(ipAddr) + '.in-addr.arpa'
}

function getIPList(payload) {
    var ipList = []
    var networkList = []
    var rangeList = []
    var i = 0

    networkList.push(payload['hostNumMasked'])

    while(networkList.length < payload['broadcastIPList'].length) {
        networkList.push(payload['broadcastIPList'][i])
    }

    for(i = 0; i < payload['broadcastIPList'].length; i++) {
        payload['broadcastIPList'][i] = payload['broadcastIPList'][i] - 1

        rangeList[i] = numToString(networkList[i] + 1) + ' - ' + numToString(payload['broadcastIPList'][i] - 1)
    }

    for(i = 0; i < payload['broadcastIPList'].length; i++) {
        var temp = {}
        
        temp['network'] = networkList[i]
        temp['range'] = rangeList[i]
        temp['broadcast'] = payload['broadcastIPList'][i]

        ipList.push(temp)
    }

    return ipList
} 
function count(payload) {
    var subnet = []
    var runner = payload['hostNumMasked']

    while(runner <= payload['ipEnd']) {
        runner = runner + (0x80000000 >>> (payload['subnetBitNum'] - 1))
        subnet.push(runner)
    }

    return subnet
}

function getIPEnd(payload) {
    if(payload['ipClass'] == 'A') {
        return payload['hostNumMasked'] | 0x00FFFFFF
    }
    else if(payload['ipClass'] == 'B') {
        return payload['hostNumMasked'] | 0x0000FFFF
    }
    else if(payload['ipClass'] == 'C') {
        return payload['hostNumMasked'] | 0x000000FF
    }

    return byteMask
}

function getIPType(payload) {
    for(ipRange in privateIP) {
        var start = stringToNum(privateIP[ipRange][0])
        var end = stringToNum(privateIP[ipRange][1])

        if(payload['hostNum'] >= start && payload['hostNum'] <= end) {
            return 'Private'
        }
    }
    
    return 'Public'
}

function getIPClass(payload) {
    if(payload['subnetBitNum'] >= 24) {
        return 'C'
    }
    else if(payload['subnetBitNum'] >= 16) {
        return 'B'
    }
    else if(payload['subnetBitNum'] >= 8) {
        return 'A'
    }
    return 'N/A'
}

function getBinarySubnetMask(payload) {
    var num = {}
    var s
    
    num[0] = ((payload['subnetNum'] >>> 24) & dMask).toString(2)
    num[1] = ((payload['subnetNum'] >>> 16) & dMask).toString(2)
    num[2] = ((payload['subnetNum'] >>> 8) & dMask).toString(2)
    num[3] = (payload['subnetNum'] & dMask).toString(2)

    s = num[0] + '.' + num[1] + '.' + num[2] + '.' + num[3]
    
    return s
}

function getNetworkNum(payload) {
    var hostNum = payload['hostNum']
    var subnetNum = payload['subnetNum']
    var networkNum

    networkNum = hostNum & subnetNum

    return networkNum
}

function getUsableHostIPRange(payload) {
    if(payload['usableHostStart'] > payload['usableHostEnd']) {
        return 'N/A'
    }
    return numToString(payload['usableHostStart']) + " - " + numToString(payload['usableHostEnd'])
}

function getBroadcastNum(payload) {
    var networkNum = payload['networkNum']
    var broadcastNum = networkNum | ((~payload['subnetNum']) & byteMask)

    return broadcastNum
}

function getMockupIP(payload) {
    s = numToString(payload['hostNum'])
    var delimiters = []

    for(c in s) {
        if(s.charAt(c) == '.') {
            delimiters.push(parseInt(c))
        }
    }

    if(payload['ipClass'] == 'A') {
        return s.substring(0, delimiters[0]) + '.*.*.*'
    }
    else if(payload['ipClass'] == 'B') {
        return s.substring(0, delimiters[1]) + '.*.*'
    }
    else if(payload['ipClass'] == 'C') {
        return s.substring(0, delimiters[2]) + '.*'
    }

    return '*.*.*.*'
}

function getSubnetMaskOfNetworkClass(payload) {
    if(payload['ipClass'] == 'A') {
        return 0xFF000000
    }
    else if(payload['ipClass'] == 'B') {
        return 0xFFFF0000
    }
    else if(payload['ipClass'] == 'C') {
        return 0xFFFFFF00
    }
    return 0x0
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
    var ipTable = document.getElementById('ipTable')

    while(infoTable.hasChildNodes()) {
        infoTable.removeChild(infoTable.lastChild)
    }

    payload['networkNum'] = getNetworkNum(payload)
    payload['broadcastNum'] = getBroadcastNum(payload)
    payload['usableHostStart'] = payload['networkNum'] + 1
    payload['usableHostEnd'] = payload['broadcastNum'] - 1
    payload['usableHostRange'] = getUsableHostIPRange(payload)
    payload['wildcard'] = (~payload['subnetNum']) & byteMask
    payload['totalHostNum'] = payload['wildcard'] + 1
    payload['usableHostNum'] = (payload['totalHostNum'] - 2 < 0) ? (0) : payload['totalHostNum'] - 2
    payload['binarySubnetNum'] = getBinarySubnetMask(payload)
    payload['ipClass'] = getIPClass(payload)
    payload['cidr'] = '/' + payload['subnetBitNum']
    payload['ipType'] = getIPType(payload)
    payload['short'] = numToString(payload['hostNum']) + ' ' + payload['cidr']
    payload['integerID'] = payload['hostNum'] >>> 0
    payload['binaryID'] = (payload['integerID']).toString(2)
    payload['hexID'] = '0x' + payload['integerID'].toString(16)
    payload['arpa'] = getArpa(payload)
    payload['hNum'] = getHighNum(payload)
    payload['lNum'] = getLowNum(payload)
    payload['mappedAddr'] = '::ffff:' + leadingZero(payload['hNum'].toString(16)) + '.' + leadingZero(payload['lNum'].toString(16))
    payload['sixToFour'] = '2002:' + leadingZero(payload['hNum'].toString(16)) + '.' + leadingZero(payload['lNum'].toString(16)) + '::/48'
    
    info['IP Address:'] = numToString(payload['hostNum'])
    info['Network Address:'] = numToString(payload['networkNum'])
    info['Broadcast Address:'] = numToString(payload['broadcastNum'])
    info['Usable Host IP Range:'] = payload['usableHostRange']
    info['Total Number of Hosts:'] = payload['totalHostNum'].toLocaleString('en')
    info['Number of Usable Hosts:'] = payload['usableHostNum'].toLocaleString('en')
    info['Subnet Mask:'] = numToString(payload['subnetNum'])
    info['Wildcard Mask:'] = numToString(payload['wildcard'])
    info['Binary Subnet Mask:'] = payload['binarySubnetNum']
    info['IP Class:'] = payload['ipClass']
    info['CIDR Notation:'] = payload['cidr']
    info['IP Type:'] = payload['ipType']
    info['Short:'] = payload['short']
    info['Binary ID:'] = payload['binaryID']
    info['Integer ID:'] = payload['integerID']
    info['Hex ID:'] = payload['hexID']
    info['in-addr.arpa:'] = payload['arpa']
    info['IPv4 Mapped Address:'] = payload['mappedAddr']
    info['6to4 Prefix:'] = payload['sixToFour']

    for(element in info) {
        var row = document.createElement('tr')
        var lable = document.createElement('td')
        var data = document.createElement('td')

        lable.innerHTML = (element == 'SPACER') ? '<br>' : element
        data.innerHTML = info[element]
        
        row.appendChild(lable)
        row.appendChild(data)

        infoTable.appendChild(row)
    }
    
    var ipTablePara = document.getElementById('ipTablePara')
    var ipTableTitle = document.createElement('h3')
    var ipTable = document.getElementById('ipTable')
    var ipList
    var mockupIP

    while(ipTablePara.hasChildNodes()) {
        ipTablePara.removeChild(ipTablePara.lastChild)
    }

    while(ipTable.hasChildNodes()) {
        ipTable.removeChild(ipTable.lastChild)
    }

    payload['ipClassSubnetMask'] = getSubnetMaskOfNetworkClass(payload)
    payload['hostNumMasked'] = payload['hostNum'] & payload['ipClassSubnetMask']
    payload['ipEnd'] =  getIPEnd(payload)
    payload['broadcastIPList'] = count(payload)
    
    ipList = getIPList(payload)
    mockupIP = getMockupIP(payload)

    ipTableTitle.innerHTML = 'All Possible ' + payload['cidr'] + ' Networks for ' + mockupIP

    ipTablePara.appendChild(ipTableTitle)

    var row = document.createElement('tr')
    var networkAddr = document.createElement('td')
    var usableHostRange = document.createElement('td')
    var broadcastAddr = document.createElement('td')

    networkAddr.innerHTML = 'Network Address'
    usableHostRange.innerHTML = 'Usable Host Range'
    broadcastAddr.innerHTML = 'Broadcast Address'

    row.appendChild(networkAddr)
    row.appendChild(usableHostRange)
    row.appendChild(broadcastAddr)

    ipTable.appendChild(row)

    for(element in ipList) {
        var row = document.createElement('tr')
        var networkAddr = document.createElement('td')
        var usableHostRange = document.createElement('td')
        var broadcastAddr = document.createElement('td')

        networkAddr.innerHTML = numToString(ipList[element]['network'])
        usableHostRange.innerHTML = ipList[element]['range']
        broadcastAddr.innerHTML = numToString(ipList[element]['broadcast'])

        row.appendChild(networkAddr)
        row.appendChild(usableHostRange)
        row.appendChild(broadcastAddr)

        ipTable.appendChild(row)
    }
}

function getForm() {
    var hostAddr  = document.getElementById('ipAddress')
    var subnetSelect = document.getElementById('subnetSelect')
    var payload = {}

    payload['hostNum'] = stringToNum(hostAddr.value)
    payload['subnetNum'] = stringToNum(subnetSelect.options[subnetSelect.selectedIndex].value)
    payload['subnetBitNum'] = subnetSelect.options[subnetSelect.selectedIndex].innerHTML

    i = payload['subnetBitNum'].indexOf('/')
    payload['subnetBitNum'] = payload['subnetBitNum'].substring(i + 1)

    render(payload)
}

function init() {
    refreshSubnet()
}
