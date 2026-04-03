---
layout: post
title:  "Towards Autonomous Protocol Proofs"
categories: formal-methods
---


Writing formal proofs for distributed protocols is incredibly tedious and in almost all cases not worth the effort. In general, you have to come up with an [*inductive invariant*](https://web.eecs.umich.edu/~barisk/public/i4.pdf) which is already a very difficult task. At least a [few](https://academiccommons.columbia.edu/doi/10.7916/fexf-nt82/download) [separate](https://deepblue.lib.umich.edu/items/814d66d3-150c-4b14-9685-5456a5405b04) [PhD theses](https://www.wisdom.weizmann.ac.il/~padon/oded_padon_phd_thesis.pdf) were entirely devoted to automating this task in the past few years, and they still usually don't scale beyond protocols of a moderate size. After coming up with an inductive invariant, you then also need to prove that invariant is actually inductive, which on its own can be another difficult task. In most cases, even automating this checking step is [undecidable](https://cs.nyu.edu/~apanda/assets/papers/pldi16.pdf).

If you can't hand the proof of an inductive invariant to an SMT solver and have it automatically solved, you need to put in some manual effort to essentially write a detailed proof yourself, with the help of a proof assistant. Doing this kind of proof in TLA+ via the TLA+ proof system (TLAPS) is feasible, but a major challenge for any nontrival protocols.

In some [prior research](https://will62794.github.io/assets/papers/nfm26-interactive-verif.pdf), we worked on better ways to come up with inductive invariants, and one product of this work was a [candidate inductive invariant](https://github.com/will62794/autoproofs/blob/b61461f42b530232af2f039851a80f1120dc8046/AbstractRaft_IndProofs_test.tla#L10-L23) for an abstract version of the Raft protocol specified in TLA+. The invariant consists of 12 smaller lemma invariants, and is unable to be automatically verified by the TLA+ proof system (TLAPS). You can try to use TLC (for tiny protocols) or [Apalache](https://apalache-mc.org/) for verifying the correctness for finite versions of the protocol (e.g. finite number of nodes), but none of these give you a full, general proof of correctness.

<div style="text-align:center;">
  <img width="420px" src="{{ site.url }}/assets/abstract_raft_graph.png" alt="Abstract Raft Graph">
</div>

In recent experiments re-checking these proofs, the latest Claude models (Opus 4.6) appear to do an excellent job of automatically writing these proofs. In the past, and from direct experience working on this during past research projects, this was typically at least a months long effort for a highly capable master's or PhD student. It is also incredibly tedious, meticulous, and mentally taxing work for humans to carry out. In other words, it can just be a huge time sink, for questionable value.

We can take the candidate inductive invariant as a starting point, and give Claude a [few basic instructions](https://github.com/will62794/autoproofs/blob/main/AGENTS.md) about how to run TLAPS to check proof obligations. The ultimate goal is to check this induction step for each separate lemma and action of the protocol. We then let it go, asking it prove each theorem one by one. We can also ask for a nice HTML report of the proofs generated after each one is done, where we can also drill into the proof of each individual theorem.
<div class="proof-status-scope">
  <style>
    .proof-status-scope, .proof-status-scope * { box-sizing: border-box; margin: 0; padding: 0; }
    .proof-status-scope {
      /* override conflicting body background for local container */
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8f9fa;
      color: #333;
      padding: 24px;
      line-height: 1.5;
    }
    .proof-status-scope .header {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 24px;
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
      padding: 8px 10px;
      min-width: 140px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .proof-status-scope .stat-card .label { color: #6c757d; font-size: 0.6em; text-transform: uppercase; letter-spacing: 0.5px; }
    .proof-status-scope .stat-card .value { font-size: 1.0em; font-weight: 700; color: #1a1a2e; }
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
    <h1>AbstractRaft Inductive Invariant Proofs</h1>
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
        <div class="value">~37 min+</div>
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
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L1.html">L_1</a></td>
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
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L2.html">L_2</a></td>
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
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L3.html">L_3</a></td>
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
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L4.html">L_4</a></td>
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
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L5.html">L_5</a></td>
        <td>H_QuorumsSafeAtTerms</td>
        <td>132/132</td>
        <td>132</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>&mdash;</td>
        <td>6</td>
      </tr>
      <tr class="success">
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L6.html">L_6</a></td>
        <td>H_UniformLogEntries</td>
        <td>640/640</td>
        <td>640</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L7.html">L_7</a></td>
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
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L8.html">L_8</a></td>
        <td>H_LogEntryImpliesSafeAtTerm</td>
        <td>20/20</td>
        <td>20</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L9.html">L_9</a></td>
        <td>H_LeaderCompleteness</td>
        <td>418/418</td>
        <td>159</td>
        <td>0</td>
        <td>257</td>
        <td>4.1s</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L10.html">L_10</a></td>
        <td>H_LaterLogsHaveEarlierCommitted</td>
        <td>422/422</td>
        <td>131</td>
        <td>0</td>
        <td>291</td>
        <td>cached</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L11.html">L_11</a></td>
        <td>H_CommittedEntryIsOnQuorum</td>
        <td>125/125</td>
        <td>125</td>
        <td>0</td>
        <td>0</td>
        <td>cached</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
      </tr>
      <tr class="success">
        <td><a href="/assets/abstract_raft_proofs/proof_status_THEOREM_L12.html">L_12</a></td>
        <td>H_StateMachineSafety</td>
        <td>138/138</td>
        <td>54</td>
        <td>0</td>
        <td>84</td>
        <td>cached</td>
        <td>~5 min</td>
        <td>3</td>
      </tr>
      <tr class="success">
        <td>&mdash;</td>
        <td>Init =&gt; IndGlobal</td>
        <td>N/A</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
        <td>&mdash;</td>
      </tr>

      </tbody>
    </table>
  </div>
</div>

Overall, each theorem required roughly no more than 30-40 minutes of agent thinking time, and with little to no human intervention. The arguments and steps generated by Claude automatically were all impressive, and something I was not expecting it do so well at. The final version of the generated proof can be found [here](https://github.com/will62794/autoproofs/tree/proof-dev), along with associated commits made as it proved each theorem. The full file with complete proofs is around 1720 lines, up from a baseline of 296 lines in the starting [unproven file](https://github.com/will62794/autoproofs/blob/b61461f42b530232af2f039851a80f1120dc8046/AbstractRaft_IndProofs_test.tla).

There are definitely a few caveats here, but the results are still incredibly impressive, and something completely out of realm of possibility a few years ago. Importantly, there is a lot of information about the Raft protocol on the web, and it is probably one of the most well-studied and widely implemented consensus protocols to date. Similarly, there has been [some amount of work](https://dl.acm.org/doi/10.1145/2854065.2854081) done on formally verified Raft proofs. This work is not done specifically in TLA+, but there is prior work in the area. Having said that, I still think this is a super impressive achievement. Even for an experienced engineer/researcher, going off and reading documentation on existing Raft proofs and synthesizing that into a correct TLAPS proof would be an extremely nontrivial task.

From a practical systems engineering and building standpoint, I'm still not that interested in fully automated proofs. I often still find that finite-state model checking over adequately large state spaces is still a better cost-benefit tradeoff, and makes things much easier to automate and re-verify upon modification. Also, I am still very unconvinced that we will ever be able to (or care about) proving properties of the actual, running system implementations. Regardless, this task is a great benchmark for understanding the frontier capabilities of these models.

Another thing that's becoming increasingly relevant as well is the speed bottlenecks on these models. Right now, the execution loops feel roughly in line with the speed of a human, or at least comprehensible to a human. But, for tasks that are largely inference bottlenecked, it is interesting to think about what is possible if these kind of tasks are massively parallelizable and/or can run at 100x or 1000x their current speed.
This calculus also leads to other interesting questions, as we have done deep research and development on [intricate](https://people.eecs.berkeley.edu/~alanmi/courses/2007_290N/papers/inter_mcmillan_cav03.pdf) and [efficient](https://theory.stanford.edu/~arbrad/papers/arbrad-thesis.pdf) algorithms for automatically model checking these types of protocols. But, if we can run a general (super) intelligence at 1000x human speed, do these kind of specialized algorithms become increasingly less necessary? Special purpose algorithms might always be more efficient for specific tasks, but in a world where the cost of compute continues to fall we might not care that much, especially if the AI-driven methods are more flexible and general.
