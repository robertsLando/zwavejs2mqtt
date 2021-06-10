'use strict'

// eslint-disable-next-line one-var
import mqtt, { Client } from 'mqtt'
import { joinPath, sanitizeTopic } from './utils'
import NeDBStore from 'mqtt-nedb-store'
import { storeDir } from '../config/app'
import { module } from './logger'
import { version as appVersion } from '../package.json'
import { TypedEventEmitter } from './EventEmitter'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const url = require('native-url')

const logger = module('Mqtt')

export type MqttConfig = {
	name: string
	host: string
	port: number
	disabled: boolean
	reconnectPeriod: number
	prefix: string
	qos: 0 | 1 | 2
	retain: boolean
	clean: boolean
	store: boolean
	allowSelfsigned: boolean
	key: string
	cert: string
	ca: string
	auth: boolean
	username: string
	password: string
	_ca: string
	_key: string
	_cert: string
}

export interface MqttClientEventCallbacks {
	writeRequest: (parts: string[], payload: any) => void
	broadcastRequest: (parts: string[], payload: any) => void
	multicastRequest: (payload: any) => void
	apiCall: (topic: string, apiName: string, payload: any) => void
	connect: () => void
	brokerStatus: (online: boolean) => void
	hassStatus: (online: boolean) => void
}

export type MqttClientEvents = Extract<keyof MqttClientEventCallbacks, string>

class MqttClient extends TypedEventEmitter<MqttClientEventCallbacks> {
	private config: MqttConfig
	private toSubscribe: string[]
	public _clientID: string
	private client: Client
	private error?: string
	private closed: boolean

	static CLIENTS_PREFIX = '_CLIENTS'

	public static get EVENTS_PREFIX() {
		return '_EVENTS'
	}

	private static NAME_PREFIX = 'ZWAVE_GATEWAY-'

	private static ACTIONS: string[] = ['broadcast', 'api', 'multicast']

	private static HASS_WILL = 'homeassistant/status'

	private static STATUS_TOPIC = 'status'
	private static VERSION_TOPIC = 'version'

	public get clientID() {
		return this._clientID
	}

	/**
	 * The constructor
	 */
	constructor(config: MqttConfig) {
		super()
		this._init(config)
	}

	get connected() {
		return this.client && this.client.connected
	}

	/**
	 * Returns the topic used to send client and devices status updateStates
	 * if name is null the client is the gateway itself
	 */
	getClientTopic(suffix: string) {
		return `${this.config.prefix}/${MqttClient.CLIENTS_PREFIX}/${this._clientID}/${suffix}`
	}

	/**
	 * Method used to close clients connection, use this before destroy
	 */
	close(): Promise<void> {
		return new Promise((resolve) => {
			if (this.closed) {
				resolve()
				return
			}
			this.closed = true

			if (this.client) {
				this.client.end(true, {}, () => {
					this.removeAllListeners()
					logger.info('Client closed')
					resolve()
				})
			} else {
				this.removeAllListeners()
				resolve()
			}
		})
	}

	/**
	 * Method used to get status
	 */
	getStatus() {
		const status: Record<string, any> = {}

		status.status = this.client && this.client.connected
		status.error = this.error || 'Offline'
		status.config = this.config

		return status
	}

	/**
	 * Method used to update client connection status
	 */
	updateClientStatus(connected: boolean) {
		if (this.client) {
			this.client.publish(
				this.getClientTopic(MqttClient.STATUS_TOPIC),
				JSON.stringify({ value: connected, time: Date.now() }),
				{ retain: this.config.retain, qos: this.config.qos }
			)
		}
	}

	/**
	 * Method used to publish app version to mqtt
	 */
	publishVersion() {
		if (this.client) {
			this.client.publish(
				this.getClientTopic(MqttClient.VERSION_TOPIC),
				JSON.stringify({ value: appVersion, time: Date.now() }),
				{ retain: this.config.retain, qos: this.config.qos }
			)
		}
	}

	/**
	 * Method used to update client
	 */
	async update(config: MqttConfig) {
		await this.close()

		logger.info('Restarting Mqtt Client after update...')

		this._init(config)
	}

	/**
	 * Method used to subscribe tags for write requests
	 */
	subscribe(topic: string) {
		if (this.client && this.client.connected) {
			topic = this.config.prefix + '/' + topic + '/set'
			logger.info(`Subscribing to ${topic}`)
			this.client.subscribe(topic)
		} else {
			this.toSubscribe.push(topic)
		}
	}

	/**
	 * Method used to publish an update
	 */
	publish(
		topic: string,
		data: any,
		options?: mqtt.IClientPublishOptions,
		prefix?: string
	) {
		if (this.client) {
			const settingOptions = {
				qos: this.config.qos,
				retain: this.config.retain,
			}

			// by default use settingsOptions
			options = Object.assign(settingOptions, options)

			topic = (prefix || this.config.prefix) + '/' + topic

			logger.log(
				'debug',
				'Publishing to %s: %o with options %o',
				topic,
				data,
				options
			)

			this.client.publish(
				topic,
				JSON.stringify(data),
				options,
				function (err) {
					if (err) {
						logger.error(
							`Error while publishing a value ${err.message}`
						)
					}
				}
			)
		} // end if client
	}

	/**
	 * Method used to get the topic with prefix/suffix
	 */
	getTopic(topic: string, set = false) {
		return this.config.prefix + '/' + topic + (set ? '/set' : '')
	}

