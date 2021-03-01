import { ZwavejsServer } from '@zwave-js/server'
import { EventEmitter } from 'events'
import { MqttClient as Client, IClientPublishOptions } from 'mqtt'
import { Socket } from 'net'
import {
  Association,
  CommandClass,
  InterviewStage,
  NodeStatus,
  ValueID,
  ValueType,
  ZWaveNode,
  ZWaveOptions,
  ZWavePlusNodeType
} from 'zwave-js'

export type Z2MValueIdState = {
  text: string
  value: number
}

export type Z2MValueId = {
  id: string
  nodeId: number
  commandClass: CommandClass
  commandClassName: string
  endpoint?: number
  property: string | number
  propertyKey?: string | number
  propertyKeyName?: string
  type: ValueType
  readable: boolean
  writeable: boolean
  description?: string
  label?: string
  default: any
  stateless: boolean
  ccSpecific: Record<string, any>
  min?: number
  max?: number
  step?: number
  unit?: string
  minLenght?: number
  maxLength?: number
  states?: Z2MValueIdState[]
  list: boolean
  lastUpdate?: number
}

export type Z2MValueIdScene = Z2MValueId & {
  timeout: number
}

export type Z2MScene = {
  sceneId: number
  label: string
  values: Z2MValueIdScene[]
}

export type Z2MDeviceClass = {
  basic: string
  generic: string
  specific: string
}

export type Z2MNodeGroups = {
  text: string
  value: number
  maxNodes: number
  isLifeline: boolean
  multiChannel: boolean
}

export type HassDevice = {
  type:
    | 'sensor'
    | 'light'
    | 'binary_sensor'
    | 'cover'
    | 'climate'
    | 'lock'
    | 'switch'
  object_id: string
  discovery_payload: Map<string, any>
  discoveryTopic: string
  values: string[]
  persistent: boolean
  ignoreDiscovery: boolean
}

export type Z2MNode = {
  id: number
  manufacturerId: number
  productId: number
  productLabel: string
  productDescription: string
  productType: number
  manufacturer: string
  firmwareVersion: string
  zwaveVersion: string
  zwavePlusVersion: number | undefined
  nodeType: ZWavePlusNodeType | undefined
  roleType: ZWavePlusRoleType | undefined
  endpointsCount: number
  isSecure: boolean
  isBeaming: boolean
  isListening: boolean
  isFrequentListening: boolean
  isRouting: boolean
  keepAwake: boolean
  deviceClass: Z2MDeviceClass
  neighbors: number[]
  loc: string
  name: string
  hassDevices: Map<string, HassDevice>
  deviceId: string
  hexId: string
  values: Map<string, Z2MValueId>
  groups: Z2MNodeGroups[]
  ready: boolean
  available: boolean
  failed: boolean
  lastActive: number
  dbLink: string
  interviewCompleted: boolean
  maxBaudRate: number
  interviewStage: InterviewStage
  status: NodeStatus
}

export enum GatewayType {
  VALUEID,
  NAMED,
  MANUAL
}

export enum PayloadType {
  JSON_TIME_VALUE,
  VALUEID,
  RAW
}

export type GatewayValue = {
  device: string
  value: Z2MValueId
  topic: string
  device_class: string
  icon: string
  postOperation: string
  enablePoll: boolean
  pollInterval: number
  parseSend: boolean
  sendFunction: string
  parseReceive: boolean
  receiveFunction: string
}

export type LogLevel = 'silly' | 'verbose' | 'debug' | 'info' | 'warn' | 'error'

export type GatewayConfig = {
  type: GatewayType
  payloadType: PayloadType
  nodeNames: boolean
  ignoreLoc: boolean
  sendEvents: boolean
  ignoreStatus: boolean
  includeNodeInfo: boolean
  publishNodeDetails: boolean
  retainedDiscovery: boolean
  entityTemplate: string
  hassDiscovery: boolean
  discoveryPrefix: string
  logEnabled: boolean
  logLevel: LogLevel
  logToFile: boolean
  values: GatewayValue[]
}

