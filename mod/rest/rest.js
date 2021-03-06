/**
 * @author Pedro Sanders
 * @since v1
 */
import getConfig from 'core/config_util'
import { Status } from 'resources/status'

const Spark = Packages.spark.Spark
const LogManager = Packages.org.apache.logging.log4j.LogManager
const BasicAuthenticationFilter = Packages.com.qmetric.spark.authentication.BasicAuthenticationFilter
const AuthenticationDetails = Packages.com.qmetric.spark.authentication.AuthenticationDetails
const LOG = LogManager.getLogger()

export default function Rest (server, locator, registry, dataAPIs) {
    const config = getConfig()
    const rest = config.spec.services.rest

    Spark.port(rest.port)
    Spark.before(new BasicAuthenticationFilter('/*', new AuthenticationDetails(rest.credentials.username, rest.credentials.secret)))
    const get = Spark.get
    const post = Spark.post
    const put = Spark.put
    const del = Spark.delete
    // Is this a bug? For some reason I can not reach the object Spark from within the function stop
    const rStop = Spark.stop

    this.stop = () => {
        LOG.info('Stopping Restful service')
        rStop()
    }

    this.start = () => {
        LOG.info('Starting Restful service on port ' + rest.port)
    }

    get('/locate', (request, response) => locator.listAsJSON())

    get('/registry', (request, response) => registry.listAsJSON())

    get('/gateways/:filter', (request, response) => {
        const filter = request.params(":filter")
        const result = dataAPIs.GatewaysAPI.getGateways(filter)
        return JSON.stringify(result)
    })

    get('/peers/:filter', (request, response) => {
        const filter = request.params(":filter")
        const result = dataAPIs.PeersAPI.getPeers(filter)
        return JSON.stringify(result)
    })

    get('/agents/:filter', (request, response) => {
        const filter = request.params(":filter")
        const result = dataAPIs.AgentsAPI.getAgents(filter)
        return JSON.stringify(result)
    })

    get('/domains/:filter', (request, response) => {
        const filter = request.params(":filter")
        const result = dataAPIs.DomainsAPI.getDomains(filter)
        return JSON.stringify(result)
    })

    get('/dids/:filter', (request, response) => {
        const filter = request.params(":filter")
        const result = dataAPIs.DIDsAPI.getDIDs(filter)
        return JSON.stringify(result)
    })

    post('/resources', (request, response) => {
        const data = request.body()
        const json = JSON.parse(data)
        let kind
        let result = {}

        // Is array or single then what kind is?
        if (Array.isArray(json)) {
            kind = json[0].kind
        } else {
            kind = json.kind
        }

        switch(kind) {
            case 'Agent':
                result = dataAPIs.AgentsAPI.createFromJSONObj(data)
                break
            case 'Domain':
                result = dataAPIs.DomainsAPI.createFromJSONObj(data)
                break
            case 'Gateway':
                result = dataAPIs.GatewaysAPI.createFromJSONObj(data)
                break
            case 'DID':
                result = dataAPIs.DIDsAPI.createFromJSONObj(data)
                break
            case 'Peer':
                result = dataAPIs.PeersAPI.createFromJSONObj(data)
                break
            default:
                result.status = Status.BAD_REQUEST
                result.message = 'Unknown resource type.'
        }

        return JSON.stringify(result)
    })

    put('/resources', (request, response) => {
        const data = request.body()
        const json = JSON.parse(data)
        let kind
        let result = {}

        // Is array or single then what kind is?
        if (Array.isArray(json)) {
            kind = json[0].kind
        } else {
            kind = json.kind
        }

        switch(kind) {
            case 'Agent':
                result = dataAPIs.AgentsAPI.updateFromJSONObj(data)
                break
            case 'Domain':
                result = dataAPIs.DomainsAPI.updateFromJSONObj(data)
                break
            case 'Gateway':
                result = dataAPIs.GatewaysAPI.updateFromJSONObj(data)
                break
            case 'DID':
                result = dataAPIs.DIDsAPI.updateFromJSONObj(data)
                break
            case 'Peer':
                result = dataAPIs.PeersAPI.updateFromJSONObj(data)
                break
            default:
                result.status = Status.BAD_REQUEST
                result.message = 'Unknown resource type.'
        }

        return JSON.stringify(result)
    })

    // This is for internal use, so is ok to go unconventional
    del('/resources/:resource/:ref', (request, response) => {
        const resource = request.params(":resource")
        const ref = request.params(":ref")
        const filter = request.queryParams('filter')

        let result

        switch(resource) {
            case 'agent':
                result = dataAPIs.AgentsAPI.deleteAgents(ref, filter)
                break
            case 'domain':
                result = dataAPIs.DomainsAPI.deleteDomains(ref, filter)
                break
            case 'gateway':
                result = dataAPIs.GatewaysAPI.deleteGateways(ref, filter)
                break
            case 'did':
                result = dataAPIs.DIDsAPI.deleteDIDs(ref, filter)
                break
            case 'peer':
                result = dataAPIs.PeersAPI.deletePeers(ref, filter)
                break
            default:
                result.status = Status.BAD_REQUEST
                result.message = 'Unknown resource type.'
        }

        return JSON.stringify(result)
    })

    post('/stop', (request, response) => {
        server.stop()
        return 'Done.'
    })
}