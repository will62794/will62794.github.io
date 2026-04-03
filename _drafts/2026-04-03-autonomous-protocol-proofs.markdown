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


<!-- INSERT SUMMARY TABLE. -->
<div class="raft-proof-summary">

<style>
  .raft-proof-summary * { box-sizing: border-box; margin: 0; padding: 0; }
  .raft-proof-summary {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8f9fa; color: #333; padding: 2rem;
    max-width: 1000px; margin: 0 auto; line-height: 1.5;
  }
  .raft-proof-summary h1 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.25rem; }
  .raft-proof-summary .subtitle { font-size: 0.85rem; color: #868e96; margin-bottom: 1.5rem; }
  .raft-proof-summary .totals {
    display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
  }
  .raft-proof-summary .totals .card {
    background: #fff; border: 1px solid #dee2e6; border-radius: 8px;
    padding: 0.75rem 1.25rem; text-align: center; min-width: 120px; flex: 1;
  }
  .raft-proof-summary .totals .card .val { font-size: 1.6rem; font-weight: 700; line-height: 1.2; }
  .raft-proof-summary .totals .card .lbl { font-size: 0.7rem; color: #868e96; text-transform: uppercase; letter-spacing: 0.5px; }
  .raft-proof-summary .green { color: #2b8a3e; }
  .raft-proof-summary .blue { color: #1864ab; }
  .raft-proof-summary .gray { color: #868e96; }

  .raft-proof-summary table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6; }
  .raft-proof-summary thead { background: #f1f3f5; }
  .raft-proof-summary th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #495057; font-weight: 600; padding: 0.6rem 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; }
  .raft-proof-summary td { padding: 0.55rem 0.75rem; border-bottom: 1px solid #f1f3f5; font-size: 0.85rem; }
  .raft-proof-summary tr:last-child td { border-bottom: none; }
  .raft-proof-summary tr:hover td { background: #f8f9fa; }

  .raft-proof-summary .badge {
    display: inline-block; padding: 0.15rem 0.5rem; border-radius: 10px;
    font-size: 0.72rem; font-weight: 600;
  }
  .raft-proof-summary .badge-proved { background: #d3f9d8; color: #2b8a3e; }
  .raft-proof-summary .badge-pending { background: #fff3bf; color: #e67700; }

  .raft-proof-summary .mono { font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; font-size: 0.8rem; }
  .raft-proof-summary .prover-breakdown { font-size: 0.78rem; color: #495057; }
  .raft-proof-summary .prover-breakdown span { white-space: nowrap; }
  .raft-proof-summary .smt { color: #1864ab; }
  .raft-proof-summary .zenon { color: #5f3dc4; }
  .raft-proof-summary .tlapm { color: #868e96; }
  .raft-proof-summary .time { font-variant-numeric: tabular-nums; }

  .raft-proof-summary a { color: #1864ab; text-decoration: none; }
  .raft-proof-summary a:hover { text-decoration: underline; }

  .raft-proof-summary .footer { margin-top: 1rem; font-size: 0.75rem; color: #adb5bd; }
</style>

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
</div>

Overall, each theorem required roughly no more than 30-40 minutes of agent thinking time, and with little to no human intervention. The arguments and steps generated by Claude automatically were all very impressive miraculous to me, and something I was not expecting it do so well at. The final version of the generated proof can be found [here](https://github.com/will62794/autoproofs/tree/proof-dev), along with associated commits made my Claude as it proved each theorem.

There are definitely a few caveats here, but the results are still incredibly impressive, and something completely out of realm of possibility a few years ago. Importantly, there is a lot of information about the Raft protocol on the web, and it is probably one of the most well-studied and widely implemented consensus protocols to date. Similarly, there has been some amount of work done on formally verified Raft proofs. Not in TLA+, necessarily, but there is prior work in this area. Having said that, I still think this is a wild achievement. Even for an experience engineer/researcher, going off and reading documentation on existing Raft proofs and synthesizing that into a correct TLAPS proof is an extremely nontrivial task.

Even with this kind of advancement in capability, I'm still not too interested in fully automated proofs, from a practical systems engineering and building standpoint. I often still find that finite-state model checking over adequately large state spaces is still a better cost-benefit tradeoff, and makes things much easier to automate and re-verify upon modification. Also, I am still very unconvinced that we will ever be able to (or care about) proving properties of the actual, running system implementations. Regardless, this task is a great benchmark for understanding the frontier capabilities of these models.


Another thing that's becoming increasingly relevant as well is the speed bottlenecks on these models. Right now, the execution loops feel roughly in line with the speed of a human, or at least comprehensible to a human. But, for tasks that are largely inference bottlenecked, it is interesting to think about what is possible if these kind of tasks are massively parallelizable and/or can run at 100x or 1000x their current speed.
This calculus also leads to other interesting questions, as we have done deep research and development on [intricate](https://people.eecs.berkeley.edu/~alanmi/courses/2007_290N/papers/inter_mcmillan_cav03.pdf) and [efficient](https://theory.stanford.edu/~arbrad/papers/arbrad-thesis.pdf) algorithms for automatically model checking these types of protocols. But, if we can run a general  (super) intelligence at 1000x human speed, do these kind of specialized algorithms become increasingly less necessary? Special purpose algorithms might always be more efficient for specific tasks, but in a world where the cost of compute continues to fall we might not care that much, especially if the AI-driven methods are more flexible and general. And instead we can treat the superintelligent as basically a "universal algorithm" for solving a whole variety of these hard tasks at superhuman speed?
