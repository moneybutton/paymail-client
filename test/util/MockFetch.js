const responses = {}

const mockResponse = (url, response, status = 200) => {
  responses[url] = {
    requests: [],
    response,
    status
  }
}

const amountOfRequestFor = (url) => {
  const data = responses[url]
  return data ? data.requests.length : 0
}

const fetch = async (url, reqInfo = {}) => {
  const data = responses[url]
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
  const data = responses[url]
  return data.requests
}

export {
  fetch,
  mockResponse,
  amountOfRequestFor,
  requestsMadeTo
}