export type MqttConfig = {
  name: string
  host: string
  port: number
  reconnectPeriod: number
  prefix: string
  qos: 0 | 1 | 2
  retain: boolean
  clean: boolean
  store: boolean
  allowSelfSigned: boolean
  key: string
  cert: string
  ca: string
  auth: boolean
  username: string
  password: string
}

export type ZwaveConfig = {
  port: string
  networkKey: string
  serverEnabled: boolean
  serverPort: number
  logEnabled: boolean
  logLevel: LogLevel
  commandsTimeout: number
  plugin: string
  options: ZWaveOptions
}

export interface MqttClient extends EventEmitter {
  config: MqttConfig
  toSubscribe: string[]
  clientID: string
  client: Client
  error?: string
  closed: boolean
  connected: boolean
  broadcastPrefix: string
  eventsPrefix: string

  on(
    event: 'writeRequest',
    listener: (parts: string[], payload: any) => void
  ): this
  on(
    event: 'broadcastRequest',
    listener: (parts: string[], payload: any) => void
  ): this
  on(
    event: 'apiCall',
    listener: (topic: string, apiNema: string, payload: any) => void
  ): this
  on(event: 'connect', listener: () => void): this
  on(event: 'brokerStatus', listener: (online: boolean) => void): this
  on(event: 'hassStatus', listener: (online: boolean) => void): this

  getClientTopic(suffix: string): string
  close(): Promise<void>
  getStatus(): any
  updateClientStatus(connected: boolean): void
  publishVersion(): void
  update(config: MqttConfig): void
  subscribe(topic: string): void
  publish(
    topic: string,
    data: any,
    options: IClientPublishOptions,
    prefix: string
  ): void
  getTopic(topic: any, set: any): string
}

export type Z2MDriverInfo = {
  homeId: string
  name: string
  controllerId: string
}

export enum ZwaveClientStatus {
  CONNECTED = 'connected',
  DRIVER_READY = 'driver ready',
  SCAN_DONE = 'scan done',
  DRIVER_FAILED = 'driver failed',
  CLOSED = 'closed'
}

export enum EventSource {
  DRIVER = 'driver',
  CONTROLLER = 'controller',
  NODE = 'node'
}

export interface ZwaveClient extends EventEmitter {
  cfg: ZwaveConfig
  soclet: Socket
  closed: boolean
  driverReady: boolean
  scenes: Z2MScene[]
  nodes: Z2MNode[]
  storeNodes: Z2MNode[]
  devices: Map<string, Z2MNode>
  driverInfo: Z2MDriverInfo
  status: ZwaveClientStatus
  error: boolean | string
  scanComplete: boolean
  cntStatus: string

  server: ZwavejsServer
  statelessTimeouts: Map<string, NodeJS.Timeout>
  commandsTimeout: NodeJS.Timeout
  reconnectTimeout: NodeJS.Timeout
  healTimeout: NodeJS.Timeout

  on(event: 'nodeStatus', listener: (node: Z2MNode) => void): this
  on(
    event: 'event',
    listener: (source: EventSource, eventName: string, ...args: any) => void
  ): this
  on(event: 'scanComplete', listener: () => void): this
  on(
    event: 'notification',
    listener: (
      node: Z2MNode,
      label: string,
      parameters: string | number | Buffer
    ) => void
  ): this
  on(event: 'nodeRemoved', listener: (node: Z2MNode) => void): this
  on(
    event: 'valueChanged',
    listener: (valueId: Z2MValueId, node: Z2MNode) => void
  ): this

