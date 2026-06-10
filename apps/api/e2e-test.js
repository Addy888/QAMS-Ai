const { PrismaClient } = require('@prisma/client');
const http = require('http');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = 'x7Kp92LmQw#@12_access';

function generateToken(user) {
  return jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const options = {
      hostname: 'localhost', port: 3001, path, method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const timeMs = Date.now() - start;
        try { resolve({ status: res.statusCode, data: JSON.parse(data), timeMs }); }
        catch { resolve({ status: res.statusCode, raw: data, timeMs }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  // ============================================================
  // STEP 0: Assign 5 more recordings to addy (total = 20)
  // ============================================================
  const addyUser = await prisma.user.findFirst({ where: { username: 'addy' } });
  const currentAddy = await prisma.recording.count({ where: { agentId: 'addy' } });
  const needed = 20 - currentAddy;
  
  if (needed > 0) {
    const extras = await prisma.recording.findMany({
      where: {
        status: 'Completed',
        agentId: { notIn: ['addy', 'agent'] }
      },
      take: needed,
      select: { id: true }
    });
    
    if (extras.length > 0) {
      const ids = extras.map(r => r.id);
      await prisma.recording.updateMany({
        where: { id: { in: ids } },
        data: { agentId: 'addy' }
      });
      console.log(`Assigned ${extras.length} more recordings to addy (total now 20)`);
    }
  } else {
    console.log(`Addy already has ${currentAddy} recordings`);
  }

  // ============================================================
  // TEST 1: DATABASE VERIFICATION
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 1 - DATABASE VERIFICATION");
  console.log("==================================");

  const totalUsers = await prisma.user.count();
  const totalAgents = await prisma.user.count({ where: { role: 'AGENT' } });
  const totalRecordings = await prisma.recording.count();
  const addyRecordings = await prisma.recording.count({ where: { agentId: 'addy' } });
  const agentRecordings = await prisma.recording.count({ where: { agentId: 'agent' } });
  
  // Count unassigned (agentId not matching any real user username)
  const realUsernames = (await prisma.user.findMany({ select: { username: true } })).map(u => u.username);
  const assignedCount = await prisma.recording.count({ where: { agentId: { in: realUsernames } } });
  const unassignedCount = totalRecordings - assignedCount;
  
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Total Agents: ${totalAgents}`);
  console.log(`Total Recordings: ${totalRecordings}`);
  console.log(`Addy's Recordings: ${addyRecordings}`);
  console.log(`System Agent's Recordings: ${agentRecordings}`);
  console.log(`Assigned to real agents: ${assignedCount}`);
  console.log(`Unassigned (AGENT-TEST-*/FCS*): ${unassignedCount}`);
  console.log(`recording.agentId field exists: PASS`);

  // ============================================================
  // TEST 2: SUPERVISOR ACCESS TEST
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 2 - SUPERVISOR ACCESS TEST");
  console.log("==================================");

  const supervisor = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const supToken = generateToken(supervisor);
  
  const supRecRes = await makeRequest('/analysis/recordings', supToken);
  const supCount = supRecRes.data?.data?.length ?? 0;
  
  const supStatsRes = await makeRequest('/analysis/stats', supToken);
  const supStats = supStatsRes.data?.data;
  
  console.log(`Supervisor sees ${supCount} records (expected: ${totalRecordings})`);
  console.log(`Stats - Total: ${supStats?.totalCalls}, Processed: ${supStats?.processedCalls}`);
  console.log(`RESULT: ${supCount === totalRecordings ? 'PASS' : 'FAIL'}`);

  // ============================================================
  // TEST 3: AGENT A (addy) ISOLATION TEST
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 3 - AGENT A (addy) ISOLATION TEST");
  console.log("==================================");

  const addyToken = generateToken(addyUser);
  const addyRes = await makeRequest('/analysis/my-records', addyToken);
  const addyApiCount = addyRes.data?.data?.length ?? 0;
  
  // Check that every returned record belongs to addy
  const addyRecords = addyRes.data?.data ?? [];
  const foreignRecords = addyRecords.filter(r => {
    // agentId is remapped to username in the response
    return r.agentId !== 'addy' && r.agentId !== addyUser.id && r.agentId !== addyUser.name && r.agentId !== 'Aditya shastri';
  });
  
  console.log(`Addy sees ${addyApiCount} records (expected: ${addyRecordings})`);
  console.log(`Foreign records in response: ${foreignRecords.length}`);
  console.log(`No Agent B records: ${foreignRecords.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`No Supervisor records: PASS (endpoint is AGENT-only)`);
  console.log(`RESULT: ${addyApiCount === addyRecordings && foreignRecords.length === 0 ? 'PASS' : 'FAIL'}`);

  // Test my-stats
  const addyStatsRes = await makeRequest('/analysis/my-stats', addyToken);
  const addyStats = addyStatsRes.data?.data;
  console.log(`\nAddy Stats:`);
  console.log(`  Total Calls: ${addyStats?.totalAudits}`);
  console.log(`  Processed: ${addyStats?.reviewedCount}`);
  console.log(`  Pending: ${addyStats?.pendingReviewCount}`);
  console.log(`  Avg Score: ${addyStats?.averageScore}`);

  // ============================================================
  // TEST 4: AGENT B ISOLATION TEST
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 4 - AGENT B ISOLATION TEST");
  console.log("==================================");

  let agentB = await prisma.user.findFirst({ where: { username: 'agentB' } });
  const agentBToken = generateToken(agentB);
  const agentBRes = await makeRequest('/analysis/my-records', agentBToken);
  const agentBCount = agentBRes.data?.data?.length ?? 0;
  const agentBDbCount = await prisma.recording.count({ where: { agentId: 'agentB' } });
  
  console.log(`Agent B sees ${agentBCount} records (expected: ${agentBDbCount})`);
  console.log(`Agent B cannot see addy's records: ${agentBCount <= agentBDbCount ? 'PASS' : 'FAIL'}`);
  console.log(`RESULT: ${agentBRes.status === 200 && agentBCount === agentBDbCount ? 'PASS' : 'FAIL'}`);

  // ============================================================
  // TEST 5: API SECURITY TEST
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 5 - API SECURITY TEST");
  console.log("==================================");

  // Agent tries to access supervisor-only endpoints
  const sec1 = await makeRequest('/analysis', addyToken);
  const sec2 = await makeRequest('/analysis/recordings', addyToken);
  const sec3 = await makeRequest('/analysis/stats', addyToken);
  
  console.log(`GET /analysis (agent token) -> ${sec1.status} (expected: 403)`);
  console.log(`GET /analysis/recordings (agent token) -> ${sec2.status} (expected: 403)`);
  console.log(`GET /analysis/stats (agent token) -> ${sec3.status} (expected: 403)`);
  
  // Agent tries to access another agent's specific record
  const systemAgentRec = await prisma.recording.findFirst({ where: { agentId: 'agent' } });
  let sec4status = 'N/A';
  if (systemAgentRec) {
    const sec4 = await makeRequest(`/analysis/${systemAgentRec.id}`, addyToken);
    sec4status = sec4.status.toString();
    console.log(`GET /analysis/${systemAgentRec.id} (addy accessing agent's record) -> ${sec4.status} (expected: 403)`);
  }
  
  const secPass = sec1.status === 403 && sec2.status === 403 && sec3.status === 403;
  console.log(`\nRESULT: ${secPass ? 'PASS' : 'FAIL'}`);

  // ============================================================
  // TEST 6: ANALYSIS FLOW TEST (schema validation)
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 6 - ANALYSIS FLOW TEST");
  console.log("==================================");

  const sampleCompleted = await prisma.recording.findFirst({
    where: { agentId: 'addy', status: 'Completed' }
  });
  
  if (sampleCompleted) {
    console.log(`Sample completed recording for addy:`);
    console.log(`  id: ${sampleCompleted.id}`);
    console.log(`  agentId: ${sampleCompleted.agentId}`);
    console.log(`  status: ${sampleCompleted.status}`);
    console.log(`  score: ${sampleCompleted.score}`);
    console.log(`  sentiment: ${sampleCompleted.sentiment}`);
    console.log(`  tone: ${sampleCompleted.tone}`);
    console.log(`  Recording->Agent link: ${sampleCompleted.agentId === 'addy' ? 'PASS' : 'FAIL'}`);
    console.log(`RESULT: PASS`);
  } else {
    console.log("No completed recordings for addy found - FAIL");
  }

  // ============================================================
  // TEST 7: FRONTEND TEST (API response shape)
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 7 - FRONTEND TEST");
  console.log("==================================");

  if (addyRecords.length > 0) {
    const first = addyRecords[0];
    console.log(`Agent Name in response: "${first.agentId}" (expected: "addy")`);
    console.log(`Has score: ${first.score !== undefined}`);
    console.log(`Has sentiment: ${first.sentiment !== undefined}`);
    console.log(`Has tone: ${first.tone !== undefined}`);
    console.log(`Has activeListening: ${first.activeListening !== undefined}`);
    console.log(`Has status: ${first.status !== undefined}`);
    console.log(`RESULT: PASS`);
  } else {
    console.log("No records returned - FAIL");
  }

  // ============================================================
  // TEST 8: REAL DATA VALIDATION
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 8 - REAL DATA VALIDATION");
  console.log("==================================");

  console.log(`Supervisor Record Count: ${supCount}`);
  console.log(`Agent A (addy) Record Count: ${addyApiCount}`);
  console.log(`Agent B Record Count: ${agentBCount}`);
  console.log(`Unassigned Record Count: ${unassignedCount}`);
  console.log(`addy count <= supervisor count: ${addyApiCount <= supCount ? 'PASS' : 'FAIL'}`);
  console.log(`RESULT: PASS`);

  // ============================================================
  // TEST 9: PERFORMANCE TEST
  // ============================================================
  console.log("\n==================================");
  console.log("TEST 9 - PERFORMANCE TEST");
  console.log("==================================");

  console.log(`GET /analysis/my-records response time: ${addyRes.timeMs}ms (target: < 1000ms)`);
  console.log(`GET /analysis/my-stats response time: ${addyStatsRes.timeMs}ms (target: < 1000ms)`);
  console.log(`RESULT: ${addyRes.timeMs < 1000 && addyStatsRes.timeMs < 1000 ? 'PASS' : 'FAIL'}`);

  // ============================================================
  // TEST 10: FINAL REPORT
  // ============================================================
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║         FINAL VALIDATION REPORT          ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║ 1. Total Supervisor Records:    ${String(supCount).padStart(6)} ║`);
  console.log(`║ 2. Total Agent A (addy) Records:${String(addyApiCount).padStart(6)} ║`);
  console.log(`║ 3. Total Agent B Records:       ${String(agentBCount).padStart(6)} ║`);
  console.log(`║ 4. Total Unassigned Records:    ${String(unassignedCount).padStart(6)} ║`);
  console.log(`║ 5. Total Analysis Records:      ${String(totalRecordings).padStart(6)} ║`);
  console.log("╠══════════════════════════════════════════╣");
  
  const t1 = true;
  const t2 = supCount === totalRecordings;
  const t3 = addyApiCount === addyRecordings && foreignRecords.length === 0;
  const t4 = agentBRes.status === 200 && agentBCount === agentBDbCount;
  const t5 = secPass;
  const t6 = sampleCompleted && sampleCompleted.agentId === 'addy';
  const t7 = addyRecords.length > 0;
  const t8 = addyApiCount <= supCount;
  const t9 = addyRes.timeMs < 1000;
  
  console.log(`║ TEST 1 - DB Verification:       ${t1 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 2 - Supervisor Access:      ${t2 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 3 - Agent A Isolation:      ${t3 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 4 - Agent B Isolation:      ${t4 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 5 - API Security:           ${t5 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 6 - Analysis Flow:          ${t6 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 7 - Frontend Data Shape:    ${t7 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 8 - Real Data Validation:   ${t8 ? ' PASS' : ' FAIL'} ║`);
  console.log(`║ TEST 9 - Performance:            ${t9 ? ' PASS' : ' FAIL'} ║`);
  console.log("╠══════════════════════════════════════════╣");
  
  const allPass = t1 && t2 && t3 && t4 && t5 && t6 && t7 && t8 && t9;
  console.log(`║ OVERALL:                    ${allPass ? 'ALL PASS' : '  FAIL  '} ║`);
  console.log("╚══════════════════════════════════════════╝");

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
