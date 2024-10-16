---- MODULE TwoPhase_extract_preds ----
EXTENDS TwoPhase

CONSTANT rm1,rm2,rm3
PredInvDef0 == tmState = "init"
PredInvDef1 == tmState = "committed"
PredInvDef2 == tmState = "aborted"
PredInvDef3 == \A VARRMI \in RM : [type |-> "Prepared", rm |-> VARRMI] \in msgsPrepared
PredInvDef4 == \A VARRMJ \in RM : [type |-> "Prepared", rm |-> VARRMJ] \in msgsPrepared
PredInvDef5 == tmPrepared = RM
PredInvDef6 == \A VARRMI \in RM : tmPrepared = tmPrepared \cup {VARRMI}
PredInvDef7 == \A VARRMJ \in RM : tmPrepared = tmPrepared \cup {VARRMJ}
PredInvDef8 == \A VARRMI \in RM : rmState[VARRMI] = "working"
PredInvDef9 == \A VARRMJ \in RM : rmState[VARRMJ] = "working"
PredInvDef10 == [type |-> "Commit"] \in msgsCommit
PredInvDef11 == [type |-> "Abort"] \in msgsAbort
PredInvDef12 == \A VARRMI \in RM : rmState[VARRMI] = "prepared"
PredInvDef13 == \A VARRMI \in RM : rmState[VARRMI] = "aborted"
PredInvDef14 == \A VARRMI \in RM : rmState[VARRMI] = "committed"
PredInvDef15 == \A VARRMJ \in RM : rmState[VARRMJ] = "prepared"
PredInvDef16 == \A VARRMJ \in RM : rmState[VARRMJ] = "aborted"
PredInvDef17 == \A VARRMJ \in RM : rmState[VARRMJ] = "committed"
====