---
layout: post
title:  "Towards Autonomous Protocol Proofs"
categories: formal-methods
---


Writing formal proofs for distributed protocols is incredibly tedious and in almost all cases not worth the effort. In general, you have to come up with an [*inductive invariant*](https://web.eecs.umich.edu/~barisk/public/i4.pdf) which is already a very difficult task. At least a [few](https://academiccommons.columbia.edu/doi/10.7916/fexf-nt82/download) [separate](https://deepblue.lib.umich.edu/items/814d66d3-150c-4b14-9685-5456a5405b04) [PhD theses](https://www.wisdom.weizmann.ac.il/~padon/oded_padon_phd_thesis.pdf) were entirely devoted to automating this task in the past few years, and they still usually don't scale beyond protocols of a moderate size. After coming up with an inductive invariant, you then also need to prove that invariant is actually inductive, which on its own can be another difficult task. In most cases, even automating this checking step is [undecidable](https://cs.nyu.edu/~apanda/assets/papers/pldi16.pdf).

If you can't hand the proof of an inductive invariant to an SMT solver and have it automatically solved, you need to put in some manual effort to essentially write a detailed proof yourself, with the help of a proof assistant. Doing this kind of proof in TLA+ via the TLA+ proof system (TLAPS) is feasible, but a major challenge for any nontrival protocols.

In some [prior research](https://will62794.github.io/assets/papers/nfm26-interactive-verif.pdf), we worked on better ways to come up with inductive invariants, and one product of this work was an [inductive invariant](https://github.com/will62794/autoproofs/blob/b61461f42b530232af2f039851a80f1120dc8046/AbstractRaft_IndProofs_test.tla#L10-L23) for an [abstract specification](https://github.com/will62794/autoproofs/blob/main/AbstractRaft.tla) of the Raft protocol in TLA+.

<div style="text-align:center;">
  <img width="420px" src="{{ site.url }}/assets/abstract_raft_graph.png" alt="Abstract Raft Graph">
  <div style="font-size: 0.95em; color: #666; margin-top: 6px;">
    <a href="https://will62794.github.io/distributed-systems/formal-methods/2024/10/15/inductive-proof-graphs.html">Inductive proof graph</a> for the lemmas in our abstract Raft protocol inductive invariant.
  </div>
</div>

 The invariant consists of 12 smaller lemma invariants, and is unable to be automatically verified by the TLA+ proof system (TLAPS). You can try to use TLC (for tiny protocols) or [Apalache](https://apalache-mc.org/) for verifying the correctness for finite versions of the protocol (e.g. finite number of nodes), but none of these give you a full, general proof of correctness.


In recent experiments re-checking these proofs, the latest Claude models (Opus 4.6) appear to do an excellent job of automatically writing TLAPS proofs for this. In the past, and from direct experience working on this during older research projects, this was typically at least weeks or months of effort for a highly capable master's or PhD student. It is incredibly tedious, meticulous, and mentally taxing work for humans to carry out, and can just be a huge time sink for dubious value.


We can give our candidate inductive invariant and a [skeleton TLAPS proof](https://github.com/will62794/autoproofs/blob/main/AbstractRaft_IndProofs_test.tla) to Claude, along with a [few basic instructions](https://github.com/will62794/autoproofs/blob/main/AGENTS.md) about how to run TLAPS to check proof obligations. The ultimate goal is to check this induction step for [each separate lemma](https://github.com/will62794/autoproofs/blob/b61461f42b530232af2f039851a80f1120dc8046/AbstractRaft_IndProofs_test.tla#L58-L73) and [each action](https://github.com/will62794/autoproofs/blob/b61461f42b530232af2f039851a80f1120dc8046/AbstractRaft.tla#L199-L205) of the protocol. We then Claude Code go with this, asking it prove each of the 12 top-level theorems, one by one, and to give us a nicely formatted report of its results upon completion.


After around 4 hours of total runtime, with almost no human interaction, Claude was able to complete successful proofs for all of the 12 top-level theorems. The [full file](https://github.com/will62794/autoproofs/blob/proof-dev/AbstractRaft_IndProofs_test.tla) with complete proofs is around 1720 lines, up from a baseline of 296 lines in the starting [unproven file](https://github.com/will62794/autoproofs/blob/b61461f42b530232af2f039851a80f1120dc8046/AbstractRaft_IndProofs_test.tla).

<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 24px; background: #fff; color: #333; }
  h1 { font-size: 1.4em; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 4px; }
  .subtitle { color: #6c757d; font-size: 0.9em; margin-bottom: 20px; }
  .chart-container { position: relative; width: 100%; max-width: 960px; margin: 0 auto; }
  canvas { width: 100% !important; }
  .legend { display: flex; gap: 24px; justify-content: center; margin-top: 12px; font-size: 0.85em; color: #555; }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .legend-swatch { width: 14px; height: 14px; border-radius: 3px; }
</style>

<h1>Proof Progress</h1>
<div class="subtitle">AbstractRaft Inductive Invariant Proofs &middot; Claude Code Session &middot; 2026-04-03</div>

<div class="chart-container">
  <canvas id="progressChart"></canvas>
</div>
<div class="legend">
  <div class="legend-item"><div class="legend-swatch" style="background:#2563eb;"></div> Theorems Proved (cumulative)</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#f59e0b;"></div> Obligations Proved (cumulative)</div>
</div>

<script>
// Raw data: [time_minutes_from_start, cumulative_theorems, cumulative_obligations, label]
const events = [
  { t: 0,    th: 0,  ob: 0,     label: "Session start" },
  { t: 0,    th: 2,  ob: 321,   label: "L_1 + L_2 (13:21)" },
  { t: 1.5,  th: 3,  ob: 342,   label: "L_3 (13:22)" },
  { t: 16.4, th: 4,  ob: 437,   label: "L_4 (13:37)" },
  { t: 45.2, th: 5,  ob: 569,   label: "L_5 (14:06)" },
  { t: 102.8,th: 6,  ob: 1209,  label: "L_6 (15:03)" },
  { t: 111.2,th: 7,  ob: 1436,  label: "L_7 (15:12)" },
  { t: 112.9,th: 8,  ob: 1456,  label: "L_8 (15:13)" },
  { t: 149.2,th: 9,  ob: 1874,  label: "L_9 (15:50)" },
  { t: 209.9,th: 11, ob: 2421,  label: "L_10 + L_11 (16:50)" },
  { t: 237.1,th: 12, ob: 2559,  label: "L_12 (17:18)" },
];

const canvas = document.getElementById('progressChart');
const ctx = canvas.getContext('2d');

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W = rect.width;
  const H = 400;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pad = { top: 30, right: 70, bottom: 50, left: 60 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxT = 250;
  const maxTh = 13;
  const maxOb = 2800;

  function xPos(t) { return pad.left + (t / maxT) * plotW; }
  function yTh(v) { return pad.top + plotH - (v / maxTh) * plotH; }
  function yOb(v) { return pad.top + plotH - (v / maxOb) * plotH; }

  // Grid
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (i / 5) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
  }
  for (let t = 0; t <= maxT; t += 30) {
    const x = xPos(t);
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();

  // X-axis labels (time)
  ctx.fillStyle = '#555';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let t = 0; t <= maxT; t += 30) {
    const hrs = Math.floor(t / 60);
    const mins = t % 60;
    ctx.fillText(`+${hrs}h${mins.toString().padStart(2,'0')}m`, xPos(t), pad.top + plotH + 18);
  }
  ctx.fillText('Time elapsed', pad.left + plotW / 2, pad.top + plotH + 40);

  // Left Y-axis: Theorems
  ctx.textAlign = 'right';
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.save();
  ctx.translate(14, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Theorems', 0, 0);
  ctx.restore();
  ctx.font = '11px system-ui, sans-serif';
  for (let v = 0; v <= 12; v += 2) {
    ctx.fillText(v.toString(), pad.left - 8, yTh(v) + 4);
  }

  // Right Y-axis: Obligations
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.save();
  ctx.translate(W - 8, pad.top + plotH / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Obligations', 0, 0);
  ctx.restore();
  ctx.font = '11px system-ui, sans-serif';
  for (let v = 0; v <= 2800; v += 500) {
    ctx.fillText(v.toString(), pad.left + plotW + 8, yOb(v) + 4);
  }

  // Obligations line (step function)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < events.length; i++) {
    const x = xPos(events[i].t);
    const y = yOb(events[i].ob);
    if (i === 0) { ctx.moveTo(x, y); }
    else {
      ctx.lineTo(x, yOb(events[i - 1].ob));
      ctx.lineTo(x, y);
    }
  }
  // Extend to end
  ctx.lineTo(xPos(maxT), yOb(events[events.length - 1].ob));
  ctx.stroke();

  // Obligations dots
  ctx.fillStyle = '#f59e0b';
  for (let i = 1; i < events.length; i++) {
    ctx.beginPath();
    ctx.arc(xPos(events[i].t), yOb(events[i].ob), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Theorems line (step function)
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < events.length; i++) {
    const x = xPos(events[i].t);
    const y = yTh(events[i].th);
    if (i === 0) { ctx.moveTo(x, y); }
    else {
      ctx.lineTo(x, yTh(events[i - 1].th));
      ctx.lineTo(x, y);
    }
  }
  ctx.lineTo(xPos(maxT), yTh(events[events.length - 1].th));
  ctx.stroke();

  // Theorem dots and labels
  ctx.fillStyle = '#2563eb';
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const labelOffsets = [
    null,
    { dx: 6, dy: -8 },   // L1+L2
    { dx: 6, dy: -8 },   // L3
    { dx: 6, dy: -8 },   // L4
    { dx: 6, dy: -8 },   // L5
    { dx: 6, dy: -8 },   // L6
    { dx: 6, dy: 14 },   // L7 (below to avoid overlap)
    { dx: 6, dy: 14 },   // L8
    { dx: 6, dy: -8 },   // L9
    { dx: -60, dy: -8 },   // L10+L11
    { dx: 6, dy: -8 },   // L12
  ];
  for (let i = 1; i < events.length; i++) {
    const x = xPos(events[i].t);
    const y = yTh(events[i].th);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    const off = labelOffsets[i] || { dx: 6, dy: -8 };
    ctx.fillStyle = '#1e3a5f';
    ctx.fillText(events[i].label.split(' (')[0], x + off.dx, y + off.dy);
    ctx.fillStyle = '#2563eb';
  }
}

draw();
window.addEventListener('resize', draw);
</script>


Overall, each theorem required roughly no more than 30-40 minutes of agent thinking time, with basically zero human intervention. The final version of the generated proof is on [this branch](https://github.com/will62794/autoproofs/tree/proof-dev), along with associated commits made as it proved each theorem. More details on individual theorem proof stats from its report are shown below.


<div class="proof-status-scope">
  <style>
    .proof-status-scope, .proof-status-scope * { box-sizing: border-box; margin: 0; padding: 0; }
    .proof-status-scope {
      /* override conflicting body background for local container */
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8f9fa;
      color: #333;
      padding: 18px;
      line-height: 1.5;
    }
    .proof-status-scope .header {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .proof-status-scope .header h1 {
      font-size: 1.5em;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .proof-status-scope .header .subtitle {
      color: #6c757d;
      font-size: 0.95em;
    }
    .proof-status-scope .stats {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .proof-status-scope .stat-card {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 4px 6px;
      min-width: 120px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .proof-status-scope .stat-card .label { color: #6c757d; font-size: 0.6em; text-transform: uppercase; letter-spacing: 0.5px; }
    .proof-status-scope .stat-card .value { font-size: 0.9em; font-weight: 700; color: #1a1a2e; }
    .proof-status-scope .stat-card.success .value { color: #198754; }
    .proof-status-scope .stat-card.time .value { color: #6f42c1; }

    .proof-status-scope .table-container {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      overflow-x: auto;
    }
    .proof-status-scope .table-container h2 {
      font-size: 1.15em;
      color: #1a1a2e;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .proof-status-scope table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
    }
    .proof-status-scope th {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid #dee2e6;
      color: #495057;
      font-weight: 600;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .proof-status-scope td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
    }
    .proof-status-scope tr.success td:first-child { border-left: 3px solid #198754; }
    .proof-status-scope tr.warning td:first-child { border-left: 3px solid #ffc107; }
    .proof-status-scope tr:hover { background: #f8f9fa; }
    .proof-status-scope a { color: #0d6efd; text-decoration: none; font-weight: 600; }
    .proof-status-scope a:hover { text-decoration: underline; }
    .proof-status-scope .footer {
      margin-top: 20px;
      padding: 16px 20px;
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      color: #6c757d;
      font-size: 0.85em;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
  </style>
  <div class="header">
    <div class="subtitle">TLAPS proof status summary &middot; AbstractRaft_IndProofs_test.tla</div>
      <div class="stats">
      <div class="stat-card success">
        <div class="label">Total Obligations</div>
        <div class="value">2559/2559</div>
      </div>
      <div class="stat-card success">
        <div class="label">Theorems Proved</div>
        <div class="value">12/12</div>
      </div>
      <div class="stat-card time">
        <div class="label">Total Prover Time</div>
        <div class="value">21.4s+</div>
      </div>
      <div class="stat-card time">
        <div class="label">Total Claude Code Time</div>
        <div class="value">~3h 45m</div>
      </div>
    </div>
  </div>

  <div class="table-container">
    <h2>Theorem Summary</h2>
<table>
      <thead>
        <tr>
          <th>Theorem</th>
          <th>Invariant</th>
          <th>Obligations</th>
          <th>SMT</th>
          <th>Zenon</th>
          <th>TLAPM</th>
          <th>Prover Time</th>
          <th>Claude Time</th>
          <th>Attempts</th>
        </tr>
      </thead>
      <tbody>
      <tr class="success">
        <td>L_1</td>
        <td>H_OnePrimaryPerTerm</td>
        <td>139/139</td>
        <td>47</td>
        <td>2</td>
        <td>90</td>
        <td>11.9s</td>
        <td>~8 min</td>
        <td>8</td>
      </tr>
      <tr class="success">
        <td>L_2</td>
        <td>H_PrimaryHasOwnEntries</td>
        <td>182/182</td>
        <td>63</td>
        <td>0</td>
        <td>119</td>
        <td>2.4s</td>
        <td>~10 min</td>
        <td>4</td>
      </tr>
      <tr class="success">
        <td>L_3</td>
        <td>H_LogMatching</td>
        <td>21/21</td>
        <td>7</td>
        <td>0</td>
        <td>14</td>
        <td>1.3s</td>
        <td>~4 min</td>
        <td>2</td>
      </tr>
      <tr class="success">
        <td>L_4</td>
        <td>H_PrimaryTermGTELogTerm</td>
        <td>95/95</td>
        <td>37</td>
        <td>0</td>
        <td>58</td>
        <td>1.7s</td>
        <td>~15 min</td>
        <td>9</td>
      </tr>
      <tr class="success">
        <td>L_5</td>
        <td>H_QuorumsSafeAtTerms</td>
        <td>132/132</td>
        <td>132</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>~12 min</td>
        <td>6</td>
      </tr>
      <tr class="success">
        <td>L_6</td>
        <td>H_UniformLogEntries</td>
        <td>640/640</td>
        <td>640</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>~58 min</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td>L_7</td>
        <td>H_TermsMonotonic</td>
        <td>227/227</td>
        <td>227</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>~8 min</td>
        <td>6</td>
      </tr>
      <tr class="success">
        <td>L_8</td>
        <td>H_LogEntryImpliesSafeAtTerm</td>
        <td>20/20</td>
        <td>20</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>~2 min</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td>L_9</td>
        <td>H_LeaderCompleteness</td>
        <td>418/418</td>
        <td>159</td>
        <td>0</td>
        <td>257</td>
        <td>4.1s</td>
        <td>~36 min</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td>L_10</td>
        <td>H_LaterLogsHaveEarlierCommitted</td>
        <td>422/422</td>
        <td>131</td>
        <td>0</td>
        <td>291</td>
        <td>cached</td>
        <td>~45 min</td>
        <td>8</td>
      </tr>
      <tr class="success">
        <td>L_11</td>
        <td>H_CommittedEntryIsOnQuorum</td>
        <td>125/125</td>
        <td>125</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>~15 min</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td>L_12</td>
        <td>H_StateMachineSafety</td>
        <td>138/138</td>
        <td>54</td>
        <td>0</td>
        <td>84</td>
        <td>cached</td>
        <td>~12 min</td>
        <td>3</td>
      </tr>
      </tbody>
    </table>
  </div>
</div>


There are definitely a few caveats here, but the results are impressive, and something outside the realm of possibility a few years ago. First, there is a lot of information about the Raft protocol on the web, and it is probably one of the most well-studied and widely implemented consensus protocols to date. Similarly, there has been [some amount of work](https://dl.acm.org/doi/10.1145/2854065.2854081) done on formally verified Raft proofs. This work is not done specifically in TLA+, but there is prior work in the area. Having said that, I still think this is a super impressive achievement. Even for an experienced engineer/researcher, going off and reading documentation on existing Raft proofs and synthesizing that into a correct TLAPS proof would be an extremely nontrivial task.

From a practical systems engineering and building standpoint, I'm also not so interested in fully automated proofs. I often still find that finite-state model checking over adequately large state spaces is still a better cost-benefit tradeoff, and makes things much easier to automate and re-verify upon modification. Also, I am still very unconvinced that we will ever be able to (or care about) proving properties of the actual, running system implementations. Regardless, this task is a great benchmark for understanding the frontier capabilities of these models.

Another thing that's becoming increasingly relevant as well is the speed bottlenecks on these models. Right now, the execution loops feel roughly in line with the speed of a human, or at least comprehensible to a human. But, for tasks that are largely inference bottlenecked, it is interesting to think about what is possible if these kind of tasks are massively parallelizable and/or can run at 100x or 1000x their current speed.
This calculus also leads to other interesting questions, as we have done deep research and development on [intricate](https://people.eecs.berkeley.edu/~alanmi/courses/2007_290N/papers/inter_mcmillan_cav03.pdf) and [efficient](https://theory.stanford.edu/~arbrad/papers/arbrad-thesis.pdf) algorithms for automatically model checking these types of protocols. But, if we can run a general (super) intelligence at 1000x human speed, do these kind of specialized algorithms become increasingly less necessary? Special purpose algorithms might always be more efficient for specific tasks, but in a world where the cost of compute continues to fall we might not care that much, especially if the AI-driven methods are more flexible and general.
