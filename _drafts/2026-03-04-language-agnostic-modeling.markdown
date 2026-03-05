---
layout: post
title:  "Language Agnostic Modeling"
categories: formal-methods
---


```
# ACTION: ClientRequest
Preconditions:
    - Index and term of the server's log must be >= the index and term of the client's request.
    - There must exist a quorum of servers that have a term equal to the term of the client's request.


Postconditions:
 

```

How well does it work to describe abstract state machine models in a language agnostic i.e. English description language?

Allows to compile down to a variety of languages. Either concrete/explicit-state or symbolic (SMT) too?

Is the English language version actually better? Does it obviate the need for the underlying formal language?