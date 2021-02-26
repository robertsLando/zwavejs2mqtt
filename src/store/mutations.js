export const state = {
  auth: undefined,
  serial_ports: [],
  nodes: [],
  user: {},
  zwave: {
    port: undefined,
    commandsTimeout: 30,
    networkKey: undefined,
    logLevel: 'info',
    logToFile: false,
    serverEnabled: false,
    serverPort: 3000
  },
  mqtt: {
    name: 'zwavejs2mqtt',
    host: 'localhost',
    port: 1883,
    qos: 1,
    prefix: 'zwave',
    reconnectPeriod: 3000,
    retain: true,
    clean: true,
    auth: false,
    username: undefined,
    password: undefined
  },
  devices: [],
  gateway: {
    type: 0,
    plugins: [],
    authEnabled: false,
    payloadType: 0,
    nodeNames: true,
    hassDiscovery: true,
    discoveryPrefix: 'homeassistant',
    logEnabled: true,
    logLevel: 'info',
    logToFile: false,
    values: []
  },
  appInfo: {
    homeid: '',
    homeHex: '',
    appVersion: '',
    zwaveVersion: '',
    controllerStatus: 'Unknown'
  }
}

function getValue (v) {
  const node = getNode(v.nodeId)

  if (node && node.values) {
    return node.values.find(i => i.id === v.id)
  } else {
    return null
  }
}

// makes node search faster
const nodesMap = new Map() // nodeId -> index

function getNode (id) {
  return state.nodes[nodesMap.get(id)]
}

export const getters = {
  auth: state => state.auth,
  nodes: state => state.nodes,
  user: state => state.user,
  serial_ports: state => state.serial_ports,
  zwave: state => state.zwave,
  mqtt: state => state.mqtt,
  devices: state => state.devices,
  gateway: state => state.gateway,
  appInfo: state => state.appInfo
}

export const actions = {
  setAuth (store, data) {
    store.commit('setAuth', data)
  },
  init (store, data) {
    if (data) {
      store.commit('initSettings', data.settings)
      store.commit('initPorts', data.serial_ports)
      store.commit('initDevices', data.devices)
    }
  },
  setUser (store, data) {
    store.commit('setUser', data)
  },
  import (store, settings) {
    store.commit('initSettings', settings)
  },
  initNodes (store, nodes) {
    for (let i = 0; i < nodes.length; i++) {
      store.commit('initNode', nodes[i])
    }
  },
  setAppInfo (store, data) {
    store.commit('updateAppInfo', data)
  },
  setValue (store, data) {
    store.commit('setValue', data)
  },
  updateValue (store, data) {
    const valueId = getValue(data)
    if (valueId && valueId.toUpdate) {
      store.commit('showSnackbar', 'Value updated')
    }
    store.commit('updateValue', { data, valueId })
  },
  removeValue (store, data) {
    store.commit('removeValue', data)
  }
}

export const mutations = {
  showSnackbar () {
    // empty mutation, will be catched in App.vue from store subscribe
  },
  setAuth (store, enabled) {
    state.auth = enabled
  },
  setUser (state, data) {
    Object.assign(state.user, data)
  },
  setControllerStatus (state, data) {
    state.appInfo.controllerStatus = data
  },
  updateAppInfo (state, data) {
    state.appInfo.homeid = data.homeid
    state.appInfo.homeHex = data.name
    state.appInfo.appVersion = data.appVersion
    state.appInfo.zwaveVersion = data.zwaveVersion
    state.appInfo.serverVersion = data.serverVersion
  },
  setValue (state, valueId) {
    const toReplace = getValue(valueId)
    const node = getNode(valueId.nodeId)

    if (node && toReplace) {
      const index = node.values.indexOf(toReplace)
      if (index >= 0) {
        this._vm.$set(node.values, index, valueId)
      }
    }
  },
  updateValue (state, { data, valueId }) {
    if (valueId) {
      valueId.newValue = data.value
      valueId.value = data.value

      if (valueId.toUpdate) {
        valueId.toUpdate = false
      }
    } else {
      // means that this value has been added
      const node = getNode(data.nodeId)
      if (node) {
        data.newValue = data.value
        node.values.push(data)
      }
    }
  },
  removeValue (state, data) {
    const valueId = getValue(data)
    if (valueId) {
      const node = getNode(data.nodeId)
      const index = node.values.indexOf(valueId)

      if (index >= 0) {
        node.values.splice(index, 1)
      }
    }
  },
  initNode (state, n) {
    const values = []
    // transform object in array
    for (const k in n.values) {
      n.values[k].newValue = n.values[k].value
      values.push(n.values[k])
    }
    n.values = values
    n._name = n.name
      ? n.name + (n.loc ? ' (' + n.loc + ')' : '')
      : 'NodeID_' + n.id

    let index = nodesMap.get(n.id)

    index = index >= 0 ? index : state.nodes.length

    if (index === state.nodes.length) {
      state.nodes.push(n)
    } else {
    // vue set is used to notify changes
      this._vm.$set(state.nodes, index, n)
    }

    nodesMap.set(n.id, index)
  },
  removeNode (state, n) {
    const index = nodesMap.get(n.id)

    if (index >= 0) {
      nodesMap.delete(n.id)
      state.nodes.splice(index, 1)
    }
  },
  setNeighbors (state, { nodeId, neighbors }) {
    const node = getNode(nodeId)
    if (node) {
      this._vm.$set(node, 'neighbors', neighbors)
    }
  },
  initSettings (state, conf) {
    if (conf) {
      Object.assign(state.zwave, conf.zwave || {})
      Object.assign(state.mqtt, conf.mqtt || {})
      Object.assign(state.gateway, conf.gateway || {})
    }
  },
  initPorts (state, ports) {
    state.serial_ports = ports || []
  },
  initDevices (state, devices) {
    if (!state.gateway.values) state.gateway.values = []

    if (devices) {
      // devices is an object where key is the device ID and value contains
      // device informations
      for (const k in devices) {
        const d = devices[k]
        d.value = k

        const values = []

        // device.values is an object where key is the valueID (cmdClass-instance-index) and value contains
        // value informations
        for (const id in d.values) {
          const val = d.values[id]
          values.push(val)
        }

        d.values = values

        state.devices.push(d)
      }
    }
  }
}
