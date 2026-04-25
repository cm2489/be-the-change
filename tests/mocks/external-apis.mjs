// Mock HTTP server for external APIs used by the rep-sync flow.
// Started by playwright.config.ts as a webServer; the Next.js dev server is
// pointed at it via CONGRESS_API_BASE_URL and GOOGLE_CIVIC_API_BASE_URL.
//
// Single fixed address: 350 Fifth Avenue, New York, NY 10118 (Empire State
// Building, NY-12). Returns 1 House rep + 2 Senators with all party/phone
// fields populated. Anything else falls through to a 500.
//
// Plain Node ESM — no transpile step, no tsx dep.

import http from 'node:http'

const PORT = Number(process.env.MOCK_API_PORT ?? 4444)

const FIXTURE = {
  geocode: {
    normalizedInput: {
      line1: '350 5th Ave',
      city: 'New York',
      state: 'NY',
      zip: '10118',
    },
    divisions: {
      'ocd-division/country:us/state:ny/cd:12': { name: "New York's 12th congressional district" },
      'ocd-division/country:us/state:ny': { name: 'New York' },
    },
  },

  houseList: {
    members: [
      {
        bioguideId: 'TEST_HSE',
        name: 'Repman, Charlie',
        partyName: 'Republican',
        state: 'New York',
        district: 12,
        url: 'https://example.test/member/TEST_HSE',
        terms: { item: [{ chamber: 'House of Representatives', startYear: 2025, endYear: 2027 }] },
      },
    ],
  },

  // The state-only members endpoint returns ALL current members for the
  // state; getSenatorsByState filters Senate-chamber-only client-side. We
  // return only the two senators here — sufficient for the filter to pass.
  senateList: {
    members: [
      {
        bioguideId: 'TEST_SEN1',
        name: 'Tester, Alicia',
        partyName: 'Democratic',
        state: 'New York',
        url: 'https://example.test/member/TEST_SEN1',
        terms: { item: [{ chamber: 'Senate', startYear: 2009 }] },
      },
      {
        bioguideId: 'TEST_SEN2',
        name: 'Junior, Brent',
        partyName: 'Democratic',
        state: 'New York',
        url: 'https://example.test/member/TEST_SEN2',
        terms: { item: [{ chamber: 'Senate', startYear: 2017 }] },
      },
    ],
  },

  details: {
    TEST_HSE: {
      member: {
        bioguideId: 'TEST_HSE',
        directOrderName: 'Charlie Repman',
        firstName: 'Charlie',
        lastName: 'Repman',
        state: 'New York',
        partyHistory: [{ partyAbbreviation: 'R', partyName: 'Republican', startYear: 2025 }],
        addressInformation: { phoneNumber: '202-225-0003', officeAddress: '123 Cannon HOB' },
        officialWebsiteUrl: 'https://repman.house.gov',
        terms: [
          {
            chamber: 'House of Representatives',
            congress: 119,
            startYear: 2025,
            endYear: 2027,
            stateCode: 'NY',
            memberType: 'Representative',
          },
        ],
      },
    },
    TEST_SEN1: {
      member: {
        bioguideId: 'TEST_SEN1',
        directOrderName: 'Alicia Tester',
        firstName: 'Alicia',
        lastName: 'Tester',
        state: 'New York',
        partyHistory: [{ partyAbbreviation: 'D', partyName: 'Democratic', startYear: 2009 }],
        addressInformation: { phoneNumber: '202-224-0001', officeAddress: '123 Hart SOB' },
        officialWebsiteUrl: 'https://tester.senate.gov',
        terms: [
          {
            chamber: 'Senate',
            congress: 119,
            startYear: 2009,
            stateCode: 'NY',
            memberType: 'Senator',
          },
        ],
      },
    },
    TEST_SEN2: {
      member: {
        bioguideId: 'TEST_SEN2',
        directOrderName: 'Brent Junior',
        firstName: 'Brent',
        lastName: 'Junior',
        state: 'New York',
        partyHistory: [{ partyAbbreviation: 'D', partyName: 'Democratic', startYear: 2017 }],
        addressInformation: { phoneNumber: '202-224-0002', officeAddress: '456 Hart SOB' },
        officialWebsiteUrl: 'https://junior.senate.gov',
        terms: [
          {
            chamber: 'Senate',
            congress: 119,
            startYear: 2017,
            stateCode: 'NY',
            memberType: 'Senator',
          },
        ],
      },
    },
  },
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const path = url.pathname

  // Google Civic — Divisions
  if (path === '/civicinfo/v2/divisionsByAddress') {
    return send(res, 200, FIXTURE.geocode)
  }

  // Congress.gov — house member by district: /v3/member/congress/{N}/{state}/{district}
  const houseMatch = path.match(/^\/v3\/member\/congress\/\d+\/[A-Z]{2}\/\d+$/)
  if (houseMatch) {
    return send(res, 200, FIXTURE.houseList)
  }

  // Congress.gov — state members: /v3/member/congress/{N}/{state}
  const stateMatch = path.match(/^\/v3\/member\/congress\/\d+\/[A-Z]{2}$/)
  if (stateMatch) {
    return send(res, 200, FIXTURE.senateList)
  }

  // Congress.gov — member detail: /v3/member/{bioguideId}
  const detailMatch = path.match(/^\/v3\/member\/([A-Z0-9_]+)$/)
  if (detailMatch) {
    const bioguideId = detailMatch[1]
    const detail = FIXTURE.details[bioguideId]
    if (detail) return send(res, 200, detail)
    return send(res, 404, { error: 'not found' })
  }

  // Health probe — Playwright's webServer.url uses this to wait for ready.
  if (path === '/health') {
    return send(res, 200, { ok: true })
  }

  return send(res, 500, { error: `unhandled mock path: ${path}` })
})

server.listen(PORT, () => {
  console.log(`[mock] external API mock listening on http://localhost:${PORT}`)
})