  scheduleHeal(): void
  getNode(nodeId: number): ZWaveNode
  getZwaveValue(idString: any): ValueID
  heal(): void
  updateDevice(
    hassDevice: HassDevice,
    nodeId: number,
    deleteDevice: boolean
  ): void
  addDevice(hassDevice: HassDevice, nodeId: number): void
  storeDevices(
    devices: Map<string, HassDevice>,
    nodeId: number,
    remove: boolean
  ): Promise<void>
  close(): Promise<void>
  getStatus(): { driverReady: boolean; status: boolean; config: GatewayConfig }
  addEmptyNodes(): void
  getGroups(nodeId: number, ignoreUpdate: boolean): Promise<void>
  getAssociations(nodeId: number, groupId: number): Promise<Association[]>
  addAssociations(
    nodeId: number,
    groupId: number,
    associations: Association[]
  ): Promise<void>
  removeAssociations(
    nodeId: number,
    groupId: number,
    associations: Association[]
  ): Promise<void>
  removeAllAssociations(nodeId: number): Promise<void>
  removeNodeFromAllAssociations(nodeId: number): Promise<void>
  refreshNeighbors(): void
  connect(): Promise<void>
  sendToSocket(evtName: string, data: any): void
  setNodeName(nodeid: number, name: string): Promise<boolean>
  setNodeLocation(nodeid: number, loc: string): Promise<boolean>
  _createScene(label: string): Promise<boolean>
  _removeScene(sceneid: number): Promise<boolean>
  _setScenes(scenes: Z2MScene[]): Promise<Z2MScene[]>
  _getScenes(): Z2MScene[]
  _sceneGetValues(sceneid: number): Z2MValueIdScene[]
  _addSceneValue(
    sceneid: number,
    valueId: Z2MValueIdScene,
    value: any,
    timeout: number
  ): Promise<void>
  _removeSceneValue(sceneid: number, valueId: Z2MValueIdScene): Promise<void>
  _activateScene(sceneId: number): boolean
  getNodes(): Z2MNode[]
  getInfo(): Map<string, any>
  refreshValues(nodeId: number): Promise<void>
  setPollInterval(valueId: Z2MValueId, interval: number): void
  pollValue(valueId: Z2MValueId): Promise<any>
  replaceFailedNode(nodeId: number, secure: any): Promise<boolean>
  startInclusion(secure: boolean): Promise<boolean>
  startExclusion(): Promise<boolean>
  stopExclusion(): Promise<boolean>
  stopInclusion(): Promise<boolean>
  healNode(nodeId: number): Promise<boolean>
  isFailedNode(nodeId: number): Promise<boolean>
  removeFailedNode(nodeId: number): Promise<void>
  refreshInfo(nodeId: number): Promise<void>
  beginFirmwareUpdate(
    nodeId: number,
    fileName: string,
    data: Buffer,
    target: number | undefined
  ): Promise<void>
  abortFirmwareUpdate(nodeId: number): Promise<void>
  beginHealingNetwork(): Promise<boolean>
  stopHealingNetwork(): Promise<boolean>
  hardReset(): Promise<void>
  callApi(
    apiName: string,
    ...args: any
  ): Promise<{ success: boolean; message: string; result: any; args: any[] }>
  writeValue(valueId: Z2MValueId, value: number | string): Promise<void>
  sendCommand(valueId: Z2MValueId, command: string, args: any[]): Promise<any>
}

export interface Z2MGateway {
  config: GatewayConfig
  mqtt: MqttClient
  zwave: ZwaveClient

  topicValues: Map<string, Z2MValueId>
  discovered: Map<string, HassDevice>
  topicLevels: number[]

  start(): void
  parsePayload(
    payload: any,
    valueId: Z2MValueId,
    valueConf: GatewayValue
  ): /* error */ any
  close(): void
  nodeTopic(node: Z2MNode): string
  valueTopic(
    node: Z2MNode,
    valueId: Z2MValueId,
    returnObject: boolean
  ): { valueConf: GatewayValue; topic: string } | string
  rediscoverNode(nodeID: number): void
  disableDiscovery(nodeID: number): void
  publishDiscovery(
    hassDevice: HassDevice,
    nodeId: number,
    deleteDevice: boolean,
    update: boolean
  ): void
  setDiscovery(
    nodeId: number,
    hassDevice: HassDevice,
    deleteDevice: boolean
  ): void
  rediscoverAll(): void
  discoverDevice(node: Z2MNode, hassDevice: HassDevice): void
  discoverClimates(node: Z2MNode): void
  discoverValue(node: Z2MNode, vId: string): void
  updateNodeTopics(nodeId: number): void
  removeNodeRetained(nodeId: number): void
}
