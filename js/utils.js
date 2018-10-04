(function (global) { // global == window
  const includes = (array, substr) => array.some(element => element.indexOf(substr) !== -1)

  const getAuthXml = (url) => {
    return fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText)
      }

      return response.text()
    })
  }

  const loadManifest = (manifestUrl) => {
    const protobuf = global.protobuf

    return new Promise((resolve, reject) => {
      protobuf.load(manifestUrl, (error, schema) => {
        if (error) {
          reject(error)
          return
        }

        resolve(schema)
      })
    })
  }

  global.demoUtils = {
    loadManifest,
    includes,
    getAuthXml,
  }
})(window)