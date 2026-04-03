---
layout: post
title:  "Towards Autonomous Protocol Proofs"
categories: formal-methods
---


Writing formal proofs for distributed protocols is incredibly tedious and in almost all cases not worth the effort. In general, you have to come up with an *inductive invariant* which is already an very difficult task. After this, you need to prove that invariant is actually inductive, which on its own can be another difficult task. For most of these tasks, even automating the checking step is undecidable e.g. checking the validity of an arbitrary first order logic formula.

If you can't hand the proof of an inductive invariant to an SMT solver, you need to put in some manual effort to essentially write a detailed proof yourself, with the help of a proof assistant. Doing this kind of proof in TLA+ via the TLA+ proof system (TLAPS) is feasible, but a major challenge for any nontrival protocols.

In some [prior research](https://will62794.github.io/assets/papers/nfm26-interactive-verif.pdf), we worked on better ways to come up with inductive invariants, and had a candidate inductive invariant lying around for an abstract versino of the Raft protocol. The invariant is about 12 lemmas, and is unable to be automatically verified by TLAPS. In general, you can try to use TLC (for tiny protocols) or [Apalache](https://apalache-mc.org/) for verifying the correctness for finite versions of the protocol (e.g. finite number of nodes), but none of these give you a full, general proof of correctness.

Recent experiments in re-checking these proofs, the latest Claude models , Opus 4.6, appear to do a miraculous job of automatically writing these proofs. In the past, and from direct experience working on this during past research projects, this was typically at least a months long effort for a highly capable master's or PhD student. It is also a 

We can take the candidate inductive invariant as a starting point, and give Claude Code a few instructions about how to run TLAPS to check proof obligations. The ultimate goal is to check this induction step for each separate lemma and action of the protocol.

We then just let Claude go:

```
I would like you to prove THEOREM L_1 using TLAPS.
```
and follow up for each theorem. Our agent prompt also specified we want a nice HTML report of the proofs generated after each one is done, which we can see nicely formatted here. 


<!-- INSERT SUMMARY TABLE. -->

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8f9fa; color: #333; padding: 2rem;
    max-width: 1000px; margin: 0 auto; line-height: 1.5;
  }
  h1 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.25rem; }
  .subtitle { font-size: 0.85rem; color: #868e96; margin-bottom: 1.5rem; }
  .totals {
    display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
  }
  .totals .card {
    background: #fff; border: 1px solid #dee2e6; border-radius: 8px;
    padding: 0.75rem 1.25rem; text-align: center; min-width: 120px; flex: 1;
  }
  .totals .card .val { font-size: 1.6rem; font-weight: 700; line-height: 1.2; }
  .totals .card .lbl { font-size: 0.7rem; color: #868e96; text-transform: uppercase; letter-spacing: 0.5px; }
  .green { color: #2b8a3e; }
  .blue { color: #1864ab; }
  .gray { color: #868e96; }

  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6; }
  thead { background: #f1f3f5; }
  th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #495057; font-weight: 600; padding: 0.6rem 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; }
  td { padding: 0.55rem 0.75rem; border-bottom: 1px solid #f1f3f5; font-size: 0.85rem; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8f9fa; }

  .badge {
    display: inline-block; padding: 0.15rem 0.5rem; border-radius: 10px;
    font-size: 0.72rem; font-weight: 600;
  }
  .badge-proved { background: #d3f9d8; color: #2b8a3e; }
  .badge-pending { background: #fff3bf; color: #e67700; }

  .mono { font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; font-size: 0.8rem; }
  .prover-breakdown { font-size: 0.78rem; color: #495057; }
  .prover-breakdown span { white-space: nowrap; }
  .smt { color: #1864ab; }
  .zenon { color: #5f3dc4; }
  .tlapm { color: #868e96; }
  .time { font-variant-numeric: tabular-nums; }

  a { color: #1864ab; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .footer { margin-top: 1rem; font-size: 0.75rem; color: #adb5bd; }
</style>
</head>
<body>

<h1>AbstractRaft Inductive Invariant &mdash; Proof Summary</h1>
<div class="subtitle">AbstractRaft_IndProofs_test.tla &middot; 13 theorems (L_0 &ndash; L_12)</div>

<div class="totals">
  <div class="card">
    <div class="val green">4</div>
    <div class="lbl">Theorems Proved</div>
  </div>
  <div class="card">
    <div class="val gray">9</div>
    <div class="lbl">Remaining</div>
  </div>
  <div class="card">
    <div class="val blue">577</div>
    <div class="lbl">Total Obligations</div>
  </div>
  <div class="card">
    <div class="val time">19.2s</div>
    <div class="lbl">Total Prover Time</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Theorem</th>
      <th>Property</th>
      <th>Status</th>
      <th>Obligations</th>
      <th>Provers (SMT / Zenon / TLAPM)</th>
      <th>Prover Time</th>
      <th>Report</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="mono">L_0</td>
      <td>TypeOK</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_1</td>
      <td>H_OnePrimaryPerTerm</td>
      <td><span class="badge badge-proved">proved</span></td>
      <td class="time">139 / 139</td>
      <td class="prover-breakdown"><span class="smt">47 SMT</span> &middot; <span class="zenon">2 Zenon</span> &middot; <span class="tlapm">90 TLAPM</span></td>
      <td class="time">11.9s</td>
      <td><a href="proof_status_THEOREM_L1.html">view</a></td>
    </tr>
    <tr>
      <td class="mono">L_2</td>
      <td>H_PrimaryHasOwnEntries</td>
      <td><span class="badge badge-proved">proved</span></td>
      <td class="time">182 / 182</td>
      <td class="prover-breakdown"><span class="smt">63 SMT</span> &middot; <span class="tlapm">119 TLAPM</span></td>
      <td class="time">2.4s</td>
      <td><a href="proof_status_THEOREM_L2.html">view</a></td>
    </tr>
    <tr>
      <td class="mono">L_3</td>
      <td>H_LogMatching</td>
      <td><span class="badge badge-proved">proved</span></td>
      <td class="time">21 / 21</td>
      <td class="prover-breakdown"><span class="smt">7 SMT</span> &middot; <span class="tlapm">14 TLAPM</span></td>
      <td class="time">1.3s</td>
      <td><a href="proof_status_THEOREM_L3.html">view</a></td>
    </tr>
    <tr>
      <td class="mono">L_4</td>
      <td>H_PrimaryTermGTELogTerm</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_5</td>
      <td>H_QuorumsSafeAtTerms</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_6</td>
      <td>H_UniformLogEntries</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_7</td>
      <td>H_TermsMonotonic</td>
      <td><span class="badge badge-proved">proved</span></td>
      <td class="time">235 / 235</td>
      <td class="prover-breakdown"><span class="smt">75 SMT</span> &middot; <span class="tlapm">160 TLAPM</span></td>
      <td class="time">3.6s</td>
      <td><a href="../proof_status_THEOREM_L7.html">view</a></td>
    </tr>
    <tr>
      <td class="mono">L_8</td>
      <td>H_LogEntryImpliesSafeAtTerm</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_9</td>
      <td>H_LeaderCompleteness</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_10</td>
      <td>H_LaterLogsHaveEarlierCommitted</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_11</td>
      <td>H_CommittedEntryIsOnQuorum</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
    <tr>
      <td class="mono">L_12</td>
      <td>H_StateMachineSafety</td>
      <td><span class="badge badge-pending">pending</span></td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
      <td>&mdash;</td>
    </tr>
  </tbody>
</table>

<div class="footer">Generated 2026-04-03 &middot; TLAPS 1.5.0</div>

There are definitely a few caveats here, but the results are still incredibly impressive, and something completely out of realm of possibility a few years ago. Importantly, there is a lot of information about the Raft protocol on the web, and it is probably one of the most well-studied and widely implemented consensus protocols to date. Similarly, there has been some amount of work done on formally verified Raft proofs. Not in TLA+, necessarily, but there is prior work in this area. Having said that, I still think this is a wild achievement. Even for an experience engineer/researcher, going off and reading documentation on existing Raft proofs and synthesizing that into a correct TLAPS proof is an extremely nontrivial task.

Also, even with this kind of advancements, I'm actually still not as interested in fully automated proofs. I don't think it hurts, but I am still often quite convinced even by finite-state model checking over adequately large state spaces, and they are much easier to automate and re-verify. Also, I am still very unconvinced that we will ever be able to (or care about) proving properties of the systems we actually run. Regardless, this task is a great benchmark for understanding the frontier capabilities of these models.



Another thing that's becoming increasingly relevant to consider is speed bottlenecks on these models. Right now, the execution loops feel roughly in line with the speed of a human, or at least comprehensible to a human. But, for tasks that are largely inference bottlenecked, it is interesting to think about what is possible if these kind of tasks are massively parallelizable and/or can run at 100x or 1000x their current speed.

This calculus also makes an intersting comparison, as we have built PhDs worth of intricate, efficient algorihms for autoamtiaclyl model checking these types of protocols. But, if we can run a general  (super) intelligence at 1000x human speed, do these kind of specialized algorithms become increasingly obsolete? Sure, they might be more efficient, but in a world where the cost of compute continues to fall we might not care that much, especially if the AI-driven methods are more flexible and general. And instead we can treat the superintelligent as basically a "universal algorithm" for solving a whole variety of these hard tasks at superhuman speed?
