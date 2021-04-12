# Zwave To MQTT

![GitHub package.json version](https://img.shields.io/github/package-json/v/zwave-js/zwavejs2mqtt)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![MadeWithVueJs.com shield](https://madewithvuejs.com/storage/repo-shields/1897-shield.svg)](https://madewithvuejs.com/p/zwavejs2mqtt/shield-link)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.png)](https://opensource.org/licenses/mit-license.php)
[![ci](https://github.com/zwave-js/zwavejs2mqtt/workflows/ci/badge.svg?branch=master)](https://github.com/zwave-js/zwavejs2mqtt/actions?query=workflow%3Aci+branch%3Amaster)
[![Docker Release](https://github.com/zwave-js/zwavejs2mqtt/actions/workflows/docker-release.yml/badge.svg)](https://github.com/zwave-js/zwavejs2mqtt/actions/workflows/docker-release.yml)
[![GitHub All Releases](https://img.shields.io/github/downloads/zwave-js/zwavejs2mqtt/total)](https://github.com/zwave-js/zwavejs2mqtt/releases)
[![Coverage Status](https://coveralls.io/repos/github/zwave-js/zwavejs2mqtt/badge.svg?branch=master)](https://coveralls.io/github/zwave-js/zwavejs2mqtt?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/zwave-js/zwavejs2mqtt/badge.svg?targetFile=package.json)](https://snyk.io/test/github/zwave-js/zwavejs2mqtt?targetFile=package.json)
[![Dependencies Status](https://david-dm.org/zwave-js/zwavejs2mqtt/status.svg)](https://david-dm.org/zwave-js/zwavejs2mqtt)
[![devDependencies Status](https://david-dm.org/zwave-js/zwavejs2mqtt/dev-status.svg)](https://david-dm.org/zwave-js/zwavejs2mqtt?type=dev)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/zwave-js/zwavejs2mqtt.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/zwave-js/zwavejs2mqtt/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/zwave-js/zwavejs2mqtt.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/zwave-js/zwavejs2mqtt/context:javascript)

[![Join channel](https://img.shields.io/badge/SLACK-zwave2mqtt.slack.com-red.svg?style=popout&logo=slack&logoColor=red)](https://join.slack.com/t/zwave2mqtt/shared_invite/enQtNjc4NjgyNjc3NDI2LTc3OGQzYmJlZDIzZTJhMzUzZWQ3M2Q3NThmMjY5MGY1MTc4NjFiOWZhZWE5YjNmNGE0OWRjZjJiMjliZGQyYmU "Join channel")

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/MVg9wc2HE "Buy Me A Coffee")

[![dockeri.co](https://dockeri.co/image/zwavejs/zwavejs2mqtt)](https://hub.docker.com/r/zwavejs/zwavejs2mqtt)

<div>
  <img src="_images/zwavejs_logo.svg" width="300" alt="zwavejs">
  <span style="font-size: 25px">TO</span>
  <img src="_images/MQTT-Logo.png" alt="mqtt">
</div>

Fully configurable Zwave to MQTT **Gateway** and **Control Panel**.

- **Backend**: [NodeJS](https://nodejs.org/en/), [Express](https://expressjs.com/), [socket.io](https://github.com/socketio/socket.io), [Mqttjs](https://github.com/mqttjs/MQTT.js), [zwavejs](https://github.com/zwave-js/node-zwave-js), [Webpack](https://webpack.js.org/)
- **Frontend**: [Vue](https://vuejs.org/), [socket.io](https://github.com/socketio/socket.io), [Vuetify](https://github.com/vuetifyjs/vuetify)

## Main features

- **Zwave to Mqtt Gateway**: Configure how nodes and nodes values are mapped between the two protocols
- **Secured**: Supports *HTTPS* and users *authentication*
- **Control Panel UI**: Directly control all your nodes and their values from the UI, some of control panel features:
  - *Nodes management*: check all nodes discovered in the z-wave network and manage their values
  - *Firmware updates*: update devices firmware, just select the controller action `Begin Firmware Update` and upload the firmware file
  - *Groups associations*: add/edit nodes associations
  - *Full zwave-js APIs support*
- Custom **scenes management**: create scenes and trigger them by using MQTT apis (also supports timeouts)
- Log **debug in UI**: See debug logs directly from the UI
- **Store directory management**: all files are stored in `store` folder, you can download/edit files inside this folder directly from the UI
- **Network graph**: see how nodes are communicating with the controller, useful for diagnostics purposes
- **Home Assistant integration**: you can use official Zwavejs integration by enabling zwavejs server or use integrated MQTT discovery integration
