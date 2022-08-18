let assert = require('assert');
let _ = require("lodash");

const METRIC_ID = "my.custom.metric"
const METRIC_NAME = "My Custom Metric"
const NAMESPACE = "mynamespace"
const MONITOR_ID = "123"
const MONITOR_NAME = "My Custom Synthetic Script"

const NEW_RELIC_DATA_CENTER_LOCATION = "EU"
const NEW_RELIC_LICENSE_KEY = $secure.NEW_RELIC_LICENSE_KEY

const INGEST_METRIC_ENDPOINT = NEW_RELIC_DATA_CENTER_LOCATION === "EU" ? "metric-api.eu.newrelic.com" : "metric-api.newrelic.com" 

const makeHttpRequest = async function(options) {
  let success

  await $http.post(options, function(err, response, body) {
    console.log(`Status code: ${response.statusCode}`)
    if (err) {
      console.log(`Http request failed: ${err}`)
      success = false
    } else {
      console.log("Http request succeeded.")
      success = true
    }
  });

  return success
}

/*
* sendDataToNewRelic()
* Sends a metrics payload to New Relic
*
* @param {object} data - the payload to send
*/
const sendDataToNewRelic = async function(data) {
  let options = {
    url: `https://${INGEST_METRIC_ENDPOINT}/metric/v1`,
    headers :{
      "Content-Type": "application/json",
      "Api-Key": NEW_RELIC_LICENSE_KEY
    },
    body: JSON.stringify(data)
  }

  console.log(`Sending ${data[0].metrics.length} records to NR metrics API...`)

  return await makeHttpRequest(options)
}

function createMetricPayload(value) {
  let attributes = {}
  attributes[`${NAMESPACE}.id`] = METRIC_ID
  attributes[`${NAMESPACE}.name`] = METRIC_NAME

  let metricPayload = {
    name: `${NAMESPACE}.value`,
    type: "gauge",
    value: value,
    timestamp: Math.round(Date.now()/1000),
    attributes: attributes
  }

  return metricPayload
}

// --- SCRIPT START --- //

try {
  let metricsPayload = []
  metricsPayload.push(createMetricPayload(1.0))
  
  let commonMetricBlock = {"attributes": {}}
  commonMetricBlock.attributes[`${NAMESPACE}.monitorName`] = MONITOR_NAME
  commonMetricBlock.attributes[`${NAMESPACE}.monitorId`] = MONITOR_ID

  let payload = [{ 
    "common" : commonMetricBlock,
    "metrics": metricsPayload
  }]

  // Comment the line below to see yout payload.
  // console.log(JSON.stringify(payload))
  
  let success = await sendDataToNewRelic(payload)
  if (success === true) {
    console.log("Metrics are sent to New Relic successfully.")
    assert.ok("Succeeded.")
  } else {
    console.log("Metrics are failed to be sent to New Relic.")
    assert.fail("Failed.")
  }
} catch (e) {
  console.log("Unexpected errors occured: ", e)
  assert.fail("Failed.")
}
