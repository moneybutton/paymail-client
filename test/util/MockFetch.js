const fetchData = {
  responses: {}
}

const mockResponse = (url, response, status = 200) => {
  fetchData.responses[url] = {
    requests: [],
    response,
    status
  }
}

const amountOfRequestFor = (url) => {
  const data = fetchData.responses[url]
  return data ? data.requests.length : 0
}

const fetch = async (url, reqInfo = {}) => {
  const data = fetchData.responses[url]
  if (!data) {
    throw new Error(`undefined endpoint: ${url}`)
  }
  data.requests.push({
    ...reqInfo
  })

  return {
    async json () {
      return data.response
    },
    status: data.status,
    ok: data.status >= 200 && data.status < 300
  }
}

const requestsMadeTo = (url) => {
  const data = fetchData.responses[url]
  return data.requests
}

const resetFetch = () => {
  fetchData.responses = {}
}

export {
  fetch,
  mockResponse,
  amountOfRequestFor,
  requestsMadeTo,
  resetFetch
}