	/**
	 * Initialize client
	 */
	private _init(config: MqttConfig) {
		this.config = config
		this.toSubscribe = []

		if (!config || config.disabled) {
			logger.info('MQTT is disabled')
			return
		}

		this._clientID = sanitizeTopic(MqttClient.NAME_PREFIX + config.name)

		const parsed = url.parse(config.host || '')
		let protocol = 'mqtt'

		if (parsed.protocol) protocol = parsed.protocol.replace(/:$/, '')

		const options: mqtt.IClientOptions = {
			clientId: this._clientID,
			reconnectPeriod: config.reconnectPeriod,
			clean: config.clean,
			rejectUnauthorized: !config.allowSelfsigned,
			will: {
				topic: this.getClientTopic(MqttClient.STATUS_TOPIC),
				payload: JSON.stringify({ value: false }),
				qos: this.config.qos,
				retain: this.config.retain,
			},
		}

		if (['mqtts', 'wss', 'wxs', 'alis', 'tls'].indexOf(protocol) >= 0) {
			if (!config.allowSelfsigned) options.ca = config._ca

			if (config._key) {
				options.key = config._key
			}
			if (config._cert) {
				options.cert = config._cert
			}
		}

		if (config.store) {
			const COMPACT = { autocompactionInterval: 30000 }
			const manager = NeDBStore(joinPath(storeDir, 'mqtt'), {
				incoming: COMPACT,
				outgoing: COMPACT,
			})
			options.incomingStore = manager.incoming
			options.outgoingStore = manager.outgoing
		}

		if (config.auth) {
			options.username = config.username
			options.password = config.password
		}

		try {
			const serverUrl = `${protocol}://${
				parsed.hostname || config.host
			}:${config.port}`
			logger.info(`Connecting to ${serverUrl}`)

			const client = mqtt.connect(serverUrl, options)

			this.client = client

			client.on('connect', this._onConnect.bind(this))
			client.on('message', this._onMessageReceived.bind(this))
			client.on('reconnect', this._onReconnect.bind(this))
			client.on('close', this._onClose.bind(this))
			client.on('error', this._onError.bind(this))
			client.on('offline', this._onOffline.bind(this))
		} catch (e) {
			logger.error(`Error while connecting MQTT ${e.message}`)
			this.error = e.message
		}
	}

	/**
	 * Function called when MQTT client connects
	 */
	private _onConnect() {
		logger.info('MQTT client connected')
		this.emit('connect')

		if (this.toSubscribe) {
			// don't use toSubscribe here to prevent infinite loops when subscribe fails
			const topics = [...this.toSubscribe]
			for (const t of topics) {
				this.subscribe(t)
			}
		}

		this.client.subscribe(MqttClient.HASS_WILL)

		// subscribe to actions
		// eslint-disable-next-line no-redeclare
		for (let i = 0; i < MqttClient.ACTIONS.length; i++) {
			this.client.subscribe(
				[
					this.config.prefix,
					MqttClient.CLIENTS_PREFIX,
					this._clientID,
					MqttClient.ACTIONS[i],
					'#',
				].join('/')
			)
		}

		this.emit('brokerStatus', true)

		this.publishVersion()

		// Update client status
		this.updateClientStatus(true)

		this.toSubscribe = []
	}

	/**
	 * Function called when MQTT client reconnects
	 */
	private _onReconnect() {
		logger.info('MQTT client reconnecting')
	}

	/**
	 * Function called when MQTT client reconnects
	 */
	private _onError(error: Error) {
		logger.info(error.message)
		this.error = error.message
	}

	/**
	 * Function called when MQTT client go offline
	 */
	private _onOffline() {
		logger.info('MQTT client offline')
		this.emit('brokerStatus', false)
	}

	/**
	 * Function called when MQTT client is closed
	 */
	private _onClose() {
		logger.info('MQTT client closed')
	}

	/**
	 * Function called when an MQTT message is received
	 */
	private _onMessageReceived(topic: string, payload: Buffer) {
		if (this.closed) return

		let parsed: string | number | Record<string, any> | undefined =
			payload?.toString()

		logger.log('info', `Message received on ${topic}, %o`, payload)

		if (topic === MqttClient.HASS_WILL) {
			if (typeof parsed === 'string') {
				this.emit('hassStatus', parsed.toLowerCase() === 'online')
			} else {
				logger.error('Invalid payload sent to Hass Will topic')
			}
			return
		}

		// remove prefix
		topic = topic.substring(this.config.prefix.length + 1)

		const parts = topic.split('/')

		// It's not a write request
		if (parts.pop() !== 'set') return

		if (isNaN(parseInt(parsed))) {
			try {
				parsed = JSON.parse(parsed)
				// eslint-disable-next-line no-empty
			} catch (e: unknown) {} // it' ok fallback to string
		} else {
			parsed = Number(parsed)
		}

		// It's an action
		if (parts[0] === MqttClient.CLIENTS_PREFIX) {
			if (parts.length < 3) return

			const action = MqttClient.ACTIONS.indexOf(parts[2])

			switch (action) {
				case 0: // broadcast
					this.emit('broadcastRequest', parts.slice(3), parsed)
					// publish back to give a feedback the action has been received
					// same topic without /set suffix
					this.publish(parts.join('/'), parsed)
					break
				case 1: // api
					this.emit('apiCall', parts.join('/'), parts[3], parsed)
					break
				case 2: // multicast
					this.emit('multicastRequest', parsed)
					// publish back to give a feedback the action has been received
					// same topic without /set suffix
					this.publish(parts.join('/'), parsed)
					break
				default:
					logger.warn(`Unknown action received ${action} ${topic}`)
			}
		} else {
			// It's a write request on zwave network
			this.emit('writeRequest', parts, parsed)
		}
	} // end onMessageReceived
}

export default MqttClient
